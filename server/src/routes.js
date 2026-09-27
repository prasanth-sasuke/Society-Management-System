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
  staffSchema,
  attendanceSaveSchema,
  rosterDutySchema,
  followUpSchema,
  shiftSchema,
  guardEntrySchema,
  handoverSchema,
  patrolPointSchema,
  patrolUpdateSchema,
  incidentSchema,
  quotationSchema,
  invoiceSchema,
  amcSchema,
  breakdownSchema,
} from "./validate.js";
import * as catalog from "./services/catalog.js";
import * as auth from "./services/auth.js";
import * as billing from "./services/billing.js";
import * as records from "./services/records.js";
import * as operations from "./services/operations.js";
import * as staffing from "./services/staffing.js";
import * as security from "./services/security.js";
import * as maintenance from "./services/maintenance.js";

export const api = Router();

function authRead(moduleName, handler) {
  return [requireAuth, requirePermission(moduleName, "read"), asyncHandler(handler)];
}

function authWrite(moduleName, schema, handler) {
  return [requireAuth, requirePermission(moduleName, "write"), ...(schema ? [validate(schema)] : []), asyncHandler(handler)];
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
  res.json(await staffing.listStaff());
}));

api.post("/staff", ...authWrite("staff", staffSchema, async (req, res) => {
  res.status(201).json(await staffing.createStaff(req.body));
}));

api.patch("/staff/:id", ...authWrite("staff", staffSchema, async (req, res) => {
  res.json(await staffing.updateStaff(req.params.id, req.body));
}));

api.delete("/staff/:id", ...authWrite("staff", null, async (req, res) => {
  res.json(await staffing.deleteStaff(req.params.id));
}));

api.get("/staff-attendance", ...authRead("staff", async (req, res) => {
  res.json(await staffing.getAttendance(String(req.query.date || "")));
}));

api.put("/staff-attendance", ...authWrite("staff", attendanceSaveSchema, async (req, res) => {
  res.json(await staffing.saveAttendance(req.body));
}));

api.get("/roster", ...authRead("staff", async (_req, res) => {
  res.json(await staffing.listRoster());
}));

api.post("/roster", ...authWrite("staff", rosterDutySchema, async (req, res) => {
  res.status(201).json(await staffing.createDuty(req.body));
}));

api.patch("/roster/:id", ...authWrite("staff", rosterDutySchema, async (req, res) => {
  res.json(await staffing.updateDuty(req.params.id, req.body));
}));

api.delete("/roster/:id", ...authWrite("staff", null, async (req, res) => {
  res.json(await staffing.deleteDuty(req.params.id));
}));

api.get("/follow-ups", ...authRead("staff", async (_req, res) => {
  res.json(await staffing.listFollowUps());
}));

api.post("/follow-ups", ...authWrite("staff", followUpSchema, async (req, res) => {
  res.status(201).json(await staffing.createFollowUp(req.body));
}));

api.patch("/follow-ups/:id", ...authWrite("staff", followUpSchema, async (req, res) => {
  res.json(await staffing.updateFollowUp(req.params.id, req.body));
}));

api.delete("/follow-ups/:id", ...authWrite("staff", null, async (req, res) => {
  res.json(await staffing.deleteFollowUp(req.params.id));
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
  res.json(await maintenance.listQuotations());
}));

api.post("/quotations", ...authWrite("vendors", quotationSchema, async (req, res) => {
  res.status(201).json(await maintenance.createQuotation(req.body));
}));

api.patch("/quotations/:id", ...authWrite("vendors", quotationSchema, async (req, res) => {
  res.json(await maintenance.updateQuotation(req.params.id, req.body));
}));

api.delete("/quotations/:id", ...authWrite("vendors", null, async (req, res) => {
  res.json(await maintenance.deleteQuotation(req.params.id));
}));

api.get("/invoices", ...authRead("vendors", async (_req, res) => {
  res.json(await maintenance.listInvoices());
}));

api.post("/invoices", ...authWrite("vendors", invoiceSchema, async (req, res) => {
  res.status(201).json(await maintenance.createInvoice(req.body));
}));

api.patch("/invoices/:id", ...authWrite("vendors", invoiceSchema, async (req, res) => {
  res.json(await maintenance.updateInvoice(req.params.id, req.body));
}));

