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
} from "../labels.js";
import { getSociety, findFlatByCode } from "./society.js";

export async function getSocietyPayload() {
  const society = await getSociety();
  return {
    id: society.id,
    name: society.name,
    penaltyPerDay: society.penaltyPerDay,
    billingFrequency: society.billingFrequency === "MONTHLY" ? "Monthly" : "Quarterly, in advance",
  };
}

export async function getDashboard() {
  const society = await getSociety();
  const [flatTotal, occupied, vacant, openTickets, overdueBills] = await Promise.all([
    prisma.flat.count(),
    prisma.flat.count({ where: { status: { not: "VACANT" } } }),
    prisma.flat.count({ where: { status: "VACANT" } }),
    prisma.ticket.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.bill.count({ where: { status: "OVERDUE" } }),
  ]);
  return {
    society: await getSocietyPayload(),
    occupancy: { occupied, vacant, total: flatTotal },
    openTickets,
    overdueBills,
    staffOnPayroll: await prisma.staffMember.count({ where: { societyId: society.id } }),
    vendors: await prisma.vendor.count({ where: { societyId: society.id } }),
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
    floors: [4, 3, 2, 1].map((n) => ({
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
  const block = await prisma.block.findUnique({
    where: { societyId_code: { societyId: society.id, code: parsed.blockCode } },
  });
  if (!block) throw new AppError(400, `Unknown block: ${parsed.blockCode}`);
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

export async function listResidents() {
  const residents = await prisma.resident.findMany({
    where: { isCurrent: true },
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
    },
    include: { flat: true },
  });
  return serializeResident(created);
}

export async function listMoveEvents() {
  const rows = await prisma.moveEvent.findMany({
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

export async function listBills() {
  const rows = await prisma.bill.findMany({
    include: { flat: true, resident: true },
    orderBy: { flat: { code: "asc" } },
  });
  return rows.map((row) => ({
    id: row.id,
    flat: row.flat.code,
    resident: row.resident?.fullName || "—",
    maint: inr(row.maintenanceAmount),
    special: Number(row.specialAmount) ? inr(row.specialAmount) : "—",
    prev: Number(row.previousDue) ? inr(row.previousDue) : "—",
    penalty: Number(row.penaltyAmount) ? inr(row.penaltyAmount) : "—",
    total: inr(row.totalAmount),
    status: row.status === "OVERDUE" && row.overdueDays
      ? `Overdue — ${row.overdueDays} days`
      : row.status === "PART_PAID"
        ? `Part paid — ${inr(row.paidAmount)}`
        : BILL_STATUS[row.status],
    statusCode: row.status,
  }));
}

export async function listFinance() {
  const society = await getSociety();
  const [vouchers, banks, budget] = await Promise.all([
    prisma.voucher.findMany({ where: { societyId: society.id }, orderBy: { number: "asc" } }),
    prisma.bankAccount.findMany({ where: { societyId: society.id } }),
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

export async function listTickets() {
  const rows = await prisma.ticket.findMany({
    include: { events: { orderBy: { occurredAt: "asc" } }, feedback: true },
    orderBy: { ticketNo: "desc" },
  });
  return rows.map(serializeTicket);
}

export async function getTicket(ticketNo) {
  const row = await prisma.ticket.findUnique({
    where: { ticketNo },
    include: { events: { orderBy: { occurredAt: "asc" } }, feedback: true },
  });
  if (!row) throw new AppError(404, "Ticket not found");
  return serializeTicket(row);
}

export async function createTicket(body) {
  const society = await getSociety();
  const parsed = parseFlatCode(body.flat);
  let flat = null;
  if (parsed) {
    flat = await prisma.flat.findUnique({ where: { code: parsed.code } });
  }
  const last = await prisma.ticket.findFirst({ orderBy: { ticketNo: "desc" } });
  const nextNum = last ? Number(last.ticketNo.replace(/\D/g, "")) + 1 : 2042;
  const created = await prisma.ticket.create({
    data: {
      societyId: society.id,
      ticketNo: `HD-${nextNum}`,
      flatId: flat?.id || null,
      location: body.flat.trim(),
      category: fromLabel(TICKET_CATEGORY, body.category, "category"),
      description: body.text.trim(),
      priority: fromLabel(TICKET_PRIORITY, body.priority, "priority"),
      assignee: body.owner.trim(),
      photosNote: null,
      status: "ASSIGNED",
    },
    include: { events: true, feedback: true },
  });
  return serializeTicket(created);
}

export async function listStaff() {
  const society = await getSociety();
  return prisma.staffMember.findMany({
    where: { societyId: society.id },
    orderBy: { name: "asc" },
  }).then((rows) => rows.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    area: s.area,
    present: `${s.presentDays} / ${s.workingDays}`,
    salary: inr(s.salary),
    payout: s.payoutNote ? `Hold — ${s.payoutNote}` : s.payoutStatus === "PROCESSED" ? "Processed" : s.payoutStatus === "PENDING" ? "Pending" : "Hold",
  })));
}

export async function listRoster() {
  const society = await getSociety();
  const duties = await prisma.rosterDuty.findMany({
    where: { societyId: society.id },
    include: { assignments: { orderBy: { dayIndex: "asc" } } },
    orderBy: { name: "asc" },
  });
  const days = duties[0]?.assignments.map((a) => a.dayLabel) || [];
  return {
    days,
    rows: duties.map((d) => ({
      duty: d.name,
      cells: d.assignments.map((a) => ({
        who: a.personName,
        isOff: a.isOff,
      })),
    })),
  };
}

export async function listFollowUps() {
  const society = await getSociety();
  const rows = await prisma.followUp.findMany({
    where: { societyId: society.id },
    orderBy: { dueOn: "asc" },
  });
  return rows.map((f) => ({
    id: f.id,
    task: f.task,
    owner: f.ownerName,
    due: f.dueOn.toISOString().slice(5, 10),
    verifier: f.verifier,
    status: f.status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
  }));
}

export async function listVendors() {
  const society = await getSociety();
  const rows = await prisma.vendor.findMany({ where: { societyId: society.id }, orderBy: { name: "asc" } });
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

export async function listQuotations() {
  const society = await getSociety();
  return prisma.quotation.findMany({ where: { societyId: society.id } }).then((rows) =>
    rows.map((q) => ({ id: q.id, work: q.work, vendors: q.vendorsNote, range: q.rangeNote })),
  );
}

export async function listInvoices() {
  const rows = await prisma.vendorInvoice.findMany({ include: { vendor: true }, orderBy: { invoiceNo: "asc" } });
  return rows.map((i) => ({
    id: i.id,
    no: i.invoiceNo,
    who: i.description,
    amount: inr(i.amount),
    due: i.dueNote,
  }));
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

export async function listAmc() {
  const society = await getSociety();
  const rows = await prisma.amcContract.findMany({
    where: { societyId: society.id },
    include: { vendor: true },
    orderBy: { nextOn: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    equip: a.equipment,
    vendor: a.vendor?.name || "In-house",
    freq: a.frequency,
    next: a.nextOn.toISOString().slice(0, 10),
    status: a.status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
  }));
}

export async function listReminders() {
  const society = await getSociety();
  return prisma.maintenanceReminder.findMany({ where: { societyId: society.id } }).then((rows) =>
    rows.map((r) => ({ id: r.id, what: r.what, when: r.whenLabel })),
  );
}

export async function listBreakdowns() {
  const rows = await prisma.breakdownEvent.findMany({ orderBy: { happenedOn: "desc" } });
  return rows.map((b) => ({
    id: b.id,
    what: b.what,
    when: b.happenedOn.toISOString().slice(0, 10),
    note: b.note,
  }));
}

export async function listFacilities() {
  const society = await getSociety();
  const rows = await prisma.facility.findMany({ where: { societyId: society.id }, orderBy: { name: "asc" } });
  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    capacity: f.capacityNote,
    charge: f.chargeNote,
    next: f.nextNote,
    state: FACILITY_STATUS[f.status],
  }));
}

export async function listBookings() {
  const rows = await prisma.booking.findMany({
    include: { facility: true, flat: true },
    orderBy: { bookingDate: "asc" },
  });
  return rows.map(serializeBooking);
}

export async function createBooking(body) {
  const society = await getSociety();
  const facility = await prisma.facility.findFirst({
    where: { societyId: society.id, name: { equals: body.facility.trim(), mode: "insensitive" } },
  });
  if (!facility) throw new AppError(400, `Unknown facility: ${body.facility}`);
  const parsed = parseFlatCode(body.flat);
  const flat = parsed ? await prisma.flat.findUnique({ where: { code: parsed.code } }) : null;
  const created = await prisma.booking.create({
    data: {
      facilityId: facility.id,
      flatId: flat?.id || null,
      bookingDate: parseLooseDate(body.date),
      dateLabel: body.date.trim(),
      slot: body.slot.trim(),
      charge: body.charge?.trim() || "—",
      deposit: body.deposit?.trim() || "—",
      paymentStatus: fromLabel(BOOKING_PAY, body.pay, "pay"),
    },
    include: { facility: true, flat: true },
  });
  return serializeBooking(created);
}

export async function listSecurity() {
  const society = await getSociety();
  const [shifts, guards, handover, patrol, incidents] = await Promise.all([
    prisma.securityShift.findMany({ where: { societyId: society.id }, orderBy: { sortOrder: "asc" } }),
    prisma.guardAttendance.findMany({ where: { societyId: society.id }, orderBy: { name: "asc" } }),
    prisma.handoverNote.findMany({ where: { societyId: society.id } }),
    prisma.patrolCheck.findMany({ where: { societyId: society.id }, orderBy: { sortOrder: "asc" } }),
    prisma.incident.findMany({ where: { societyId: society.id }, orderBy: { happenedAt: "desc" } }),
  ]);
  return {
    shifts: shifts.map((s) => ({ name: s.name, hours: s.hours, staff: s.staffNote, state: s.state.replace("_", " ") })),
    guards: guards.map((g) => ({
      name: g.name,
      post: g.post,
      shift: g.shift,
      times: g.times,
      status: g.statusNote || g.status.replace("_", " "),
    })),
    handover: handover.map((h) => ({ when: h.whenLabel, note: h.note })),
    patrol: patrol.map((p) => ({ point: p.point, mark: p.mark })),
    incidents: incidents.map((i) => ({
      what: i.description,
      when: i.happenedAt.toISOString(),
      status: i.status.replaceAll("_", " "),
    })),
  };
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
    slot: row.slot,
    charge: row.charge,
    deposit: row.deposit,
    pay: BOOKING_PAY[row.paymentStatus],
  };
}
