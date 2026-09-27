// Backs up the Neon (production) database to dumps/neon-<timestamp>.dump (gitignored).
// Uses the local pg_dump when its major version matches the server, otherwise the official
// postgres Docker image of the right version. Keeps the newest KEEP backups.
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadCloudEnv, repoRoot } from "./cloud-env.js";

const KEEP = Number(process.env.BACKUP_KEEP || 14);
const dumpsDir = path.join(repoRoot, "dumps");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options, env: { ...process.env, ...options.env } });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).replace(/postgresql:\/\/\S+/g, "<database-url>").trim());
  }
  return result.stdout || "";
}

function localMajor(bin) {
  const found = spawnSync(bin, ["--version"], { encoding: "utf8" });
  if (found.status !== 0) return null;
  return Number((found.stdout.match(/(\d+)\.\d+/) || [])[1]) || null;
}

const env = await loadCloudEnv();
const serverVersion = run("psql", [env.DIRECT_URL, "-tAc", "SHOW server_version"]).trim();
const major = Number(serverVersion.split(".")[0]);
const useDocker = localMajor("pg_dump") !== major;

mkdirSync(dumpsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 13);
const file = `neon-${stamp}.dump`;
const target = path.join(dumpsDir, file);

console.log(`Neon PostgreSQL ${serverVersion} → dumps/${file}${useDocker ? ` (using Docker postgres:${major}-alpine)` : ""}`);

// The URL (with its password) is passed as an environment variable, never on the command line.
function pgTool(tool, args) {
  if (!useDocker) return run(tool, args.map((a) => (a === "$DB_URL" ? env.DIRECT_URL : a.replace("/backup/", `${dumpsDir}/`))));
  const script = `${tool} ${args.map((a) => (a === "$DB_URL" ? '"$DB_URL"' : `'${a}'`)).join(" ")}`;
  return run("docker", ["run", "--rm", "--network", "host", "-e", "DB_URL", "-v", `${dumpsDir}:/backup`, "--user", `${process.getuid()}:${process.getgid()}`, `postgres:${major}-alpine`, "sh", "-c", script], { env: { DB_URL: env.DIRECT_URL } });
}

pgTool("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=/backup/${file}`, "$DB_URL"]);

const listing = pgTool("pg_restore", ["--list", `/backup/${file}`]);
const tables = listing.split("\n").filter((line) => / TABLE DATA /.test(line)).length;
const size = statSync(target).size;
if (!tables || size < 1024) throw new Error(`Backup looks empty (${tables} tables, ${size} bytes). Check the output above.`);
console.log(`✔ Backup verified: ${tables} tables, ${(size / 1024).toFixed(0)} KB`);

const backups = readdirSync(dumpsDir).filter((name) => /^neon-\d{8}-\d{4}\.dump$/.test(name)).sort();
for (const old of backups.slice(0, Math.max(0, backups.length - KEEP))) {
  rmSync(path.join(dumpsDir, old));
  console.log(`Removed old backup dumps/${old}`);
}
if (!existsSync(target)) throw new Error("Backup file disappeared.");