api.delete("/invoices/:id", ...authWrite("vendors", null, async (req, res) => {
  res.json(await maintenance.deleteInvoice(req.params.id));
}));

api.post("/invoices/:id/pay", requireAuth, requirePermission("vendors", "write"), requirePermission("finance", "write"), asyncHandler(async (req, res) => {
  res.json(await maintenance.payInvoice(req.params.id));
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
  res.json(await maintenance.listAmc());
}));

api.post("/amc", ...authWrite("vendors", amcSchema, async (req, res) => {
  res.status(201).json(await maintenance.createAmc(req.body));
}));

api.patch("/amc/:id", ...authWrite("vendors", amcSchema, async (req, res) => {
  res.json(await maintenance.updateAmc(req.params.id, req.body));
}));

api.delete("/amc/:id", ...authWrite("vendors", null, async (req, res) => {
  res.json(await maintenance.deleteAmc(req.params.id));
}));

api.post("/amc/:id/serviced", ...authWrite("vendors", null, async (req, res) => {
  res.json(await maintenance.markAmcServiced(req.params.id));
}));

api.get("/reminders", ...authRead("vendors", async (_req, res) => {
  res.json(await maintenance.listReminders());
}));

api.get("/breakdowns", ...authRead("vendors", async (_req, res) => {
  res.json(await maintenance.listBreakdowns());
}));

api.post("/breakdowns", ...authWrite("vendors", breakdownSchema, async (req, res) => {
  res.status(201).json(await maintenance.createBreakdown(req.body));
}));

api.patch("/breakdowns/:id", ...authWrite("vendors", breakdownSchema, async (req, res) => {
  res.json(await maintenance.updateBreakdown(req.params.id, req.body));
}));

api.delete("/breakdowns/:id", ...authWrite("vendors", null, async (req, res) => {
  res.json(await maintenance.deleteBreakdown(req.params.id));
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
  res.json(await security.listSecurity());
}));

api.post("/security/shifts", ...authWrite("security", shiftSchema, async (req, res) => {
  res.status(201).json(await security.createShift(req.body));
}));

api.patch("/security/shifts/:id", ...authWrite("security", shiftSchema, async (req, res) => {
  res.json(await security.updateShift(req.params.id, req.body));
}));

api.delete("/security/shifts/:id", ...authWrite("security", null, async (req, res) => {
  res.json(await security.deleteShift(req.params.id));
}));

api.post("/security/guards", ...authWrite("security", guardEntrySchema, async (req, res) => {
  res.status(201).json(await security.createGuardEntry(req.body));
}));

api.patch("/security/guards/:id", ...authWrite("security", guardEntrySchema, async (req, res) => {
  res.json(await security.updateGuardEntry(req.params.id, req.body));
}));

api.delete("/security/guards/:id", ...authWrite("security", null, async (req, res) => {
  res.json(await security.deleteGuardEntry(req.params.id));
}));

api.post("/security/handover", ...authWrite("security", handoverSchema, async (req, res) => {
  res.status(201).json(await security.createHandover(req.body));
}));

api.delete("/security/handover/:id", ...authWrite("security", null, async (req, res) => {
  res.json(await security.deleteHandover(req.params.id));
}));

api.post("/security/patrol", ...authWrite("security", patrolPointSchema, async (req, res) => {
  res.status(201).json(await security.createPatrolPoint(req.body));
}));

api.post("/security/patrol/reset", ...authWrite("security", null, async (_req, res) => {
  res.json(await security.resetPatrol());
}));

api.patch("/security/patrol/:id", ...authWrite("security", patrolUpdateSchema, async (req, res) => {
  res.json(await security.updatePatrolPoint(req.params.id, req.body));
}));

api.delete("/security/patrol/:id", ...authWrite("security", null, async (req, res) => {
  res.json(await security.deletePatrolPoint(req.params.id));
}));

api.post("/security/incidents", ...authWrite("security", incidentSchema, async (req, res) => {
  res.status(201).json(await security.createIncident(req.body));
}));

api.patch("/security/incidents/:id", ...authWrite("security", incidentSchema, async (req, res) => {
  res.json(await security.updateIncident(req.params.id, req.body));
}));

api.delete("/security/incidents/:id", ...authWrite("security", null, async (req, res) => {
  res.json(await security.deleteIncident(req.params.id));
}));
