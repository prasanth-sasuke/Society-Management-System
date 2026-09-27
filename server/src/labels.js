import { AppError } from "./http.js";

export const FLAT_TYPE = {
  BHK1: "1BHK",
  BHK2: "2BHK",
  BHK3: "3BHK",
  BHK4: "4BHK",
};

export const OCCUPANCY = {
  OWNER_OCCUPIED: "Owner-occupied",
  TENANT: "Tenant",
  VACANT: "Vacant",
};

export const RESIDENT_TYPE = {
  OWNER: "Owner",
  TENANT: "Tenant",
};

export const BILL_STATUS = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  PART_PAID: "Part paid",
};

export const VOUCHER_STATUS = {
  DRAFT: "Draft",
  EC_APPROVAL: "EC approval",
  APPROVED: "Approved",
};

export const TICKET_CATEGORY = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  LIFT: "Lift",
  HOUSEKEEPING: "Housekeeping",
  SECURITY: "Security",
  CARPENTRY: "Carpentry",
  FACILITY: "Facility",
};

export const TICKET_PRIORITY = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

export const TICKET_STATUS = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  AWAITING_VENDOR: "Awaiting vendor",
  RESOLVED: "Resolved",
};

export const PAYMENT_STATE = { CLEAR: "Clear", DUE: "Due" };

export const ASSET_CONDITION = {
  GOOD: "Good",
  MONITOR: "Monitor",
  UNDER_REPAIR: "Under repair",
  OUT_OF_SERVICE: "Out of service",
  REFILL_DUE: "Refill due",
};

export const BOOKING_PAY = {
  PAID: "Paid",
  PENDING: "Pending",
  AWAITING_APPROVAL: "Awaiting approval",
  NA: "N/A",
};

export const FACILITY_STATUS = {
  AVAILABLE: "Available",
  BOOKED: "Booked",
  PARTLY_BOOKED: "Partly booked",
  MAINTENANCE: "Maintenance",
};

export function fromLabel(map, value, field) {
  if (value == null || String(value).trim() === "") {
    throw new AppError(400, `${field} is required`);
  }
  const raw = String(value).trim();
  if (Object.prototype.hasOwnProperty.call(map, raw)) return raw;
  const found = Object.entries(map).find(([, label]) => label.toLowerCase() === raw.toLowerCase());
  if (found) return found[0];
  throw new AppError(400, `Invalid ${field}: ${value}`);
}

export function money(value) {
  if (value == null) return null;
  return Number(value);
}

export function inr(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export function parseSqft(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const n = parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseCount(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return value;
  const n = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parseFlatCode(code) {
  const match = String(code || "").trim().toUpperCase().match(/^([A-Z])-(\d)([A-Z])$/);
  if (!match) return null;
  return {
    code: `${match[1]}-${match[2]}${match[3]}`,
    blockCode: match[1],
    floor: Number(match[2]),
    unitLabel: `${match[2]}${match[3]}`,
  };
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayLabel(date) {
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function parseLooseDate(value) {
  if (!value) return new Date();
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime()) && /^\d{4}/.test(String(value))) return direct;
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const m = String(value).trim().match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/);
  if (m && months[m[2].toLowerCase()] != null) {
    return new Date(Date.UTC(Number(m[3] || new Date().getUTCFullYear()), months[m[2].toLowerCase()], Number(m[1])));
  }
  const m2 = String(value).trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (m2 && months[m2[1].toLowerCase()] != null) {
    return new Date(Date.UTC(Number(m2[2]), months[m2[1].toLowerCase()], 1));
  }
  return new Date();
}
