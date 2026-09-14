import { spawnSync } from "node:child_process";
import { loadCloudEnv, redactUrl } from "./cloud-env.js";

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
  const blocks = count(cloud.DIRECT_URL, "blocks");
  const flats = count(cloud.DIRECT_URL, "flats");
  const users = count(cloud.DIRECT_URL, "users");
  const tickets = count(cloud.DIRECT_URL, "tickets");

  console.log("Neon connection OK");
  console.log(JSON.stringify({ societies, blocks, flats, users, tickets }, null, 2));

  if (societies < 1 || blocks !== 5 || flats !== 104 || users < 9) {
    throw new Error(
      "Cloud row counts do not match the demo seed (1 society, 5 blocks, 104 flats, 9+ users)."
    );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
