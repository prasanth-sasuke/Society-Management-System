import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import { VOUCHER_STATUS, fromLabel, inr } from "../labels.js";
import { getSociety } from "./society.js";

function utcDate(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function financialYearLabel(date = new Date()) {
  const start = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export async function generateBills({ period, amount, special, dueOn, scope }) {
  const occupiedOnly = /occupied/i.test(scope || "");
  const flats = await prisma.flat.findMany({
    where: occupiedOnly ? { status: { not: "VACANT" } } : {},
    include: {
      residents: { where: { isCurrent: true }, orderBy: [{ type: "asc" }, { residentSince: "asc" }] },
      bills: { where: { periodLabel: { equals: period, mode: "insensitive" } }, select: { id: true } },
    },
  });
  if (!flats.length) {
    throw new AppError(400, occupiedOnly ? "No occupied flats to bill yet." : "Add flats before generating bills.");
  }

  const toBill = flats.filter((flat) => !flat.bills.length);
  if (!toBill.length) {
    throw new AppError(409, `Bills for ${period} already exist for every flat.`);
  }

  const total = round2(amount + special);
  const billedOn = todayUtc();
  const due = utcDate(dueOn);
  await prisma.$transaction([
    prisma.bill.createMany({
      data: toBill.map((flat) => ({
        flatId: flat.id,
        residentId: flat.residents[0]?.id ?? null,
        periodLabel: period,
        billedOn,
        dueOn: due,
        maintenanceAmount: amount,
        specialAmount: special,
        totalAmount: total,
        status: "PENDING",
      })),
    }),
    prisma.flat.updateMany({
      where: { id: { in: toBill.map((flat) => flat.id) } },
      data: { duesPending: true },
    }),
  ]);

  return {
    period,
    created: toBill.length,
    skipped: flats.length - toBill.length,
    total: inr(round2(total * toBill.length)),
  };
}

export async function recordPayment(billId, { amount, mode, paidOn }) {
  return prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUnique({ where: { id: billId }, include: { flat: true } });
    if (!bill) throw new AppError(404, "Bill not found.");

    const totalDue = Number(bill.totalAmount);
    const paidBefore = Number(bill.paidAmount);
    const remaining = round2(totalDue - paidBefore);
    if (remaining <= 0) throw new AppError(409, "This bill is already fully paid.");
    if (amount > remaining) throw new AppError(400, `Amount is more than the ${inr(remaining)} still due.`);

    const paidAfter = round2(paidBefore + amount);
    const fullyPaid = paidAfter >= totalDue;
    const updated = await tx.bill.updateMany({
      where: { id: billId, paidAmount: bill.paidAmount },
      data: {
        paidAmount: paidAfter,
        status: fullyPaid ? "PAID" : "PART_PAID",
        overdueDays: fullyPaid ? 0 : bill.overdueDays,
      },
    });
    if (!updated.count) throw new AppError(409, "This bill was just updated by someone else. Refresh and try again.");

    const paidDate = utcDate(paidOn);
    const prefix = `MR/${paidDate.getUTCFullYear()}/`;
    const issued = await tx.payment.count({ where: { receiptNo: { startsWith: prefix } } });
    const receiptNo = `${prefix}${String(issued + 1).padStart(4, "0")}`;
    await tx.payment.create({ data: { billId, receiptNo, amount, mode, paidOn: paidDate } });

    const stillOpen = await tx.bill.count({ where: { flatId: bill.flatId, status: { not: "PAID" } } });
    await tx.flat.update({ where: { id: bill.flatId }, data: { duesPending: stillOpen > 0 } });

    return {
      receiptNo,
      flat: bill.flat.code,
      amount: inr(amount),
      fullyPaid,
      remaining: inr(round2(totalDue - paidAfter)),
    };
  });
}

function serializeVoucher(v) {
  return {
    id: v.id,
    no: v.number,
    head: v.accountHead,
    party: v.partyName,
    amount: inr(v.amount),
    state: VOUCHER_STATUS[v.status],
  };
}

export async function createVoucher({ head, party, amount, state }) {
  const society = await getSociety();
  const status = fromLabel(VOUCHER_STATUS, state, "state");
  const prefix = `PV/${financialYearLabel()}/`;
  const issued = await prisma.voucher.count({ where: { number: { startsWith: prefix } } });
  const created = await prisma.voucher.create({
    data: {
      societyId: society.id,
      number: `${prefix}${String(issued + 1).padStart(3, "0")}`,
      accountHead: head,
      partyName: party,
      amount,
      status,
    },
  });
  return serializeVoucher(created);
}

export async function approveVoucher(id) {
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new AppError(404, "Voucher not found.");
  if (voucher.status === "APPROVED") throw new AppError(409, `${voucher.number} is already approved.`);
  const updated = await prisma.voucher.update({ where: { id }, data: { status: "APPROVED" } });
  return serializeVoucher(updated);
}
