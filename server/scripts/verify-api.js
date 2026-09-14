const BASE = process.env.API_URL || "http://127.0.0.1:3001/api";
const PASSWORD = process.env.DEMO_PASSWORD || "Demo@1234";

async function request(path, { method = "GET", token, body, expect } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (expect && response.status !== expect) {
    throw new Error(`${method} ${path} expected ${expect}, got ${response.status} ${text}`);
  }
  return { status: response.status, data };
}

async function login(email) {
  const { data } = await request("/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
    expect: 200,
  });
  if (!data.token) throw new Error(`No token for ${email}`);
  return data.token;
}

async function main() {
  await request("/health", { expect: 200 });
  await request("/flats", { expect: 401 });
  await request("/auth/login", { method: "POST", body: { email: "admin@greenfield.local", password: "nope" }, expect: 401 });

  const admin = await login("admin@greenfield.local");
  const security = await login("security@greenfield.local");
  const ec = await login("ec@greenfield.local");
  const resident = await login("resident@greenfield.local");

  const badJson = await fetch(`${BASE}/flats`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin}` },
    body: "{",
  });
  if (badJson.status !== 400) throw new Error(`Invalid JSON expected 400, got ${badJson.status}`);

  await request("/auth/me", { token: admin, expect: 200 });
  const flats = await request("/flats", { token: admin, expect: 200 });
  if (!Array.isArray(flats.data) || flats.data.length !== 104) {
    throw new Error(`Expected 104 flats, got ${flats.data?.length}`);
  }

  await request("/flats", { token: security, expect: 403 });
  await request("/finance", { token: security, expect: 403 });
  await request("/security", { token: security, expect: 200 });
  await request("/access", { token: security, expect: 403 });
  await request("/flats", {
    method: "POST",
    token: ec,
    body: { flat: "A-9A", type: "2BHK", status: "Vacant" },
    expect: 403,
  });

  await request("/flats", {
    method: "POST",
    token: admin,
    body: { flat: "Z-1A", type: "2BHK", status: "Vacant" },
    expect: 400,
  });
  await request("/residents", {
    method: "POST",
    token: admin,
    body: { name: "Ghost", flat: "A-9Z", type: "Owner", phone: "1" },
    expect: 400,
  });
  await request("/tickets", {
    method: "POST",
    token: resident,
    body: { flat: "A-1A", category: "Plumbing", text: "", priority: "Low", owner: "x" },
    expect: 400,
  });

  const created = await request("/flats", {
    method: "POST",
    token: admin,
    body: { flat: "A-9A", type: "2BHK", carpet: "980 sq.ft", uds: "330", parking: "1", status: "Vacant" },
    expect: 201,
  });
  await request("/flats", {
    method: "POST",
    token: admin,
    body: { flat: "A-9A", type: "2BHK", status: "Vacant" },
    expect: 409,
  });
  await request("/tickets", {
    method: "POST",
    token: resident,
    body: { flat: "A-1A", category: "Plumbing", text: "Phase 7 resident ticket", priority: "Low", owner: "Manager" },
    expect: 201,
  });

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    if (created.data?.id) {
      await prisma.flat.delete({ where: { id: created.data.id } }).catch(() => {});
    }
    await prisma.ticket.deleteMany({ where: { description: "Phase 7 resident ticket" } });
  } finally {
    await prisma.$disconnect();
  }

  const after = await request("/flats", { token: admin, expect: 200 });
  if (after.data.length !== 104) throw new Error(`Cleanup left ${after.data.length} flats`);

  console.log("verify_api_ok", {
    flats: after.data.length,
    rolesChecked: ["ADMIN", "SECURITY", "EC", "RESIDENT"],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
