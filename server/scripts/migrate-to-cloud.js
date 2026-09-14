import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { loadCloudEnv, loadLocalEnv, redactUrl, repoRoot, serverDir } from "./cloud-env.js";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
    env: { ...process.env, ...options.env },
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `${command} failed`).trim();
    throw new Error(detail);
  }
  return result.stdout || "";
}

function requireBin(name) {
  const result = spawnSync("which", [name], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Missing ${name} on PATH. Install PostgreSQL client tools.`);
  }
}

function psql(url, extraArgs) {
  return run("psql", [url, "-v", "ON_ERROR_STOP=1", ...extraArgs], {
    env: { PGSSLMODE: "require" },
  });
}

function cloudFlatCount(directUrl) {
  const result = spawnSync(
    "psql",
    [directUrl, "-tAc", "SELECT COUNT(*) FROM flats"],
    { encoding: "utf8", env: { ...process.env, PGSSLMODE: "require" } }
  );
  if (result.status !== 0) return 0;
  return Number(String(result.stdout).trim() || 0);
}

function appliedMigrations(url) {
  const result = spawnSync(
    "psql",
    [url, "-tAc", "SELECT migration_name FROM _prisma_migrations ORDER BY started_at"],
    { encoding: "utf8", env: { ...process.env, PGSSLMODE: "require" } }
  );
  if (result.status !== 0) return [];
  return String(result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function applyPrismaMigrations(url) {
  psql(url, [
    "-c",
    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );`,
  ]);

  const migrationsDir = path.join(serverDir, "prisma/migrations");
  const names = readdirSync(migrationsDir)
    .filter((name) => existsSync(path.join(migrationsDir, name, "migration.sql")))
    .sort();
  const already = new Set(appliedMigrations(url));

  for (const name of names) {
    if (already.has(name)) {
      console.log(`Migration already applied: ${name}`);
      continue;
    }
    const filePath = path.join(migrationsDir, name, "migration.sql");
    const checksum = createHash("sha256").update(readFileSync(filePath)).digest("hex");
    console.log(`Applying migration ${name}...`);
    psql(url, ["-f", filePath]);
    psql(url, [
      "-c",
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
       VALUES ('${randomUUID()}', '${checksum}', NOW(), '${name}', 1);`,
    ]);
  }
}

async function main() {
  requireBin("pg_dump");
  requireBin("psql");

  const local = loadLocalEnv();
  const cloud = await loadCloudEnv();

  console.log("Local:", redactUrl(local.DATABASE_URL));
  console.log("Cloud pooled:", redactUrl(cloud.DATABASE_URL));
  console.log("Cloud direct:", redactUrl(cloud.DIRECT_URL));

  const existingFlats = cloudFlatCount(cloud.DIRECT_URL);
  if (existingFlats > 0 && process.env.FORCE !== "1") {
    throw new Error(
      `Cloud already has ${existingFlats} flats. Refusing to overwrite. Re-run with FORCE=1 to replace cloud data.`
    );
  }

  console.log("Applying Prisma migrations to Neon (schema only)...");
  applyPrismaMigrations(cloud.DIRECT_URL);

  if (existingFlats > 0 && process.env.FORCE === "1") {
    console.log("FORCE=1: truncating existing cloud rows before restore...");
    psql(cloud.DIRECT_URL, [
      "-c",
      "DO $$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$;",
    ]);
  }

  const dumpDir = path.join(repoRoot, "dumps");
  mkdirSync(dumpDir, { recursive: true });
  const dumpFile = path.join(dumpDir, "society-public-data.sql");
  if (existsSync(dumpFile)) rmSync(dumpFile);

  console.log("Dumping local public data (excluding _prisma_migrations)...");
  run("pg_dump", [
    `--dbname=${local.DATABASE_URL}`,
    "--schema=public",
    "--data-only",
    "--no-owner",
    "--no-acl",
    "--exclude-table-data=_prisma_migrations",
    `--file=${dumpFile}`,
  ]);

  console.log("Restoring data to Neon...");
  psql(cloud.DIRECT_URL, ["-f", dumpFile]);

  console.log("Cloud migrate finished. Run: npm run verify:cloud");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
