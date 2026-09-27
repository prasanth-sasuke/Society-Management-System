// Smoke test for a running API. Works on an empty database: signs in as the superadmin,
// creates temporary logins for a few roles, checks what each role may do, then deletes them.
// Usage (server running locally):  npm run verify:api
import { randomBytes } from "node:crypto";

const BASE = (process.env.API_URL || "http://127.0.0.1:3001/api").replace(/\/$/, "");
const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD (they are read from .env by `npm run verify:api`).");
}

async function request(path, { method = "GET", token, body, raw, expect } = {}) {
  const headers = {};
  if (body !== undefined || raw !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${path}`, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  if (expect && response.status !== expect) {
    throw new Error(`${method} ${path} expected ${expect}, got ${response.status} ${text.slice(0, 200)}`);
  }
  return { status: response.status, data };
}

const login = async (email, password) => (await request("/auth/login", { method: "POST", body: { email, password }, expect: 200 })).data.token;

async function main() {
  const health = await request("/health", { expect: 200 });
  if (health.data.db !== "up") throw new Error("API is up but the database is down.");
  await request("/flats", { expect: 401 });
  await request("/auth/login", { method: "POST", body: { email: SUPERADMIN_EMAIL, password: "definitely-wrong" }, expect: 401 });

  const admin = await login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  await request("/auth/me", { token: admin, expect: 200 });
  await request("/flats", { method: "POST", token: admin, raw: "{", expect: 400 });
  await request("/flats", { method: "POST", token: admin, body: { flat: "not a flat", type: "2BHK", status: "Vacant" }, expect: 400 });

  const suffix = randomBytes(4).toString("hex");
  const created = [];
  const tokens = {};
  try {
    for (const role of ["SECURITY", "EC", "ACCOUNTANT"]) {
      const email = `verify-${role.toLowerCase()}-${suffix}@test.local`;
      const password = randomBytes(12).toString("base64url");
      const { data } = await request("/users", { method: "POST", token: admin, body: { name: `Verify ${role}`, email, password, role }, expect: 201 });
      created.push(data.id);
      tokens[role] = await login(email, password);
    }

    await request("/security", { token: tokens.SECURITY, expect: 200 });
    await request("/finance", { token: tokens.SECURITY, expect: 403 });
    await request("/access", { token: tokens.SECURITY, expect: 403 });
    await request("/flats", { method: "POST", token: tokens.EC, body: { flat: "A-1A", type: "2BHK", status: "Vacant" }, expect: 403 });
    await request("/finance", { token: tokens.EC, expect: 200 });
    await request("/finance", { token: tokens.ACCOUNTANT, expect: 200 });
    await request("/staff", { token: tokens.ACCOUNTANT, expect: 403 });
    const dash = await request("/dashboard", { token: tokens.SECURITY, expect: 200 });
    if (dash.data.money) throw new Error("Security role should not see money figures on the dashboard.");
  } finally {
    for (const id of created) await request(`/users/${id}`, { method: "DELETE", token: admin }).catch(() => {});
  }

  console.log("verify_api_ok", { api: BASE, rolesChecked: ["SUPERADMIN", "SECURITY", "EC", "ACCOUNTANT"], tempLoginsRemoved: created.length });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
