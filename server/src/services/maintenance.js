import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import { dayLabel, inr, money, societyNow } from "../labels.js";
import { createVoucher } from "./billing.js";
import { getSociety } from "./society.js";

const DAY = 86400000;
export const AMC_FREQUENCIES = { Monthly: 1, Quarterly: 3, "Half-yearly": 6, Yearly: 12 };

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function fromIso(iso) {
  return iso ? new Date(`${iso}T00:00:00.000Z`) : null;
}

function daysFrom(today, date) {
  return Math.round((date.getTime() - today.getTime()) / DAY);
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function relativeLabel(days) {
  if (days < 0) return `Overdue ${plural(-days, "day")}`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function addMonths(date, months) {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

async function mustFind(model, id, label, include) {
  const row = await prisma[model].findUnique({ where: { id }, ...(include ? { include } : {}) });
  if (!row) throw new AppError(404, `${label} not found.`);
  return row;
}

async function optionalVendor(societyId, vendorId) {
  if (!vendorId) return null;
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, societyId } });
  if (!vendor) throw new AppError(400, "That vendor no longer exists. Reload and pick again.");
  return vendor;
}

// Quotations

export async function listQuotations() {
  const society = await getSociety();
  const rows = await prisma.quotation.findMany({ where: { societyId: society.id }, orderBy: { createdAt: "desc" } });
  return rows.map((q) => ({ id: q.id, work: q.work, vendors: q.vendorsNote, range: q.rangeNote }));
}

function quotationData(body) {
  return { work: body.work, vendorsNote: body.vendors || "—", rangeNote: body.range || "—" };
}

export async function createQuotation(body) {
  const society = await getSociety();
  const created = await prisma.quotation.create({ data: { societyId: society.id, ...quotationData(body) } });
  return { work: created.work };
}

export async function updateQuotation(id, body) {
  await mustFind("quotation", id, "Quotation");
  const updated = await prisma.quotation.update({ where: { id }, data: quotationData(body) });
  return { work: updated.work };
}

export async function deleteQuotation(id) {
  const row = await mustFind("quotation", id, "Quotation");
  await prisma.quotation.delete({ where: { id } });
  return { work: row.work };
}

// Vendor invoices

function invoiceDueLabel(dueOn, today) {
  if (!dueOn) return "No due date";
  const days = daysFrom(today, dueOn);
  if (days < 0) return `Overdue ${plural(-days, "day")}`;
  if (days === 0) return "Due today";
  return `Due ${dayLabel(dueOn)}`;
}

export async function listInvoices() {
  const today = societyNow().date;
  const rows = await prisma.vendorInvoice.findMany({
    where: { paidOn: null },
    include: { vendor: true },
    orderBy: [{ dueOn: "asc" }, { invoiceNo: "asc" }],
  });
  return rows.map((i) => ({
    id: i.id,
    no: i.invoiceNo,
    who: [i.vendor?.name, i.description].filter(Boolean).join(" — "),
    vendorId: i.vendorId || "",
    description: i.description,
    amount: inr(i.amount),
    amountValue: money(i.amount),
    due: invoiceDueLabel(i.dueOn, today),
    dueIso: i.dueOn ? isoDay(i.dueOn) : "",
  }));
}

async function invoiceData(body) {
  const society = await getSociety();
  const vendor = await optionalVendor(society.id, body.vendor);
  const dueOn = fromIso(body.dueOn);
  return {
    vendorId: vendor?.id || null,
    invoiceNo: body.no,
    description: body.description,
    amount: body.amount,
    dueOn,
    dueNote: invoiceDueLabel(dueOn, societyNow().date),
  };
}

