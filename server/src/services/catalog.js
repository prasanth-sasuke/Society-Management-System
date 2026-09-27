import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import {
  ASSET_CONDITION,
  BILL_STATUS,
  BOOKING_PAY,
  FACILITY_STATUS,
  FLAT_TYPE,
  OCCUPANCY,
  PAYMENT_STATE,
  RESIDENT_TYPE,
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
  VOUCHER_STATUS,
  fromLabel,
  inr,
  money,
  parseCount,
  parseFlatCode,
  parseLooseDate,
  parseSqft,
  dayLabel,
  societyNow,
} from "../labels.js";
import { getSociety, findFlatByCode, findOrCreateFacility } from "./society.js";
import { accruePenalties } from "./billing.js";
import { canWrite } from "../auth/permissions.js";
import { flatScope, requireOwnFlat, vendorScope } from "../auth/scope.js";

function flatWhere(user) {
  const flatId = flatScope(user);
  return flatId ? { flatId } : {};
}

const BILLING_FREQUENCY = { QUARTERLY: "Quarterly, in advance", MONTHLY: "Monthly" };

function serializeSociety(society) {
  return {
    id: society.id,
    name: society.name,
    penaltyPerDay: society.penaltyPerDay,
    billingFrequency: BILLING_FREQUENCY[society.billingFrequency],
  };
}

export async function getSocietyPayload() {
  return serializeSociety(await getSociety());
}

export async function updateSociety({ name, penaltyPerDay, billingFrequency }, permissions) {
  const society = await getSociety();
  const data = {};
  if (name !== undefined && name !== society.name) {
    if (!canWrite(permissions, "property")) throw new AppError(403, "Only users who manage the property master can rename the society.");
    data.name = name;
  }
  if (penaltyPerDay !== undefined || billingFrequency !== undefined) {
    if (!canWrite(permissions, "billing")) throw new AppError(403, "Only users who manage billing can change billing rules.");
    if (penaltyPerDay !== undefined && penaltyPerDay !== society.penaltyPerDay) {
      // Charge days already past at the old rate before the new rate takes over.
      await accruePenalties();
      data.penaltyPerDay = penaltyPerDay;
    }
    if (billingFrequency !== undefined) data.billingFrequency = fromLabel(BILLING_FREQUENCY, billingFrequency, "billing frequency");
  }
  if (!Object.keys(data).length) return serializeSociety(society);
  return serializeSociety(await prisma.society.update({ where: { id: society.id }, data }));
}

export async function getPublicSociety() {
  const society = await prisma.society.findFirst({ orderBy: { createdAt: "asc" }, select: { name: true } });
  return { name: society?.name || null };
}

function asNumber(value) {
  return Number(value || 0);
}

function monthKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastSixMonths(now = new Date()) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({
      key: monthKey(date),
      month: labels[date.getUTCMonth()],
    });
  }
  return months;
}

function remainingAmount(row) {
  return Math.max(asNumber(row.totalAmount) - asNumber(row.paidAmount), 0);
}

function ageingBucket(days) {
  if (days <= 30) return "0–30 days";
  if (days <= 60) return "31–60 days";
  if (days <= 90) return "61–90 days";
  return "90+ days";
}

