import { Router } from "express";
import { prisma } from "./prisma.js";
import { asyncHandler } from "./http.js";
import { requireAuth, requirePermission } from "./auth/middleware.js";
import {
  assetCreateSchema,
  bookingCreateSchema,
  flatCreateSchema,
  loginSchema,
  residentCreateSchema,
  ticketCreateSchema,
  validate,
  vendorCreateSchema,
} from "./validate.js";
import * as catalog from "./services/catalog.js";
import * as auth from "./services/auth.js";

export const api = Router();

function authRead(moduleName, handler) {
  return [requireAuth, requirePermission(moduleName, "read"), asyncHandler(handler)];
}

api.get("/health", asyncHandler(async (_req, res) => {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  res.json({ ok: true, service: "society-management-api", db });
}));

api.post("/auth/login", validate(loginSchema), asyncHandler(async (req, res) => {
  res.json(await auth.login(req.body.email, req.body.password));
}));

api.get("/auth/me", requireAuth, asyncHandler(async (req, res) => {
  res.json(auth.currentSession(req.user));
}));

api.post("/auth/logout", requireAuth, asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

api.get("/access", ...authRead("users", async (_req, res) => {
  res.json(await auth.listAccess());
}));

api.get("/society", requireAuth, asyncHandler(async (_req, res) => {
  res.json(await catalog.getSocietyPayload());
}));

api.get("/dashboard", requireAuth, asyncHandler(async (req, res) => {
  res.json(auth.filterDashboard(await catalog.getDashboard(), req.user.permissions));
}));

api.get("/blocks", ...authRead("property", async (_req, res) => {
  res.json(await catalog.listBlocks());
}));

api.get("/flats", ...authRead("property", async (_req, res) => {
  res.json(await catalog.listFlats());
}));

api.post("/flats", requireAuth, requirePermission("property", "write"), validate(flatCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createFlat(req.body));
}));

api.get("/residents", ...authRead("residents", async (_req, res) => {
  res.json(await catalog.listResidents());
}));

api.post("/residents", requireAuth, requirePermission("residents", "write"), validate(residentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createResident(req.body));
}));

api.get("/move-events", ...authRead("residents", async (_req, res) => {
  res.json(await catalog.listMoveEvents());
}));

api.get("/bills", ...authRead("billing", async (_req, res) => {
  res.json(await catalog.listBills());
}));

api.get("/finance", ...authRead("finance", async (_req, res) => {
  res.json(await catalog.listFinance());
}));

api.get("/tickets", ...authRead("helpdesk", async (_req, res) => {
  res.json(await catalog.listTickets());
}));

api.get("/tickets/:ticketNo", ...authRead("helpdesk", async (req, res) => {
  res.json(await catalog.getTicket(req.params.ticketNo));
}));

api.post("/tickets", requireAuth, requirePermission("helpdesk", "write"), validate(ticketCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createTicket(req.body));
}));

api.get("/staff", ...authRead("staff", async (_req, res) => {
  res.json(await catalog.listStaff());
}));

api.get("/roster", ...authRead("staff", async (_req, res) => {
  res.json(await catalog.listRoster());
}));

api.get("/follow-ups", ...authRead("staff", async (_req, res) => {
  res.json(await catalog.listFollowUps());
}));

api.get("/vendors", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listVendors());
}));

api.post("/vendors", requireAuth, requirePermission("vendors", "write"), validate(vendorCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createVendor(req.body));
}));

api.get("/quotations", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listQuotations());
}));

api.get("/invoices", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listInvoices());
}));

api.get("/assets", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listAssets());
}));

api.post("/assets", requireAuth, requirePermission("vendors", "write"), validate(assetCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createAsset(req.body));
}));

api.get("/amc", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listAmc());
}));

api.get("/reminders", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listReminders());
}));

api.get("/breakdowns", ...authRead("vendors", async (_req, res) => {
  res.json(await catalog.listBreakdowns());
}));

api.get("/facilities", ...authRead("facility", async (_req, res) => {
  res.json(await catalog.listFacilities());
}));

api.get("/bookings", ...authRead("facility", async (_req, res) => {
  res.json(await catalog.listBookings());
}));

api.post("/bookings", requireAuth, requirePermission("facility", "write"), validate(bookingCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createBooking(req.body));
}));

api.get("/security", ...authRead("security", async (_req, res) => {
  res.json(await catalog.listSecurity());
}));