async function assertInvoiceNoFree(invoiceNo, exceptId) {
  const clash = await prisma.vendorInvoice.findFirst({
    where: { invoiceNo: { equals: invoiceNo, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new AppError(409, `Invoice ${invoiceNo} is already recorded.`);
}

export async function createInvoice(body) {
  await assertInvoiceNoFree(body.no);
  const created = await prisma.vendorInvoice.create({ data: await invoiceData(body) });
  return { no: created.invoiceNo, amount: inr(created.amount) };
}

export async function updateInvoice(id, body) {
  const row = await mustFind("vendorInvoice", id, "Invoice");
  if (row.paidOn) throw new AppError(409, `Invoice ${row.invoiceNo} is already paid, so it can't be changed.`);
  await assertInvoiceNoFree(body.no, id);
  const updated = await prisma.vendorInvoice.update({ where: { id }, data: await invoiceData(body) });
  return { no: updated.invoiceNo, amount: inr(updated.amount) };
}

export async function deleteInvoice(id) {
  const row = await mustFind("vendorInvoice", id, "Invoice");
  if (row.paidOn) throw new AppError(409, `Invoice ${row.invoiceNo} is already paid, so it can't be deleted.`);
  await prisma.vendorInvoice.delete({ where: { id } });
  return { no: row.invoiceNo };
}

export async function payInvoice(id) {
  const invoice = await mustFind("vendorInvoice", id, "Invoice", { vendor: true });
  const paidOn = societyNow().date;
  const { count } = await prisma.vendorInvoice.updateMany({ where: { id, paidOn: null }, data: { paidOn } });
  if (!count) throw new AppError(409, `Invoice ${invoice.invoiceNo} is already paid.`);
  try {
    const voucher = await createVoucher({
      head: invoice.vendor?.service || "Vendor payments",
      party: invoice.vendor?.name || invoice.description,
      amount: Number(invoice.amount),
      state: "Approved",
    });
    return { no: invoice.invoiceNo, amount: inr(invoice.amount), voucher: voucher.no };
  } catch (err) {
    await prisma.vendorInvoice.update({ where: { id }, data: { paidOn: null } });
    throw err;
  }
}

// AMC contracts

function amcStatus(days) {
  if (days < 0) return "Overdue";
  if (days === 0) return "Scheduled today";
  if (days <= 7) return "Due this week";
  return "Active";
}

export async function listAmc() {
  const society = await getSociety();
  const today = societyNow().date;
  const rows = await prisma.amcContract.findMany({
    where: { societyId: society.id },
    include: { vendor: true },
    orderBy: { nextOn: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    equip: a.equipment,
    vendor: a.vendor?.name || "In-house",
    vendorId: a.vendorId || "",
    freq: a.frequency,
    next: dayLabel(a.nextOn),
    nextIso: isoDay(a.nextOn),
    status: amcStatus(daysFrom(today, a.nextOn)),
  }));
}

async function amcData(body) {
  const society = await getSociety();
  if (!AMC_FREQUENCIES[body.frequency]) throw new AppError(400, `Invalid frequency: ${body.frequency}`);
  const vendor = await optionalVendor(society.id, body.vendor);
  return { equipment: body.equipment, vendorId: vendor?.id || null, frequency: body.frequency, nextOn: fromIso(body.nextOn) };
}

export async function createAmc(body) {
  const society = await getSociety();
  const created = await prisma.amcContract.create({ data: { societyId: society.id, status: "ACTIVE", ...(await amcData(body)) } });
  return { equip: created.equipment, next: dayLabel(created.nextOn) };
}

export async function updateAmc(id, body) {
  await mustFind("amcContract", id, "AMC contract");
  const updated = await prisma.amcContract.update({ where: { id }, data: await amcData(body) });
  return { equip: updated.equipment, next: dayLabel(updated.nextOn) };
}

export async function deleteAmc(id) {
  const row = await mustFind("amcContract", id, "AMC contract");
  await prisma.amcContract.delete({ where: { id } });
  return { equip: row.equipment };
}

export async function markAmcServiced(id) {
  const row = await mustFind("amcContract", id, "AMC contract");
  const months = AMC_FREQUENCIES[row.frequency] || 12;
  const nextOn = addMonths(societyNow().date, months);
  await prisma.amcContract.update({ where: { id }, data: { nextOn } });
  return { equip: row.equipment, next: dayLabel(nextOn) };
}

// Reminders are derived: AMC services, vendor renewals and invoice due dates in the next 30 days (or overdue).

export async function listReminders() {
  const society = await getSociety();
  const today = societyNow().date;
  const horizon = new Date(today.getTime() + 30 * DAY);
  const [amc, vendors, invoices] = await Promise.all([
    prisma.amcContract.findMany({ where: { societyId: society.id, nextOn: { lte: horizon } }, include: { vendor: true } }),
    prisma.vendor.findMany({ where: { societyId: society.id, renewalOn: { not: null, lte: horizon } } }),
    prisma.vendorInvoice.findMany({ where: { paidOn: null, dueOn: { not: null, lte: horizon } }, include: { vendor: true } }),
  ]);
  const items = [
    ...amc.map((a) => ({ what: `${a.equipment} service${a.vendor ? ` — ${a.vendor.name}` : ""}`, on: a.nextOn })),
    ...vendors.map((v) => ({ what: `${v.name} contract renewal`, on: v.renewalOn })),
    ...invoices.map((i) => ({ what: `Pay invoice ${i.invoiceNo}${i.vendor ? ` — ${i.vendor.name}` : ""}`, on: i.dueOn })),
  ];
  return items
    .sort((a, b) => a.on - b.on)
    .map((r) => ({ what: r.what, when: relativeLabel(daysFrom(today, r.on)), date: isoDay(r.on) }));
}

// Breakdowns

export async function listBreakdowns() {
  const society = await getSociety();
  const rows = await prisma.breakdownEvent.findMany({
    where: { OR: [{ assetId: null }, { asset: { societyId: society.id } }] },
    include: { asset: true },
    orderBy: [{ happenedOn: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((b) => ({
    id: b.id,
    what: b.what,
    when: isoDay(b.happenedOn),
    whenLabel: dayLabel(b.happenedOn),
    note: b.note || "",
    asset: b.asset ? `${b.asset.tag} — ${b.asset.name}` : "",
    assetId: b.assetId || "",
  }));
}

async function breakdownData(body) {
  const society = await getSociety();
  let assetId = null;
  if (body.asset) {
    const asset = await prisma.asset.findFirst({ where: { id: body.asset, societyId: society.id } });
    if (!asset) throw new AppError(400, "That asset no longer exists. Reload and pick again.");
    assetId = asset.id;
  }
  if (body.date > societyNow().iso) throw new AppError(400, "A breakdown can't be in the future.");
  return { assetId, what: body.what, happenedOn: fromIso(body.date), note: body.note };
}

export async function createBreakdown(body) {
  const created = await prisma.breakdownEvent.create({ data: await breakdownData(body) });
  return { what: created.what };
}

export async function updateBreakdown(id, body) {
  await mustFind("breakdownEvent", id, "Breakdown");
  const updated = await prisma.breakdownEvent.update({ where: { id }, data: await breakdownData(body) });
  return { what: updated.what };
}

export async function deleteBreakdown(id) {
  const row = await mustFind("breakdownEvent", id, "Breakdown");
  await prisma.breakdownEvent.delete({ where: { id } });
  return { what: row.what };
}
