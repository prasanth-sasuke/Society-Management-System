import { CATALOG_MODULE, canRead, clearToken, getToken } from "./auth.js";

const API_BASE = import.meta.env.VITE_API_URL || "";

const CATALOG_PATHS = {
  society: "/api/society",
  dashboard: "/api/dashboard",
  access: "/api/access",
  blocks: "/api/blocks",
  flats: "/api/flats",
  residents: "/api/residents",
  moveEvents: "/api/move-events",
  bills: "/api/bills",
  finance: "/api/finance",
  tickets: "/api/tickets",
  staff: "/api/staff",
  roster: "/api/roster",
  followUps: "/api/follow-ups",
  vendors: "/api/vendors",
  quotations: "/api/quotations",
  invoices: "/api/invoices",
  assets: "/api/assets",
  amc: "/api/amc",
  reminders: "/api/reminders",
  breakdowns: "/api/breakdowns",
  facilities: "/api/facilities",
  bookings: "/api/bookings",
  security: "/api/security",
};

const CREATE_PATHS = {
  flat: "/api/flats",
  resident: "/api/residents",
  ticket: "/api/tickets",
  vendor: "/api/vendors",
  asset: "/api/assets",
  booking: "/api/bookings",
  user: "/api/users",
  billGenerate: "/api/bills/generate",
  payment: (body) => `/api/bills/${encodeURIComponent(body.billId)}/payments`,
  voucher: "/api/vouchers",
  flatEdit: { method: "PATCH", path: (body) => `/api/flats/${encodeURIComponent(body.id)}` },
  residentEdit: { method: "PATCH", path: (body) => `/api/residents/${encodeURIComponent(body.id)}` },
  billEdit: { method: "PATCH", path: (body) => `/api/bills/${encodeURIComponent(body.id)}` },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function formatApiError(err) {
  if (err instanceof ApiError && Array.isArray(err.details) && err.details.length) {
    return err.details
      .map((item) => item.message || [item.path, item.message].filter(Boolean).join(": "))
      .join(" ");
  }
  if (err instanceof TypeError) {
    return "Could not reach the API. Check your connection and try again.";
  }
  return err?.message || "Request failed.";
}

async function request(path, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw err instanceof TypeError ? err : new ApiError(err.message || "Network error", 0, null);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login") {
      clearToken();
    }
    throw new ApiError(data?.error || response.statusText || "Request failed", response.status, data?.details ?? null);
  }
  return data;
}

export function loginRequest(email, password) {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function fetchSession() {
  return request("/api/auth/me");
}

export function logoutRequest() {
  return request("/api/auth/logout", { method: "POST" }).catch(() => ({ ok: true }));
}

export async function fetchCatalog(permissions) {
  const jobs = Object.entries(CATALOG_PATHS).filter(([key]) => canRead(permissions, CATALOG_MODULE[key]));
  const results = await Promise.allSettled(jobs.map(async ([key, path]) => [key, await request(path)]));
  const catalog = {};
  const failed = [];
  results.forEach((result, index) => {
    const key = jobs[index][0];
    if (result.status === "fulfilled") {
      catalog[key] = result.value[1];
      return;
    }
    const err = result.reason;
    if (err?.status === 401) throw err;
    failed.push(key);
  });
  if (!catalog.society && !catalog.dashboard) {
    throw results.find((result) => result.status === "rejected")?.reason || new ApiError("Could not load society data.", 500, null);
  }
  catalog._failed = failed;
  return catalog;
}

export function createRecord(kind, body) {
  const target = CREATE_PATHS[kind];
  if (!target) throw new Error(`Unknown create form: ${kind}`);
  const spec = typeof target === "object" ? target : { method: "POST", path: target };
  const path = typeof spec.path === "function" ? spec.path(body) : spec.path;
  return request(path, { method: spec.method, body: JSON.stringify(body) });
}

export function approveVoucherRequest(id) {
  return request(`/api/vouchers/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export function deleteFlatRequest(id) {
  return request(`/api/flats/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function moveOutResidentRequest(id) {
  return request(`/api/residents/${encodeURIComponent(id)}/move-out`, { method: "POST" });
}

export function deleteBillRequest(id) {
  return request(`/api/bills/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function toastForCreate(kind, created) {
  if (kind === "flat") return `Flat ${created.flat} added to the register.`;
  if (kind === "resident") return `${created.name} added to the residents directory.`;
  if (kind === "ticket") return `${created.id} raised and assigned.`;
  if (kind === "vendor") return `${created.name} empanelled.`;
  if (kind === "asset") return `Asset ${created.tag} tagged.`;
  if (kind === "booking") return `${created.facility} booked for ${created.flat} on ${created.date}.`;
  if (kind === "user") return `Login created for ${created.email}.`;
  if (kind === "billGenerate") {
    const skipped = created.skipped ? ` (${created.skipped} already billed, skipped)` : "";
    return `${created.period}: ${created.created} bills raised — ${created.total}${skipped}.`;
  }
  if (kind === "payment") {
    return created.fullyPaid
      ? `${created.receiptNo} — ${created.flat} paid ${created.amount}. Bill cleared.`
      : `${created.receiptNo} — ${created.flat} paid ${created.amount}. ${created.remaining} still due.`;
  }
  if (kind === "voucher") return `${created.no} saved — ${created.amount} (${created.state}).`;
  if (kind === "flatEdit") return `Flat ${created.flat} updated.`;
  if (kind === "residentEdit") return `${created.name} updated.`;
  if (kind === "billEdit") return `${created.flat} bill for ${created.period} updated.`;
  return "Saved.";
}
