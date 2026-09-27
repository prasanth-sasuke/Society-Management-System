import { Router } from "express";
import { prisma } from "./prisma.js";
import { asyncHandler } from "./http.js";
import { requireAuth, requirePermission } from "./auth/middleware.js";
import {
  assetCreateSchema,
  assetUpdateSchema,
  bankAccountSchema,
  billGenerateSchema,
  billUpdateSchema,
  bookingCreateSchema,
  bookingUpdateSchema,
  flatCreateSchema,
  flatUpdateSchema,
  loginSchema,
  paymentCreateSchema,
  residentCreateSchema,
  residentUpdateSchema,
  ticketCreateSchema,
  ticketUpdateSchema,
  validate,
  vendorCreateSchema,
  vendorUpdateSchema,
  userCreateSchema,
  voucherCreateSchema,
} from "./validate.js";
import * as catalog from "./services/catalog.js";
import * as auth from "./services/auth.js";
import * as billing from "./services/billing.js";
import * as records from "./services/records.js";
import * as operations from "./services/operations.js";

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

api.post("/users", requireAuth, requirePermission("users", "write"), validate(userCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await auth.createUser(req.body));
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

api.patch("/flats/:id", requireAuth, requirePermission("property", "write"), validate(flatUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await records.updateFlat(req.params.id, req.body));
}));

api.delete("/flats/:id", requireAuth, requirePermission("property", "write"), asyncHandler(async (req, res) => {
  res.json(await records.deleteFlat(req.params.id));
}));

api.get("/residents", ...authRead("residents", async (_req, res) => {
  res.json(await catalog.listResidents());
}));

api.post("/residents", requireAuth, requirePermission("residents", "write"), validate(residentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await catalog.createResident(req.body));
}));

api.patch("/residents/:id", requireAuth, requirePermission("residents", "write"), validate(residentUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await records.updateResident(req.params.id, req.body));
}));

api.post("/residents/:id/move-out", requireAuth, requirePermission("residents", "write"), asyncHandler(async (req, res) => {
  res.json(await records.moveOutResident(req.params.id));
}));

api.get("/move-events", ...authRead("residents", async (_req, res) => {
  res.json(await catalog.listMoveEvents());
}));

api.get("/bills", ...authRead("billing", async (_req, res) => {
  res.json(await catalog.listBills());
}));

api.post("/bills/generate", requireAuth, requirePermission("billing", "write"), validate(billGenerateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await billing.generateBills(req.body));
}));

api.patch("/bills/:id", requireAuth, requirePermission("billing", "write"), validate(billUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await records.updateBill(req.params.id, req.body));
}));

api.delete("/bills/:id", requireAuth, requirePermission("billing", "write"), asyncHandler(async (req, res) => {
  res.json(await records.deleteBill(req.params.id));
}));

api.post("/bills/:id/payments", requireAuth, requirePermission("billing", "write"), validate(paymentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await billing.recordPayment(req.params.id, req.body));
}));

api.get("/finance", ...authRead("finance", async (_req, res) => {
  res.json(await catalog.listFinance());
}));

api.post("/vouchers", requireAuth, requirePermission("finance", "write"), validate(voucherCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await billing.createVoucher(req.body));
}));

api.post("/vouchers/:id/approve", requireAuth, requirePermission("finance", "write"), asyncHandler(async (req, res) => {
  res.json(await billing.approveVoucher(req.params.id));
}));

api.post("/bank-accounts", requireAuth, requirePermission("finance", "write"), validate(bankAccountSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await operations.createBankAccount(req.body));
}));

api.patch("/bank-accounts/:id", requireAuth, requirePermission("finance", "write"), validate(bankAccountSchema), asyncHandler(async (req, res) => {
  res.json(await operations.updateBankAccount(req.params.id, req.body));
}));

api.delete("/bank-accounts/:id", requireAuth, requirePermission("finance", "write"), asyncHandler(async (req, res) => {
  res.json(await operations.deleteBankAccount(req.params.id));
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

api.patch("/tickets/:id", requireAuth, requirePermission("helpdesk", "write"), validate(ticketUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await operations.updateTicket(req.params.id, req.body));
}));

api.delete("/tickets/:id", requireAuth, requirePermission("helpdesk", "write"), asyncHandler(async (req, res) => {
  res.json(await operations.deleteTicket(req.params.id));
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

api.patch("/vendors/:id", requireAuth, requirePermission("vendors", "write"), validate(vendorUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await operations.updateVendor(req.params.id, req.body));
}));

api.delete("/vendors/:id", requireAuth, requirePermission("vendors", "write"), asyncHandler(async (req, res) => {
  res.json(await operations.deleteVendor(req.params.id));
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

api.patch("/assets/:id", requireAuth, requirePermission("vendors", "write"), validate(assetUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await operations.updateAsset(req.params.id, req.body));
}));

api.delete("/assets/:id", requireAuth, requirePermission("vendors", "write"), asyncHandler(async (req, res) => {
  res.json(await operations.deleteAsset(req.params.id));
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

api.patch("/bookings/:id", requireAuth, requirePermission("facility", "write"), validate(bookingUpdateSchema), asyncHandler(async (req, res) => {
  res.json(await operations.updateBooking(req.params.id, req.body));
}));

api.delete("/bookings/:id", requireAuth, requirePermission("facility", "write"), asyncHandler(async (req, res) => {
  res.json(await operations.deleteBooking(req.params.id));
}));

api.get("/security", ...authRead("security", async (_req, res) => {
  res.json(await catalog.listSecurity());
}));
