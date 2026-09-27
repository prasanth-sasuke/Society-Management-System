import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import {
  FLAT_TYPE,
  OCCUPANCY,
  RESIDENT_TYPE,
  fromLabel,
  parseCount,
  parseLooseDate,
  parseSqft,
} from "../labels.js";

function optionalText(value) {
  const text = String(value ?? "").trim();
  return text && text !== "—" ? text : null;
}

export async function updateFlat(id, body) {
  const flat = await prisma.flat.findUnique({ where: { id } });
  if (!flat) throw new AppError(404, "Flat not found.");
  const updated = await prisma.flat.update({
    where: { id },
    data: {
      type: fromLabel(FLAT_TYPE, body.type, "type"),
      carpetSqft: parseSqft(body.carpet),
      udsSqft: parseSqft(body.uds),
      parkingSlots: parseCount(body.parking, 0),
      status: fromLabel(OCCUPANCY, body.status, "status"),
    },
  });
  return { id: updated.id, flat: updated.code };
}

export async function deleteFlat(id) {
  const flat = await prisma.flat.findUnique({
    where: { id },
    include: {
      _count: { select: { bills: true } },
      residents: { where: { isCurrent: true }, select: { id: true } },
    },
  });
  if (!flat) throw new AppError(404, "Flat not found.");
  if (flat._count.bills) {
    throw new AppError(409, `${flat.code} has bills on record, so it can't be deleted.`);
  }
  if (flat.residents.length) {
    throw new AppError(409, `Move out the residents of ${flat.code} before deleting it.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.resident.deleteMany({ where: { flatId: id } });
    await tx.flat.delete({ where: { id } });
    const remaining = await tx.flat.count({ where: { blockId: flat.blockId } });
    if (!remaining) await tx.block.delete({ where: { id: flat.blockId } });
  });
  return { flat: flat.code };
}

export async function updateResident(id, body) {
  const resident = await prisma.resident.findUnique({ where: { id } });
  if (!resident || !resident.isCurrent) throw new AppError(404, "Resident not found.");
  const updated = await prisma.resident.update({
    where: { id },
    data: {
      fullName: body.name.trim(),
      type: fromLabel(RESIDENT_TYPE, body.type, "type"),
      familyMembers: parseCount(body.family, 1),
      phone: body.phone.trim(),
      emergencyContact: optionalText(body.emergency),
      residentSince: body.since ? parseLooseDate(body.since) : resident.residentSince,
    },
  });
  return { id: updated.id, name: updated.fullName };
}

export async function moveOutResident(id) {
  const resident = await prisma.resident.findUnique({ where: { id }, include: { flat: true } });
  if (!resident || !resident.isCurrent) throw new AppError(404, "Resident not found.");
  await prisma.$transaction([
    prisma.resident.update({ where: { id }, data: { isCurrent: false } }),
    prisma.moveEvent.create({
      data: {
        flatId: resident.flatId,
        residentId: id,
        type: "MOVE_OUT",
        happenedOn: new Date(),
        notes: `${resident.fullName} moved out of ${resident.flat.code}`,
      },
    }),
  ]);
  return { name: resident.fullName, flat: resident.flat.code };
}

async function billWithoutPayments(id) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { flat: true, _count: { select: { payments: true } } },
  });
  if (!bill) throw new AppError(404, "Bill not found.");
  if (bill._count.payments || Number(bill.paidAmount) > 0) {
    throw new AppError(409, `The ${bill.periodLabel} bill for ${bill.flat.code} already has a payment, so it can't be changed.`);
  }
  return bill;
}

export async function updateBill(id, { period, amount, special, dueOn }) {
  const bill = await billWithoutPayments(id);
  const clash = await prisma.bill.findFirst({
    where: { flatId: bill.flatId, id: { not: id }, periodLabel: { equals: period, mode: "insensitive" } },
    select: { id: true },
  });
  if (clash) throw new AppError(409, `${bill.flat.code} already has a bill for ${period}.`);

  const total = Math.round((amount + special + Number(bill.previousDue) + Number(bill.penaltyAmount)) * 100) / 100;
  await prisma.bill.update({
    where: { id },
    data: {
      periodLabel: period,
      maintenanceAmount: amount,
      specialAmount: special,
      totalAmount: total,
      dueOn: new Date(`${dueOn}T00:00:00.000Z`),
    },
  });
  return { flat: bill.flat.code, period };
}

export async function deleteBill(id) {
  const bill = await billWithoutPayments(id);
  await prisma.$transaction(async (tx) => {
    await tx.bill.delete({ where: { id } });
    const stillOpen = await tx.bill.count({ where: { flatId: bill.flatId, status: { not: "PAID" } } });
    await tx.flat.update({ where: { id: bill.flatId }, data: { duesPending: stillOpen > 0 } });
  });
  return { flat: bill.flat.code, period: bill.periodLabel };
}