export async function getDashboard() {
  await accruePenalties();
  const society = await getSociety();
  const trendMonths = lastSixMonths();
  const trendStart = new Date(`${trendMonths[0].key}-01T00:00:00.000Z`);
  const today = new Date();

  const [
    flatTotal,
    occupied,
    vacant,
    openTickets,
    overdueBills,
    billAgg,
    paidBills,
    unpaidBills,
    unpaidFlats,
    voucherAgg,
    voucherCount,
    bankAgg,
    bankCount,
    salaryAgg,
    invoiceAgg,
    invoiceCount,
    staffOnPayroll,
    vendors,
    trendPayments,
    trendVouchers,
    unpaidBillRows,
    allVouchers,
    billsByBlock,
  ] = await Promise.all([
    prisma.flat.count(),
    prisma.flat.count({ where: { status: { not: "VACANT" } } }),
    prisma.flat.count({ where: { status: "VACANT" } }),
    prisma.ticket.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.bill.count({
      where: {
        status: { not: "PAID" },
        dueOn: { lt: societyNow().date },
      },
    }),
    prisma.bill.aggregate({ _sum: { paidAmount: true, totalAmount: true } }),
    prisma.bill.count({ where: { status: "PAID" } }),
    prisma.bill.count({ where: { status: { not: "PAID" } } }),
    prisma.bill.findMany({
      where: { status: { not: "PAID" } },
      select: { flatId: true },
    }),
    prisma.voucher.aggregate({
      where: { societyId: society.id, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.voucher.count({ where: { societyId: society.id, status: "APPROVED" } }),
    prisma.bankAccount.aggregate({
      where: { societyId: society.id },
      _sum: { balance: true },
    }),
    prisma.bankAccount.count({ where: { societyId: society.id } }),
    prisma.staffMember.aggregate({
      where: { societyId: society.id },
      _sum: { salary: true },
    }),
    prisma.vendorInvoice.aggregate({ where: { paidOn: null }, _sum: { amount: true } }),
    prisma.vendorInvoice.count({ where: { paidOn: null } }),
    prisma.staffMember.count({ where: { societyId: society.id } }),
    prisma.vendor.count({ where: { societyId: society.id } }),
    prisma.payment.findMany({
      where: { paidOn: { gte: trendStart } },
      select: { paidOn: true, amount: true },
    }),
    prisma.voucher.findMany({
      where: { societyId: society.id, status: "APPROVED", createdAt: { gte: trendStart } },
      select: { createdAt: true, amount: true },
    }),
    prisma.bill.findMany({
      where: { status: { not: "PAID" } },
      select: { totalAmount: true, paidAmount: true, overdueDays: true, dueOn: true },
    }),
    prisma.voucher.findMany({
      where: { societyId: society.id, status: "APPROVED" },
      select: { accountHead: true, amount: true },
    }),
    prisma.bill.findMany({
      select: {
        totalAmount: true,
        paidAmount: true,
        flat: { select: { block: { select: { code: true } } } },
      },
    }),
  ]);

  const billed = asNumber(billAgg._sum.totalAmount);
  const collected = asNumber(billAgg._sum.paidAmount);
  const due = Math.max(billed - collected, 0);
  const spent = asNumber(voucherAgg._sum.amount);
  const cash = asNumber(bankAgg._sum.balance);
  const salary = asNumber(salaryAgg._sum.salary);
  const vendorDue = asNumber(invoiceAgg._sum.amount);
  const collectionPct = billed ? Number(((collected / billed) * 100).toFixed(1)) : 0;

  const incomeByMonth = Object.fromEntries(trendMonths.map((row) => [row.key, 0]));
  const expenseByMonth = { ...incomeByMonth };
  trendPayments.forEach((row) => {
    const key = monthKey(row.paidOn);
    if (key in incomeByMonth) incomeByMonth[key] += asNumber(row.amount);
  });
  trendVouchers.forEach((row) => {
    const key = monthKey(row.createdAt);
    if (key in expenseByMonth) expenseByMonth[key] += asNumber(row.amount);
  });

  const ageingTotals = {
    "0–30 days": 0,
    "31–60 days": 0,
    "61–90 days": 0,
    "90+ days": 0,
  };
  unpaidBillRows.forEach((row) => {
    const leftover = remainingAmount(row);
    if (!leftover) return;
    const daysPastDue = Math.max(0, Math.floor((today.getTime() - new Date(row.dueOn).getTime()) / 86400000));
    const days = row.overdueDays || daysPastDue;
    ageingTotals[ageingBucket(days)] += leftover;
  });
  const ageing = [
    { bucket: "0–30 days", amount: ageingTotals["0–30 days"], tone: "#1e6b52" },
    { bucket: "31–60 days", amount: ageingTotals["31–60 days"], tone: "#8a6414" },
    { bucket: "61–90 days", amount: ageingTotals["61–90 days"], tone: "#c2571f" },
    { bucket: "90+ days", amount: ageingTotals["90+ days"], tone: "#b0491a" },
  ].map((row) => ({
    ...row,
    pct: due ? `${Math.round((row.amount / due) * 100)}%` : "0%",
  }));

  const spendByHead = {};
  allVouchers.forEach((row) => {
    spendByHead[row.accountHead] = (spendByHead[row.accountHead] || 0) + asNumber(row.amount);
  });
  const expenseSplit = Object.entries(spendByHead)
    .sort((a, b) => b[1] - a[1])
    .map(([head, amount]) => ({
      head,
      amount,
      pct: spent ? `${Math.round((amount / spent) * 100)}%` : "0%",
    }));

  const blockMoney = {};
  billsByBlock.forEach((row) => {
    const code = row.flat?.block?.code;
    if (!code) return;
    if (!blockMoney[code]) blockMoney[code] = { billed: 0, collected: 0 };
    blockMoney[code].billed += asNumber(row.totalAmount);
    blockMoney[code].collected += asNumber(row.paidAmount);
  });

  return {
    society: await getSocietyPayload(),
    occupancy: { occupied, vacant, total: flatTotal },
    openTickets,
    overdueBills,
    staffOnPayroll,
    vendors,
    money: {
      billed,
      collected,
      due,
      spent,
      cash,
      salary,
      vendorDue,
      paidBills,
      unpaidBills,
      unpaidFlats: new Set(unpaidFlats.map((row) => row.flatId)).size,
      vouchers: voucherCount,
      banks: bankCount,
      invoices: invoiceCount,
      collectionPct,
    },
    trend: trendMonths.map((row) => ({
      month: row.month,
      income: incomeByMonth[row.key],
      expense: expenseByMonth[row.key],
    })),
    ageing,
    expenseSplit,
    blockMoney,
  };
}

export async function listBlocks() {
  const blocks = await prisma.block.findMany({
    orderBy: { sortOrder: "asc" },
    include: { flats: { orderBy: [{ floor: "desc" }, { unitLabel: "asc" }] } },
  });
  return blocks.map((block) => ({
    id: block.id,
    name: block.name,
    code: block.code,
    count: block.flats.length,
    floors: [...new Set(block.flats.map((f) => f.floor))].sort((a, b) => b - a).map((n) => ({
      n,
      flats: block.flats
        .filter((f) => f.floor === n)
        .map((f) => ({
          id: f.unitLabel,
          code: f.code,
          status: OCCUPANCY[f.status],
          duesPending: f.duesPending,
          bg: f.status === "VACANT" ? "#ddd8cb" : f.duesPending ? "#c2571f" : "#1e6b52",
          fg: f.status === "VACANT" ? "#6f6f68" : "#fff",
        })),
    })),
  }));
}

export async function listFlats() {
  const flats = await prisma.flat.findMany({
    include: { block: true },
    orderBy: [{ block: { sortOrder: "asc" } }, { floor: "asc" }, { unitLabel: "asc" }],
  });
  return flats.map(serializeFlat);
}

export async function createFlat(body) {
  const parsed = parseFlatCode(body.flat);
  if (!parsed) throw new AppError(400, "Flat no. must look like A-1A");
  const society = await getSociety();
  let block = await prisma.block.findUnique({
    where: { societyId_code: { societyId: society.id, code: parsed.blockCode } },
  });
  if (!block) {
    const existing = await prisma.block.count({ where: { societyId: society.id } });
    block = await prisma.block.create({
      data: {
        societyId: society.id,
        name: `Block ${parsed.blockCode}`,
        code: parsed.blockCode,
        unitsPerFloor: 1,
        floorCount: Math.max(parsed.floor, 1),
        sortOrder: existing,
      },
    });
  }
  const created = await prisma.flat.create({
    data: {
      blockId: block.id,
      code: parsed.code,
      floor: parsed.floor,
      unitLabel: parsed.unitLabel,
      type: fromLabel(FLAT_TYPE, body.type, "type"),
      carpetSqft: parseSqft(body.carpet),
      udsSqft: parseSqft(body.uds),
      parkingSlots: parseCount(body.parking, 0),
      status: fromLabel(OCCUPANCY, body.status, "status"),
    },
    include: { block: true },
  });
  return serializeFlat(created);
}

export async function listResidents(user) {
  const residents = await prisma.resident.findMany({
    where: { isCurrent: true, ...flatWhere(user) },
    include: { flat: true },
    orderBy: { fullName: "asc" },
  });
  return residents.map(serializeResident);
}

export async function createResident(body) {
  const flat = await findFlatByCode(body.flat);
  const created = await prisma.resident.create({
    data: {
      flatId: flat.id,
      fullName: body.name.trim(),
      type: fromLabel(RESIDENT_TYPE, body.type, "type"),
      familyMembers: parseCount(body.family, 1),
      phone: body.phone.trim(),
      emergencyContact: body.emergency?.trim() || null,
      residentSince: parseLooseDate(body.since),
      moveEvents: {
        create: {
          flat: { connect: { id: flat.id } },
          type: "MOVE_IN",
          happenedOn: new Date(),
          notes: `${body.name.trim()} moved into ${flat.code}`,
        },
      },
    },
    include: { flat: true },
  });
  return serializeResident(created);
}

export async function listMoveEvents(user) {
  const rows = await prisma.moveEvent.findMany({
    where: flatWhere(user),
    include: { flat: true },
    orderBy: { happenedOn: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    text: row.notes,
    date: row.happenedOn.toISOString().slice(0, 10),
    type: row.type,
    flat: row.flat.code,
  }));
}

function daysOverdue(row, today) {
  if (row.status === "PAID") return 0;
  const days = Math.floor((today.getTime() - row.dueOn.getTime()) / 86400000);
  return Math.max(days, row.overdueDays || 0, 0);
}

export async function listBills(user) {
  await accruePenalties();
  const today = societyNow().date;
  const rows = await prisma.bill.findMany({
    where: flatWhere(user),
    include: {
      flat: { include: { block: true } },
      resident: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ billedOn: "desc" }, { flat: { code: "asc" } }],
  });
  return rows.map((row) => {
    const overdue = daysOverdue(row, today);
    const remaining = Math.max(Number(row.totalAmount) - Number(row.paidAmount), 0);
    const last = row.payments[0];
    let status = BILL_STATUS[row.status];
    if (row.status !== "PAID" && overdue > 0) {
      status = `Overdue — ${overdue} day${overdue === 1 ? "" : "s"}`;
    } else if (row.status === "PART_PAID") {
      status = `Part paid — ${inr(row.paidAmount)}`;
    }
    return {
      id: row.id,
      flat: row.flat.code,
      blockCode: row.flat.block?.code,
      period: row.periodLabel,
      dueOn: row.dueOn.toISOString().slice(0, 10),
      resident: row.resident?.fullName || "—",
      maint: inr(row.maintenanceAmount),
      maintAmount: money(row.maintenanceAmount),
      special: Number(row.specialAmount) ? inr(row.specialAmount) : "—",
      specialAmount: money(row.specialAmount),
      prev: Number(row.previousDue) ? inr(row.previousDue) : "—",
      penalty: Number(row.penaltyAmount) ? inr(row.penaltyAmount) : "—",
      penaltyAmount: money(row.penaltyAmount),
      total: inr(row.totalAmount),
      totalAmount: money(row.totalAmount),
      paidAmount: money(row.paidAmount),
      remaining: inr(remaining),
      remainingAmount: remaining,
      status,
      statusCode: row.status,
      lastPayment: last
        ? {
          receiptNo: last.receiptNo,
          amount: inr(last.amount),
          mode: last.mode,
          paidOn: last.paidOn.toISOString().slice(0, 10),
          at: last.createdAt.toISOString(),
        }
        : null,
    };
  });
}

export async function listFinance() {
  const society = await getSociety();
  const [vouchers, banks, budget] = await Promise.all([
    prisma.voucher.findMany({ where: { societyId: society.id }, orderBy: { number: "asc" } }),
    prisma.bankAccount.findMany({ where: { societyId: society.id }, orderBy: { createdAt: "asc" } }),
    prisma.budgetLine.findMany({ where: { societyId: society.id } }),
  ]);
  return {
    vouchers: vouchers.map((v) => ({
      id: v.id,
      no: v.number,
      head: v.accountHead,
      party: v.partyName,
      amount: inr(v.amount),
      state: VOUCHER_STATUS[v.status],
    })),
    banks: banks.map((b) => ({
      id: b.id,
      name: b.name,
      meta: b.meta,
      balance: inr(b.balance),
      balanceValue: money(b.balance),
    })),
    budget: budget.map((b) => {
      const pct = Math.round((Number(b.spentAmount) / Number(b.budgetAmount)) * 100);
      return {
        id: b.id,
        head: b.head,
        figures: `${inr(b.spentAmount)} of ${inr(b.budgetAmount)}`.replace("₹", "₹"),
        pct: `${pct}%`,
        spent: money(b.spentAmount),
        budget: money(b.budgetAmount),
      };
    }),
  };
}

export function ticketWhere(user) {
  const vendor = vendorScope(user);
  if (vendor) {
    return vendor.name ? { assignee: { contains: vendor.name, mode: "insensitive" } } : { id: vendor.id };
  }
  return flatWhere(user);
}

export async function listTickets(user) {
  const rows = await prisma.ticket.findMany({
    where: ticketWhere(user),
    include: { events: { orderBy: { occurredAt: "asc" } }, feedback: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeTicket);
}

export async function getTicket(ticketNo, user) {
  const row = await prisma.ticket.findFirst({
    where: { ticketNo, ...ticketWhere(user) },
    include: { events: { orderBy: { occurredAt: "asc" } }, feedback: true },
  });
  if (!row) throw new AppError(404, "Ticket not found");
  return serializeTicket(row);
}

export async function createTicket(input, user) {
  const ownFlat = requireOwnFlat(user);
  const body = ownFlat ? { ...input, flat: ownFlat } : input;
  const society = await getSociety();
  const parsed = parseFlatCode(body.flat);
  let flat = null;
  if (parsed) {
    flat = await prisma.flat.findUnique({ where: { code: parsed.code } });
  }
  const numbers = await prisma.ticket.findMany({ select: { ticketNo: true } });
  const highest = numbers.reduce((max, t) => Math.max(max, Number(t.ticketNo.replace(/\D/g, "")) || 0), 1000);
  const nextNum = highest + 1;
  const owner = body.owner.trim();
  const created = await prisma.ticket.create({
    data: {
      societyId: society.id,
      ticketNo: `HD-${nextNum}`,
      flatId: flat?.id || null,
      location: body.flat.trim(),
      category: fromLabel(TICKET_CATEGORY, body.category, "category"),
      description: body.text.trim(),
      priority: fromLabel(TICKET_PRIORITY, body.priority, "priority"),
      assignee: owner,
      photosNote: null,
      status: "ASSIGNED",
      events: { create: { occurredAt: new Date(), note: `Raised and assigned to ${owner}` } },
    },
    include: { events: true, feedback: true },
  });
  return serializeTicket(created);
}

export async function listVendors(user) {
  const society = await getSociety();
  const vendor = vendorScope(user);
  const rows = await prisma.vendor.findMany({
    where: { societyId: society.id, ...(vendor ? { id: vendor.id } : {}) },
    orderBy: { name: "asc" },
  });
  return rows.map(serializeVendor);
}

export async function createVendor(body) {
  const society = await getSociety();
  const created = await prisma.vendor.create({
    data: {
      societyId: society.id,
      name: body.name.trim(),
      service: body.service.trim(),
      phone: body.phone.trim(),
      contractValue: body.value.trim(),
      renewalOn: body.renewal ? parseLooseDate(body.renewal) : null,
      renewalLabel: body.renewal || null,
      paymentState: fromLabel(PAYMENT_STATE, body.pay, "pay"),
      paymentNote: body.pay,
    },
  });
  return serializeVendor(created);
}

export async function listAssets() {
  const society = await getSociety();
  const rows = await prisma.asset.findMany({ where: { societyId: society.id }, orderBy: { tag: "asc" } });
  return rows.map(serializeAsset);
}

export async function createAsset(body) {
  const society = await getSociety();
  const created = await prisma.asset.create({
    data: {
      societyId: society.id,
      tag: body.tag.trim().toUpperCase(),
      name: body.name.trim(),
      category: body.category.trim(),
      location: body.location.trim(),
      installedYear: parseCount(body.installed, null) || null,
      amcNote: body.amc?.trim() || "—",
      condition: fromLabel(ASSET_CONDITION, body.condition, "condition"),
    },
  });
  return serializeAsset(created);
}

export async function listFacilities() {
  const society = await getSociety();
  const today = societyNow().date;
  const rows = await prisma.facility.findMany({
    where: { societyId: society.id },
    include: { bookings: { where: { bookingDate: { gte: today } }, orderBy: { bookingDate: "asc" } } },
    orderBy: { name: "asc" },
  });
  return rows.map((f) => {
    const upcoming = f.bookings.length;
    const bookedToday = f.bookings[0]?.bookingDate.getTime() === today.getTime();
    const autoState = bookedToday ? "BOOKED" : "AVAILABLE";
    return {
      id: f.id,
      name: f.name,
      capacity: f.capacityNote !== "—" ? f.capacityNote : upcoming ? `${upcoming} upcoming booking${upcoming === 1 ? "" : "s"}` : "No upcoming bookings",
      charge: f.chargeNote !== "—" ? f.chargeNote : f.bookings[0]?.charge || "—",
      next: upcoming ? `Next: ${f.bookings[0].dateLabel}` : f.nextNote,
      state: FACILITY_STATUS[f.status === "MAINTENANCE" ? f.status : autoState],
    };
  });
}

export async function listBookings(user) {
  const rows = await prisma.booking.findMany({
    where: flatWhere(user),
    include: { facility: true, flat: true },
    orderBy: { bookingDate: "asc" },
  });
  return rows.map(serializeBooking);
}

export async function createBooking(input, user) {
  const ownFlat = requireOwnFlat(user);
  const body = ownFlat ? { ...input, flat: ownFlat } : input;
  const society = await getSociety();
  const flat = await findFlatByCode(body.flat);
  const facility = await findOrCreateFacility(society.id, body.facility);
  const bookingDate = parseLooseDate(body.date);
  const created = await prisma.booking.create({
    data: {
      facilityId: facility.id,
      flatId: flat.id,
      bookingDate,
      dateLabel: dayLabel(bookingDate),
      slot: body.slot.trim(),
      charge: body.charge?.trim() || "—",
      deposit: body.deposit?.trim() || "—",
      paymentStatus: fromLabel(BOOKING_PAY, body.pay, "pay"),
    },
    include: { facility: true, flat: true },
  });
  return serializeBooking(created);
}

function serializeFlat(flat) {
  return {
    id: flat.id,
    flat: flat.code,
    type: FLAT_TYPE[flat.type],
    carpet: flat.carpetSqft ? `${flat.carpetSqft.toLocaleString("en-IN")} sq.ft` : "—",
    uds: flat.udsSqft ? `${flat.udsSqft.toLocaleString("en-IN")} sq.ft` : "—",
    parking: flat.parkingSlots,
    status: OCCUPANCY[flat.status],
    block: flat.block?.name,
    floor: flat.floor,
  };
}

function serializeResident(row) {
  return {
    id: row.id,
    name: row.fullName,
    flat: row.flat.code,
    type: RESIDENT_TYPE[row.type],
    family: `${row.familyMembers} member${row.familyMembers === 1 ? "" : "s"}`,
    phone: row.phone,
    emergency: row.emergencyContact || "—",
    since: row.residentSince.toISOString().slice(0, 7),
  };
}

function serializeTicket(row) {
  return {
    id: row.ticketNo,
    dbId: row.id,
    flat: row.location,
    category: TICKET_CATEGORY[row.category],
    text: row.description,
    priority: TICKET_PRIORITY[row.priority],
    owner: row.assignee,
    photos: row.photosNote || "—",
    status: TICKET_STATUS[row.status],
    events: (row.events || []).map((e) => ({
      when: e.occurredAt.toISOString(),
      what: e.note,
    })),
  };
}

function serializeVendor(row) {
  return {
    id: row.id,
    name: row.name,
    service: row.service,
    phone: row.phone,
    value: row.contractValue,
    renewal: row.renewalLabel || "—",
    pay: row.paymentNote || PAYMENT_STATE[row.paymentState],
  };
}

function serializeAsset(row) {
  return {
    id: row.id,
    tag: row.tag,
    name: row.name,
    category: row.category,
    location: row.location,
    installed: row.installedYear ? String(row.installedYear) : "—",
    amc: row.amcNote,
    condition: ASSET_CONDITION[row.condition],
  };
}

function serializeBooking(row) {
  return {
    id: row.id,
    facility: row.facility.name,
    flat: row.flat?.code || "—",
    date: row.dateLabel,
    dateIso: row.bookingDate.toISOString().slice(0, 10),
    slot: row.slot,
    charge: row.charge,
    deposit: row.deposit,
    pay: BOOKING_PAY[row.paymentStatus],
  };
}
