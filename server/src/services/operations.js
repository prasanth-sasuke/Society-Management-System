import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import {
  ASSET_CONDITION,
  BOOKING_PAY,
  PAYMENT_STATE,
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
  dayLabel,
  fromLabel,
  inr,
  parseCount,
  parseLooseDate,
} from "../labels.js";
import { findFlatByCode, findOrCreateFacility, getSociety } from "./society.js";
import { assertFlatAccess, requireOwnFlat } from "../auth/scope.js";

function optionalText(value) {
  const text = String(value ?? "").trim();
  return text && text !== "—" ? text : null;
}

async function mustFind(model, id, label) {
  const row = await prisma[model].findUnique({ where: { id } });
  if (!row) throw new AppError(404, `${label} not found.`);
  return row;
}

export async function updateTicket(id, body, user) {
  const ticket = await mustFind("ticket", id, "Ticket");
  assertFlatAccess(user, ticket.flatId, "Ticket");
  const status = fromLabel(TICKET_STATUS, body.status, "status");
  const owner = body.owner.trim();
  const changes = [];
  if (status !== ticket.status) {
    changes.push(status === "RESOLVED" ? "Marked resolved" : `Status changed to ${TICKET_STATUS[status]}`);
  }
  if (owner !== ticket.assignee) changes.push(`Reassigned to ${owner}`);
  if (body.note) changes.push(body.note);

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id },
      data: {
        category: fromLabel(TICKET_CATEGORY, body.category, "category"),
        description: body.text.trim(),
        priority: fromLabel(TICKET_PRIORITY, body.priority, "priority"),
        assignee: owner,
        status,
      },
    }),
    ...(changes.length
      ? [prisma.ticketEvent.create({ data: { ticketId: id, occurredAt: new Date(), note: changes.join(" · ") } })]
      : []),
  ]);
  return { id: ticket.ticketNo, status: TICKET_STATUS[status] };
}

export async function deleteTicket(id, user) {
  const ticket = await mustFind("ticket", id, "Ticket");
  assertFlatAccess(user, ticket.flatId, "Ticket");
  await prisma.ticket.delete({ where: { id } });
  return { id: ticket.ticketNo };
}

export async function updateVendor(id, body) {
  await mustFind("vendor", id, "Vendor");
  const renewal = optionalText(body.renewal);
  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      name: body.name.trim(),
      service: body.service.trim(),
      phone: body.phone.trim(),
      contractValue: body.value.trim(),
      renewalOn: renewal ? parseLooseDate(renewal) : null,
      renewalLabel: renewal,
      paymentState: fromLabel(PAYMENT_STATE, body.pay, "pay"),
      paymentNote: body.pay,
    },
  });
  return { name: updated.name };
}

export async function deleteVendor(id) {
  const vendor = await mustFind("vendor", id, "Vendor");
  await prisma.vendor.delete({ where: { id } });
  return { name: vendor.name };
}

export async function updateAsset(id, body) {
  await mustFind("asset", id, "Asset");
  const updated = await prisma.asset.update({
    where: { id },
    data: {
      name: body.name.trim(),
      category: body.category.trim(),
      location: body.location.trim(),
      installedYear: parseCount(body.installed, null) || null,
      amcNote: optionalText(body.amc) || "—",
      condition: fromLabel(ASSET_CONDITION, body.condition, "condition"),
    },
  });
  return { tag: updated.tag };
}

export async function deleteAsset(id) {
  const asset = await mustFind("asset", id, "Asset");
  await prisma.asset.delete({ where: { id } });
  return { tag: asset.tag };
}

async function dropFacilityIfUnused(tx, facilityId) {
  const left = await tx.booking.count({ where: { facilityId } });
  if (!left) await tx.facility.delete({ where: { id: facilityId } });
}

export async function updateBooking(id, body, user) {
  const booking = await mustFind("booking", id, "Booking");
  assertFlatAccess(user, booking.flatId, "Booking");
  const society = await getSociety();
  const flat = await findFlatByCode(requireOwnFlat(user) || body.flat);
  const bookingDate = parseLooseDate(body.date);

  const updated = await prisma.$transaction(async (tx) => {
    const facility = await findOrCreateFacility(society.id, body.facility, tx);
    const row = await tx.booking.update({
      where: { id },
      data: {
        facilityId: facility.id,
        flatId: flat.id,
        bookingDate,
        dateLabel: dayLabel(bookingDate),
        slot: body.slot.trim(),
        charge: optionalText(body.charge) || "—",
        deposit: optionalText(body.deposit) || "—",
        paymentStatus: fromLabel(BOOKING_PAY, body.pay, "pay"),
      },
      include: { facility: true },
    });
    if (booking.facilityId !== facility.id) await dropFacilityIfUnused(tx, booking.facilityId);
    return row;
  });
  return { facility: updated.facility.name, flat: flat.code, date: updated.dateLabel };
}

export async function deleteBooking(id, user) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { facility: true, flat: true } });
  if (!booking) throw new AppError(404, "Booking not found.");
  assertFlatAccess(user, booking.flatId, "Booking");
  await prisma.$transaction(async (tx) => {
    await tx.booking.delete({ where: { id } });
    await dropFacilityIfUnused(tx, booking.facilityId);
  });
  return { facility: booking.facility.name, flat: booking.flat?.code || "—", date: booking.dateLabel };
}

export async function createBankAccount(body) {
  const society = await getSociety();
  const created = await prisma.bankAccount.create({
    data: { societyId: society.id, name: body.name, meta: body.meta, balance: body.balance },
  });
  return { name: created.name, balance: inr(created.balance) };
}

export async function updateBankAccount(id, body) {
  await mustFind("bankAccount", id, "Bank account");
  const updated = await prisma.bankAccount.update({
    where: { id },
    data: { name: body.name, meta: body.meta, balance: body.balance },
  });
  return { name: updated.name, balance: inr(updated.balance) };
}

export async function deleteBankAccount(id) {
  const account = await mustFind("bankAccount", id, "Bank account");
  await prisma.bankAccount.delete({ where: { id } });
  return { name: account.name };
}
