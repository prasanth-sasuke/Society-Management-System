import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
export const serverDir = path.resolve(scriptsDir, "..");
export const repoRoot = path.resolve(serverDir, "..");

export function parseEnvFile(filePath) {
  const env = {};
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function redactUrl(value) {
  return String(value).replace(/\/\/([^:/@]+):([^@/]+)@/, "//$1:***@");
}

export function withSsl(url) {
  if (/[?&]sslmode=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

function hostnameFromUrl(url) {
  return new URL(url.replace(/^postgresql:/, "http:")).hostname;
}

function appendQuery(url, key, value) {
  if (new URL(url.replace(/^postgresql:/, "http:")).searchParams.has(key)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

function resolveWithPublicDns(hostname) {
  const result = spawnSync("dig", ["@8.8.8.8", "+short", hostname, "A"], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return (result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^\d+\.\d+\.\d+\.\d+$/.test(line)) || null;
}

async function withHostaddr(url) {
  if (/[?&]hostaddr=/.test(url)) return url;
  const hostname = hostnameFromUrl(url);
  try {
    await dns.lookup(hostname);
    return url;
  } catch {
    const ip = resolveWithPublicDns(hostname);
    if (!ip) {
      throw new Error(`Could not resolve ${hostname} via local DNS or 8.8.8.8.`);
    }
    return appendQuery(url, "hostaddr", ip);
  }
}

export function loadLocalEnv() {
  const filePath = path.join(repoRoot, ".env");
  if (!existsSync(filePath)) {
    throw new Error("Missing repo-root .env with local DATABASE_URL.");
  }
  const env = parseEnvFile(filePath);
  if (!env.DATABASE_URL) {
    throw new Error("Local .env is missing DATABASE_URL.");
  }
  return env;
}

export async function loadCloudEnv() {
  const filePath = path.join(repoRoot, ".env.cloud");
  if (!existsSync(filePath)) {
    throw new Error(
      "Missing .env.cloud. Copy .env.cloud.example, paste the Neon pooled DATABASE_URL and unpooled DIRECT_URL (both sslmode=require), then rerun."
    );
  }
  const env = parseEnvFile(filePath);
  if (!env.DATABASE_URL || !env.DIRECT_URL) {
    throw new Error(".env.cloud must set DATABASE_URL (pooled) and DIRECT_URL (unpooled).");
  }
  if (/localhost|127\.0\.0\.1/.test(env.DATABASE_URL) || /localhost|127\.0\.0\.1/.test(env.DIRECT_URL)) {
    throw new Error(".env.cloud still points at localhost. Put Neon URLs there, not the local database.");
  }
  return {
    ...env,
    DATABASE_URL: await withHostaddr(withSsl(env.DATABASE_URL)),
    DIRECT_URL: await withHostaddr(withSsl(env.DIRECT_URL)),
  };
}
