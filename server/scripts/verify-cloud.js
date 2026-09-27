import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadCloudEnv, redactUrl, serverDir } from "./cloud-env.js";

const migrationsDir = path.join(serverDir, "prisma", "migrations");

function count(url, table) {
  const result = spawnSync(
    "psql",
    [url, "-tAc", `SELECT COUNT(*) FROM ${table}`],
    { encoding: "utf8", env: { ...process.env, PGSSLMODE: "require" } }
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `count ${table} failed`).trim());
  }
  return Number(String(result.stdout).trim() || 0);
}

async function main() {
  const cloud = await loadCloudEnv();
  console.log("Checking", redactUrl(cloud.DATABASE_URL));

  const ping = spawnSync("psql", [cloud.DIRECT_URL, "-tAc", "SELECT 1"], {
    encoding: "utf8",
    env: { ...process.env, PGSSLMODE: "require" },
  });
  if (ping.status !== 0) {
    throw new Error((ping.stderr || ping.stdout || "Neon ping failed").trim());
  }

  const societies = count(cloud.DIRECT_URL, "societies");
  const flats = count(cloud.DIRECT_URL, "flats");
  const users = count(cloud.DIRECT_URL, "users");
  const superadmins = count(cloud.DIRECT_URL, "users WHERE role = 'SUPERADMIN' AND active");
  const applied = count(cloud.DIRECT_URL, "_prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL");
  const expected = readdirSync(migrationsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length;

  console.log("Neon connection OK");
  console.log(JSON.stringify({ societies, flats, users, superadmins, migrations: `${applied}/${expected}` }, null, 2));

  if (societies < 1 || superadmins < 1) {
    throw new Error("Cloud database has no society or no active superadmin. On an empty database, run `npm run prisma:seed:cloud`.");
  }
  if (applied < expected) {
    throw new Error(`Only ${applied} of ${expected} migrations are applied on Neon. Redeploy on Render (it runs prisma migrate deploy on start).`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
