import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LETTERS = "ABCDEF";

const BLOCK_DEFS = [
  { name: "Block A", code: "A", units: 6, pending: ["2F", "4A"], vacant: ["2E"] },
  { name: "Block B", code: "B", units: 4, pending: ["2D"], vacant: ["2B"] },
  { name: "Block C", code: "C", units: 4, pending: ["4A", "1B"], vacant: ["2B", "2D"] },
  { name: "Block D", code: "D", units: 6, pending: ["4A", "4C", "2D", "1C"], vacant: ["3F"] },
  { name: "Block E", code: "E", units: 6, pending: ["3D", "2A", "2C", "1C"], vacant: [] },
];

const FLAT_DETAILS = {
  "A-1A": { type: "BHK3", carpetSqft: 1240, udsSqft: 420, parkingSlots: 2, status: "OWNER_OCCUPIED" },
  "A-1B": { type: "BHK2", carpetSqft: 980, udsSqft: 330, parkingSlots: 1, status: "TENANT" },
  "A-1C": { type: "BHK3", carpetSqft: 1240, udsSqft: 420, parkingSlots: 2, status: "VACANT" },
  "A-1D": { type: "BHK2", carpetSqft: 980, udsSqft: 330, parkingSlots: 1, status: "OWNER_OCCUPIED" },
  "A-1E": { type: "BHK2", carpetSqft: 980, udsSqft: 330, parkingSlots: 1, status: "TENANT" },
  "A-1F": { type: "BHK1", carpetSqft: 620, udsSqft: 210, parkingSlots: 1, status: "OWNER_OCCUPIED" },
};

const TENANT_FLATS = new Set(["A-1B", "A-1E", "C-3D", "E-1C"]);
const OWNER_FLATS = new Set(["A-1A", "A-1D", "A-1F", "B-2B", "D-4C"]);

function d(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.breakdownEvent.deleteMany(),
    prisma.ticketFeedback.deleteMany(),
    prisma.ticketEvent.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.moveEvent.deleteMany(),
    prisma.resident.deleteMany(),
    prisma.rosterAssignment.deleteMany(),
    prisma.rosterDuty.deleteMany(),
    prisma.vendorInvoice.deleteMany(),
    prisma.amcContract.deleteMany(),
    prisma.quotation.deleteMany(),
    prisma.maintenanceReminder.deleteMany(),
    prisma.followUp.deleteMany(),
    prisma.guardAttendance.deleteMany(),
    prisma.handoverNote.deleteMany(),
    prisma.patrolCheck.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.securityShift.deleteMany(),
    prisma.staffMember.deleteMany(),
    prisma.budgetLine.deleteMany(),
    prisma.bankAccount.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.facility.deleteMany(),
    prisma.flat.deleteMany(),
    prisma.block.deleteMany(),
    prisma.society.deleteMany(),
  ]);

  const society = await prisma.society.create({
    data: {
      name: "Greenfield Residency",
      penaltyPerDay: 15,
      billingFrequency: "QUARTERLY",
    },
  });

  const blocks = {};
  for (const [index, def] of BLOCK_DEFS.entries()) {
    blocks[def.code] = await prisma.block.create({
      data: {
        societyId: society.id,
        name: def.name,
        code: def.code,
        unitsPerFloor: def.units,
        floorCount: 4,
        sortOrder: index + 1,
      },
    });
  }

  const flats = {};
  for (const def of BLOCK_DEFS) {
    for (const floor of [4, 3, 2, 1]) {
      for (let i = 0; i < def.units; i += 1) {
        const unitLabel = `${floor}${LETTERS[i]}`;
        const code = `${def.code}-${unitLabel}`;
        const details = FLAT_DETAILS[code];
        const vacant = def.vacant.includes(unitLabel);
        const status = details?.status
          ?? (OWNER_FLATS.has(code) ? "OWNER_OCCUPIED"
            : TENANT_FLATS.has(code) ? "TENANT"
            : vacant ? "VACANT"
            : "OWNER_OCCUPIED");
        flats[code] = await prisma.flat.create({
          data: {
            blockId: blocks[def.code].id,
            code,
            floor,
            unitLabel,
            type: details?.type ?? "BHK2",
            carpetSqft: details?.carpetSqft ?? null,
            udsSqft: details?.udsSqft ?? null,
            parkingSlots: details?.parkingSlots ?? 1,
            status,
            duesPending: def.pending.includes(unitLabel),
          },
        });
      }
    }
  }

  const residentRows = [
    { code: "A-1A", fullName: "Ramesh Kumar", type: "OWNER", familyMembers: 4, phone: "98430 XXXXX", emergencyContact: "Lakshmi K. — 90031 XXXXX", residentSince: d(2019, 3, 1) },
    { code: "A-1B", fullName: "Sneha Iyer", type: "TENANT", familyMembers: 2, phone: "96297 XXXXX", emergencyContact: "Arjun Iyer — 96297 XXXXX", residentSince: d(2026, 1, 1) },
    { code: "B-2B", fullName: "Vinod Menon", type: "OWNER", familyMembers: 3, phone: "90802 XXXXX", emergencyContact: "Priya Menon — 90802 XXXXX", residentSince: d(2020, 7, 1) },
    { code: "C-3D", fullName: "Farida Sheikh", type: "TENANT", familyMembers: 3, phone: "97511 XXXXX", emergencyContact: null, residentSince: d(2025, 2, 14) },
    { code: "D-4C", fullName: "Anil Deshmukh", type: "OWNER", familyMembers: 5, phone: "99401 XXXXX", emergencyContact: "Sunita D. — 99401 XXXXX", residentSince: d(2018, 11, 1) },
    { code: "E-1C", fullName: "Kavya Raghavan", type: "TENANT", familyMembers: 1, phone: "93810 XXXXX", emergencyContact: "R. Raghavan — 93810 XXXXX", residentSince: d(2026, 8, 14) },
  ];

  const residents = {};
  for (const row of residentRows) {
    residents[row.code] = await prisma.resident.create({
      data: {
        flatId: flats[row.code].id,
        fullName: row.fullName,
        type: row.type,
        familyMembers: row.familyMembers,
        phone: row.phone,
        emergencyContact: row.emergencyContact,
        residentSince: row.residentSince,
      },
    });
  }

  await prisma.moveEvent.createMany({
    data: [
      { flatId: flats["D-4C"].id, residentId: residents["D-4C"].id, type: "MOVE_OUT", happenedOn: d(2026, 9, 2), notes: "D-4C — move-out scheduled" },
      { flatId: flats["E-1C"].id, residentId: residents["E-1C"].id, type: "MOVE_IN", happenedOn: d(2026, 8, 14), notes: "E-1C — new tenant moved in" },
      { flatId: flats["C-3D"].id, residentId: residents["C-3D"].id, type: "MOVE_IN", happenedOn: d(2025, 2, 14), notes: "C-3D — new tenant moved in" },
      { flatId: flats["A-1B"].id, residentId: residents["A-1B"].id, type: "LEASE_RENEWAL", happenedOn: d(2026, 1, 1), notes: "A-1B — tenant renewed lease" },
    ],
  });

  await prisma.bill.createMany({
    data: [
      { flatId: flats["A-1A"].id, residentId: residents["A-1A"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 12600, specialAmount: 0, previousDue: 0, penaltyAmount: 0, paidAmount: 12600, totalAmount: 12600, status: "PAID" },
      { flatId: flats["A-1B"].id, residentId: residents["A-1B"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 10800, specialAmount: 1000, previousDue: 0, penaltyAmount: 0, paidAmount: 0, totalAmount: 11800, status: "PENDING" },
      { flatId: flats["B-2B"].id, residentId: residents["B-2B"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 12600, specialAmount: 0, previousDue: 0, penaltyAmount: 0, paidAmount: 12600, totalAmount: 12600, status: "PAID" },
      { flatId: flats["C-3D"].id, residentId: residents["C-3D"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 12600, specialAmount: 0, previousDue: 4600, penaltyAmount: 630, paidAmount: 0, totalAmount: 17830, status: "OVERDUE", overdueDays: 42 },
      { flatId: flats["D-4C"].id, residentId: residents["D-4C"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 14400, specialAmount: 2500, previousDue: 0, penaltyAmount: 0, paidAmount: 16900, totalAmount: 16900, status: "PAID" },
      { flatId: flats["E-1C"].id, residentId: residents["E-1C"].id, periodLabel: "Q3 2026", billedOn: d(2026, 7, 1), dueOn: d(2026, 7, 15), maintenanceAmount: 8400, specialAmount: 0, previousDue: 0, penaltyAmount: 0, paidAmount: 4000, totalAmount: 8400, status: "PART_PAID" },
    ],
  });

  await prisma.voucher.createMany({
    data: [
      { societyId: society.id, number: "PV/26-27/218", accountHead: "Lift AMC", partyName: "Skyline Elevators", amount: 48000, status: "APPROVED" },
      { societyId: society.id, number: "PV/26-27/219", accountHead: "DG diesel", partyName: "Sri Fuels", amount: 36500, status: "APPROVED" },
      { societyId: society.id, number: "PV/26-27/220", accountHead: "Housekeeping salary", partyName: "Payroll", amount: 142000, status: "APPROVED" },
      { societyId: society.id, number: "PV/26-27/221", accountHead: "Plumbing repair, C-block", partyName: "Ravi Plumbing", amount: 18700, status: "EC_APPROVAL" },
      { societyId: society.id, number: "PV/26-27/222", accountHead: "CCTV upgrade (advance)", partyName: "SecureVision", amount: 75000, status: "EC_APPROVAL" },
      { societyId: society.id, number: "PV/26-27/223", accountHead: "Garden saplings", partyName: "Green Nursery", amount: 6200, status: "DRAFT" },
    ],
  });

  await prisma.bankAccount.createMany({
    data: [
      { societyId: society.id, name: "HDFC — current A/C", meta: "••4821 · operating account", balance: 512400 },
      { societyId: society.id, name: "SBI — sinking fund", meta: "••7730 · restricted", balance: 248000 },
      { societyId: society.id, name: "Petty cash", meta: "Manager custody", balance: 24500 },
    ],
  });

  await prisma.budgetLine.createMany({
    data: [
      { societyId: society.id, head: "Housekeeping", spentAmount: 1420000, budgetAmount: 1700000 },
      { societyId: society.id, head: "Electricity & DG", spentAmount: 980000, budgetAmount: 1100000 },
      { societyId: society.id, head: "Lift & pumps AMC", spentAmount: 390000, budgetAmount: 420000 },
      { societyId: society.id, head: "Security", spentAmount: 410000, budgetAmount: 640000 },
      { societyId: society.id, head: "Repairs & civil", spentAmount: 190000, budgetAmount: 200000 },
    ],
  });

  const ticketHd2041 = await prisma.ticket.create({
    data: {
      societyId: society.id,
      ticketNo: "HD-2041",
      flatId: flats["B-3A"]?.id ?? null,
      location: "B-3A",
      category: "LIFT",
      description: "Lift B stopped between 3rd and 4th",
      priority: "HIGH",
      assignee: "Skyline Elevators",
      photosNote: "2 photos",
      status: "IN_PROGRESS",
    },
  });

  await prisma.ticket.createMany({
    data: [
      { societyId: society.id, ticketNo: "HD-2039", flatId: flats["C-2A"].id, location: "C-2A", category: "PLUMBING", description: "Water seepage on bedroom ceiling", priority: "HIGH", assignee: "Ravi (plumber)", photosNote: "3 photos", status: "IN_PROGRESS" },
      { societyId: society.id, ticketNo: "HD-2038", flatId: flats["A-4D"].id, location: "A-4D", category: "ELECTRICAL", description: "Frequent MCB trip in kitchen line", priority: "MEDIUM", assignee: "Suresh (electrician)", photosNote: "1 photo", status: "ASSIGNED" },
      { societyId: society.id, ticketNo: "HD-2036", location: "D-3 corridor", category: "HOUSEKEEPING", description: "Corridor light not working", priority: "LOW", assignee: "Suresh (electrician)", photosNote: null, status: "ASSIGNED" },
      { societyId: society.id, ticketNo: "HD-2033", location: "Gym", category: "FACILITY", description: "Treadmill making grinding noise", priority: "MEDIUM", assignee: "FitCare Services", photosNote: "1 photo", status: "AWAITING_VENDOR" },
      { societyId: society.id, ticketNo: "HD-2030", flatId: flats["E-2C"].id, location: "E-2C", category: "CARPENTRY", description: "Main door lock jammed", priority: "LOW", assignee: "Manager", photosNote: null, status: "RESOLVED" },
      { societyId: society.id, ticketNo: "HD-2027", location: "Basement", category: "SECURITY", description: "CCTV camera 7 offline", priority: "HIGH", assignee: "SecureVision", photosNote: "1 photo", status: "RESOLVED" },
    ],
  });

  await prisma.ticketEvent.createMany({
    data: [
      { ticketId: ticketHd2041.id, occurredAt: new Date("2026-08-26T08:12:00+05:30"), note: "Raised by resident (B-3A) with 2 photos" },
      { ticketId: ticketHd2041.id, occurredAt: new Date("2026-08-26T08:40:00+05:30"), note: "Assigned to Skyline Elevators by manager" },
      { ticketId: ticketHd2041.id, occurredAt: new Date("2026-08-26T11:05:00+05:30"), note: "Technician on site — controller card fault" },
      { ticketId: ticketHd2041.id, occurredAt: new Date("2026-08-27T09:30:00+05:30"), note: "Spare ordered; temporary lock-out in place" },
    ],
  });

  await prisma.ticketFeedback.createMany({
    data: [
      { residentLabel: "A-2C — plumbing", stars: 5, note: "Fixed the same evening, no follow-up needed." },
      { residentLabel: "E-2C — carpentry", stars: 4, note: "Good work, took a day longer than promised." },
      { residentLabel: "Basement — CCTV", stars: 4, note: "Camera back online; wiring still untidy." },
      { residentLabel: "D-1B — housekeeping", stars: 3, note: "Staircase cleaning missed twice last week." },
    ],
  });

  await prisma.staffMember.createMany({
    data: [
      { societyId: society.id, name: "Lakshmi Devi", role: "Housekeeping", area: "Blocks A & B", presentDays: 25, workingDays: 26, salary: 16500, payoutStatus: "PROCESSED" },
      { societyId: society.id, name: "Shanti Bai", role: "Housekeeping", area: "Blocks C & D", presentDays: 26, workingDays: 26, salary: 16500, payoutStatus: "PROCESSED" },
      { societyId: society.id, name: "Suresh N.", role: "Electrician", area: "Society-wide", presentDays: 24, workingDays: 26, salary: 28000, payoutStatus: "PROCESSED" },
      { societyId: society.id, name: "Ravi Kumar", role: "Plumber", area: "Society-wide", presentDays: 22, workingDays: 26, salary: 26000, payoutStatus: "HOLD", payoutNote: "leave" },
      { societyId: society.id, name: "Murugan S.", role: "Gardener", area: "Lawns & podium", presentDays: 20, workingDays: 26, salary: 15000, payoutStatus: "PENDING" },
      { societyId: society.id, name: "Prakash J.", role: "Manager", area: "Society office", presentDays: 26, workingDays: 26, salary: 52000, payoutStatus: "PROCESSED" },
      { societyId: society.id, name: "Anitha R.", role: "Housekeeping", area: "Block E & clubhouse", presentDays: 26, workingDays: 26, salary: 16500, payoutStatus: "PROCESSED" },
    ],
  });

  const days = ["Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28", "Sat 29", "Sun 30"];
  const roster = [
    { duty: "Common area sweeping", who: ["Lakshmi", "Lakshmi", "Shanti", "Shanti", "Lakshmi", "Anitha", "Anitha"] },
    { duty: "Staircase mopping", who: ["Shanti", "Anitha", "Anitha", "Lakshmi", "Shanti", "Shanti", "Off"] },
    { duty: "Garbage clearance", who: ["Murugan", "Murugan", "Murugan", "Murugan", "Murugan", "Murugan", "Off"] },
    { duty: "Pump / DG check", who: ["Suresh", "Suresh", "Suresh", "Suresh", "Suresh", "Ravi", "Ravi"] },
    { duty: "Garden watering", who: ["Murugan", "Off", "Murugan", "Off", "Murugan", "Off", "Murugan"] },
    { duty: "Gate supervision", who: ["Prakash", "Prakash", "Prakash", "Prakash", "Prakash", "Ganesh", "Ganesh"] },
  ];

  for (const row of roster) {
    const duty = await prisma.rosterDuty.create({
      data: { societyId: society.id, name: row.duty, weekStart: d(2026, 8, 24) },
    });
    await prisma.rosterAssignment.createMany({
      data: row.who.map((person, dayIndex) => ({
        dutyId: duty.id,
        dayIndex,
        dayLabel: days[dayIndex],
        personName: person,
        isOff: person === "Off",
      })),
    });
  }

  await prisma.followUp.createMany({
    data: [
      { societyId: society.id, task: "Terrace water tank cleaning — Block C", ownerName: "Prakash J.", dueOn: d(2026, 8, 27), verifier: "EC — Mr. Menon", status: "VERIFIED" },
      { societyId: society.id, task: "Basement gate motor servicing", ownerName: "Suresh N.", dueOn: d(2026, 8, 28), verifier: "Manager", status: "IN_PROGRESS" },
      { societyId: society.id, task: "Perimeter patrol signature (night)", ownerName: "Selvam A.", dueOn: d(2026, 8, 27), verifier: "Security supervisor", status: "ESCALATED" },
      { societyId: society.id, task: "Pest control — Block E", ownerName: "PestShield", dueOn: d(2026, 8, 27), verifier: "Manager", status: "SCHEDULED" },
      { societyId: society.id, task: "Fire extinguisher refill (6 units)", ownerName: "SafeGuard Fire", dueOn: d(2026, 8, 30), verifier: "EC — Mrs. Rao", status: "SCHEDULED" },
      { societyId: society.id, task: "Lift B controller card fitment", ownerName: "Skyline Elevators", dueOn: d(2026, 8, 28), verifier: "Manager", status: "IN_PROGRESS" },
    ],
  });

  const vendors = {};
  const vendorRows = [
    { key: "skyline", name: "Skyline Elevators", service: "Lift AMC — 4 lifts", phone: "98410 XXXXX", contractValue: "₹1,92,000/yr", renewalOn: d(2026, 9, 5), renewalLabel: "5 Sep 2026", paymentState: "DUE", paymentNote: "Due ₹48,000" },
    { key: "powergen", name: "PowerGen Services", service: "DG set AMC", phone: "99620 XXXXX", contractValue: "₹84,000/yr", renewalOn: d(2027, 3, 31), renewalLabel: "31 Mar 2027", paymentState: "CLEAR", paymentNote: "Clear" },
    { key: "secure", name: "SecureVision", service: "CCTV — 32 cameras", phone: "90035 XXXXX", contractValue: "₹1,20,000/yr", renewalOn: d(2026, 11, 18), renewalLabel: "18 Nov 2026", paymentState: "DUE", paymentNote: "Due ₹75,000" },
    { key: "safeguard", name: "SafeGuard Fire", service: "Fire equipment", phone: "97890 XXXXX", contractValue: "₹66,000/yr", renewalOn: d(2026, 10, 12), renewalLabel: "12 Oct 2026", paymentState: "CLEAR", paymentNote: "Clear" },
    { key: "pest", name: "PestShield", service: "Pest control — quarterly", phone: "94441 XXXXX", contractValue: "₹48,000/yr", renewalOn: d(2027, 1, 1), renewalLabel: "1 Jan 2027", paymentState: "CLEAR", paymentNote: "Clear" },
    { key: "aqua", name: "AquaPure", service: "Water tank cleaning, STP", phone: "93450 XXXXX", contractValue: "₹1,08,000/yr", renewalOn: d(2027, 6, 30), renewalLabel: "30 Jun 2027", paymentState: "CLEAR", paymentNote: "Clear" },
    { key: "fuels", name: "Sri Fuels", service: "DG diesel supply", phone: "90921 XXXXX", contractValue: "Per order", renewalOn: null, renewalLabel: null, paymentState: "DUE", paymentNote: "Due ₹36,500" },
  ];
  for (const row of vendorRows) {
    vendors[row.key] = await prisma.vendor.create({
      data: {
        societyId: society.id,
        name: row.name,
        service: row.service,
        phone: row.phone,
        contractValue: row.contractValue,
        renewalOn: row.renewalOn,
        renewalLabel: row.renewalLabel,
        paymentState: row.paymentState,
        paymentNote: row.paymentNote,
      },
    });
  }

  await prisma.quotation.createMany({
    data: [
      { societyId: society.id, work: "Block C exterior painting", vendorsNote: "3 quotations received", rangeNote: "₹4.2L – ₹5.6L" },
      { societyId: society.id, work: "Basement waterproofing", vendorsNote: "2 quotations · 1 awaited", rangeNote: "₹1.8L – ₹2.1L" },
      { societyId: society.id, work: "Gym equipment servicing", vendorsNote: "2 quotations received", rangeNote: "₹22K – ₹31K" },
      { societyId: society.id, work: "Solar lighting, podium", vendorsNote: "1 quotation received", rangeNote: "₹3.4L" },
    ],
  });

  await prisma.vendorInvoice.createMany({
    data: [
      { vendorId: vendors.skyline.id, invoiceNo: "INV/SKY/2026/311", description: "Skyline Elevators · Lift AMC Q3", amount: 48000, dueNote: "Due in 3 days" },
      { vendorId: vendors.secure.id, invoiceNo: "INV/SV/2026/104", description: "SecureVision · CCTV upgrade advance", amount: 75000, dueNote: "EC approval pending" },
      { vendorId: vendors.fuels.id, invoiceNo: "INV/SF/2026/882", description: "Sri Fuels · diesel, Aug", amount: 36500, dueNote: "Overdue 6 days" },
      { vendorId: vendors.pest.id, invoiceNo: "INV/PS/2026/067", description: "PestShield · Q2 service", amount: 12000, dueNote: "Due 5 Sep" },
    ],
  });

  const liftB = await prisma.asset.create({
    data: {
      societyId: society.id,
      tag: "LFT-B1",
      name: "Passenger lift — Block B",
      category: "Lifts",
      location: "Block B core",
      installedYear: 2018,
      amcNote: "AMC to 5 Sep 2026",
      condition: "UNDER_REPAIR",
    },
  });

  await prisma.asset.createMany({
    data: [
      { societyId: society.id, tag: "LFT-A1", name: "Passenger lift — Block A", category: "Lifts", location: "Block A core", installedYear: 2018, amcNote: "AMC to 5 Sep 2026", condition: "GOOD" },
      { societyId: society.id, tag: "DG-01", name: "Diesel generator 250 kVA", category: "Power backup", location: "DG yard", installedYear: 2019, amcNote: "AMC to 31 Mar 2027", condition: "GOOD" },
      { societyId: society.id, tag: "PMP-03", name: "Booster pump — Block C", category: "Pumps", location: "Pump room", installedYear: 2020, amcNote: "Warranty expired", condition: "MONITOR" },
      { societyId: society.id, tag: "PNL-01", name: "Main LT panel", category: "Electrical", location: "Substation", installedYear: 2018, amcNote: "Annual thermography", condition: "GOOD" },
      { societyId: society.id, tag: "CCTV-07", name: "Dome camera — basement ramp", category: "CCTV", location: "Basement", installedYear: 2021, amcNote: "AMC to 18 Nov 2026", condition: "GOOD" },
      { societyId: society.id, tag: "FIRE-12", name: "Fire extinguisher 6 kg ABC", category: "Fire safety", location: "Block D lobby", installedYear: 2023, amcNote: "Refill due 30 Aug", condition: "REFILL_DUE" },
      { societyId: society.id, tag: "GYM-04", name: "Treadmill", category: "Gym equipment", location: "Clubhouse gym", installedYear: 2022, amcNote: "No AMC", condition: "OUT_OF_SERVICE" },
      { societyId: society.id, tag: "FUR-31", name: "Hall chairs (set of 100)", category: "Furniture", location: "Community hall", installedYear: 2019, amcNote: "—", condition: "GOOD" },
    ],
  });

  await prisma.amcContract.createMany({
    data: [
      { societyId: society.id, vendorId: vendors.skyline.id, equipment: "Lifts (4 nos.)", frequency: "Monthly", nextOn: d(2026, 9, 5), status: "RENEWAL_DUE" },
      { societyId: society.id, vendorId: vendors.powergen.id, equipment: "DG set 250 kVA", frequency: "Quarterly", nextOn: d(2026, 9, 15), status: "ACTIVE" },
      { societyId: society.id, vendorId: vendors.secure.id, equipment: "CCTV — 32 cameras", frequency: "Quarterly", nextOn: d(2026, 10, 2), status: "ACTIVE" },
      { societyId: society.id, vendorId: vendors.safeguard.id, equipment: "Fire equipment", frequency: "Half-yearly", nextOn: d(2026, 8, 30), status: "DUE_THIS_WEEK" },
      { societyId: society.id, vendorId: vendors.aqua.id, equipment: "Water tanks & STP", frequency: "Quarterly", nextOn: d(2026, 9, 12), status: "ACTIVE" },
      { societyId: society.id, vendorId: vendors.pest.id, equipment: "Pest control", frequency: "Quarterly", nextOn: d(2026, 8, 27), status: "SCHEDULED_TODAY" },
      { societyId: society.id, equipment: "Booster pumps", frequency: "Monthly", nextOn: d(2026, 9, 1), status: "ACTIVE" },
    ],
  });

  await prisma.maintenanceReminder.createMany({
    data: [
      { societyId: society.id, what: "Pest control — Block E", whenLabel: "Today" },
      { societyId: society.id, what: "Fire extinguisher refill (6)", whenLabel: "30 Aug" },
      { societyId: society.id, what: "Lift AMC renewal", whenLabel: "5 Sep" },
      { societyId: society.id, what: "Water tank cleaning", whenLabel: "12 Sep" },
      { societyId: society.id, what: "DG quarterly service", whenLabel: "15 Sep" },
    ],
  });

  await prisma.breakdownEvent.createMany({
    data: [
      { assetId: liftB.id, what: "Controller card fault", happenedOn: d(2026, 8, 26), note: "Lift B locked out; spare ordered, ETA 28 Aug." },
      { assetId: liftB.id, what: "Door sensor misalignment", happenedOn: d(2026, 6, 11), note: "Adjusted on site, no cost under AMC." },
      { assetId: liftB.id, what: "Overload sensor trip", happenedOn: d(2026, 2, 3), note: "Sensor replaced — ₹4,200 outside AMC scope." },
      { assetId: liftB.id, what: "Emergency light battery", happenedOn: d(2025, 11, 19), note: "Battery pack replaced under warranty." },
    ],
  });

  const facilities = {};
  const facilityRows = [
    { key: "hall", name: "Community hall", capacityNote: "Seats 120 · 6 slots/week", chargeNote: "₹3,000 / slot", nextNote: "Booked today", status: "BOOKED" },
    { key: "party", name: "Party area", capacityNote: "Seats 60", chargeNote: "₹1,500 / slot", nextNote: "Free", status: "AVAILABLE" },
    { key: "gym", name: "Gym", capacityNote: "18 stations", chargeNote: "Free for residents", nextNote: "Open 5 am – 10 pm", status: "AVAILABLE" },
    { key: "pool", name: "Swimming pool", capacityNote: "25 m · 4 lanes", chargeNote: "₹500 / guest", nextNote: "Reopens 29 Aug", status: "MAINTENANCE" },
    { key: "sports", name: "Sports room", capacityNote: "TT, carrom, chess", chargeNote: "Free for residents", nextNote: "Free", status: "AVAILABLE" },
    { key: "guest", name: "Guest suite", capacityNote: "2 rooms", chargeNote: "₹900 / night", nextNote: "1 room free", status: "PARTLY_BOOKED" },
  ];
  for (const row of facilityRows) {
    facilities[row.key] = await prisma.facility.create({
      data: {
        societyId: society.id,
        name: row.name,
        capacityNote: row.capacityNote,
        chargeNote: row.chargeNote,
        nextNote: row.nextNote,
        status: row.status,
      },
    });
  }

  await prisma.booking.createMany({
    data: [
      { facilityId: facilities.hall.id, flatId: flats["B-2B"].id, bookingDate: d(2026, 8, 27), dateLabel: "27 Aug", slot: "6–10 pm", charge: "₹3,000", deposit: "₹5,000", paymentStatus: "PAID" },
      { facilityId: facilities.party.id, flatId: flats["A-1A"].id, bookingDate: d(2026, 8, 29), dateLabel: "29 Aug", slot: "7–10 pm", charge: "₹1,500", deposit: "₹2,000", paymentStatus: "PAID" },
      { facilityId: facilities.hall.id, flatId: flats["D-4C"].id, bookingDate: d(2026, 8, 31), dateLabel: "31 Aug", slot: "11 am–3 pm", charge: "₹3,000", deposit: "₹5,000", paymentStatus: "PENDING" },
      { facilityId: facilities.guest.id, flatId: flats["E-1C"].id, bookingDate: d(2026, 9, 2), dateLabel: "2–4 Sep", slot: "2 nights", charge: "₹1,800", deposit: "—", paymentStatus: "PAID" },
      { facilityId: facilities.sports.id, flatId: flats["C-1D"].id, bookingDate: d(2026, 9, 3), dateLabel: "3 Sep", slot: "5–7 pm", charge: "Free", deposit: "—", paymentStatus: "NA" },
      { facilityId: facilities.hall.id, flatId: flats["A-3B"].id, bookingDate: d(2026, 9, 7), dateLabel: "7 Sep", slot: "4–9 pm", charge: "₹3,000", deposit: "₹5,000", paymentStatus: "AWAITING_APPROVAL" },
    ],
  });

  await prisma.securityShift.createMany({
    data: [
      { societyId: society.id, name: "Morning", hours: "06:00 – 14:00", staffNote: "Ganesh P. (main gate) · Iqbal S. (basement) · Ramu K. (rounds)", state: "COMPLETED", sortOrder: 1 },
      { societyId: society.id, name: "Evening", hours: "14:00 – 22:00", staffNote: "Mahesh R. (main gate) · Dinesh V. (clubhouse) · Ravi T. (rounds)", state: "ON_DUTY", sortOrder: 2 },
      { societyId: society.id, name: "Night", hours: "22:00 – 06:00", staffNote: "Karthik B. (main gate) · Selvam A. (rounds)", state: "NEXT", sortOrder: 3 },
    ],
  });

  await prisma.guardAttendance.createMany({
    data: [
      { societyId: society.id, name: "Ganesh P.", post: "Main gate", shift: "Morning", times: "05:52 / 14:04", status: "PRESENT", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Iqbal S.", post: "Basement", shift: "Morning", times: "06:05 / 14:02", status: "LATE", statusNote: "Late by 5m", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Ramu K.", post: "Patrol", shift: "Morning", times: "05:58 / 14:00", status: "PRESENT", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Mahesh R.", post: "Main gate", shift: "Evening", times: "13:50 / —", status: "ON_DUTY", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Dinesh V.", post: "Clubhouse", shift: "Evening", times: "13:56 / —", status: "ON_DUTY", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Suman L.", post: "Patrol", shift: "Evening", times: "— / —", status: "ABSENT", attendedOn: d(2026, 8, 27) },
      { societyId: society.id, name: "Karthik B.", post: "Main gate", shift: "Night", times: "— / —", status: "ROSTERED", attendedOn: d(2026, 8, 27) },
    ],
  });

  await prisma.handoverNote.createMany({
    data: [
      { societyId: society.id, whenLabel: "Morning → Evening, 14:00", note: "Lift B locked out on 3rd floor; vendor spare expected tomorrow. Visitor pass book at 41 entries." },
      { societyId: society.id, whenLabel: "Night → Morning, 06:00", note: "Two-wheeler without sticker parked in visitor bay — sticker issued at 07:20." },
      { societyId: society.id, whenLabel: "Evening → Night, 22:00 (26 Aug)", note: "Basement gate motor slow to close; PPM ticket raised." },
    ],
  });

  await prisma.patrolCheck.createMany({
    data: [
      { societyId: society.id, point: "Terrace doors — all blocks", mark: "Locked · 23:10", sortOrder: 1 },
      { societyId: society.id, point: "Basement — fire exit clear", mark: "Clear · 23:25", sortOrder: 2 },
      { societyId: society.id, point: "Pump room", mark: "Checked · 00:05", sortOrder: 3 },
      { societyId: society.id, point: "Children’s play area", mark: "Gate open — fixed", sortOrder: 4 },
      { societyId: society.id, point: "Perimeter walk (E → A)", mark: "Not signed", sortOrder: 5 },
    ],
  });

  await prisma.incident.createMany({
    data: [
      { societyId: society.id, description: "Unregistered visitor argued at gate — police not required", happenedAt: new Date("2026-08-25T21:40:00+05:30"), status: "CLOSED" },
      { societyId: society.id, description: "Two-wheeler scratched in basement (D block bay 12)", happenedAt: new Date("2026-08-22T18:05:00+05:30"), status: "UNDER_REVIEW" },
      { societyId: society.id, description: "Fire alarm false trigger, Block C 2nd floor", happenedAt: new Date("2026-08-18T03:15:00+05:30"), status: "CLOSED" },
      { societyId: society.id, description: "Delivery agent entered without pass", happenedAt: new Date("2026-08-14T12:30:00+05:30"), status: "CLOSED_WARNING" },
    ],
  });

  const demoPassword = process.env.DEMO_PASSWORD || "Demo@1234";
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  await prisma.user.createMany({
    data: [
      { societyId: society.id, email: "admin@greenfield.local", passwordHash, fullName: "Meera Rao", role: "ADMIN" },
      { societyId: society.id, email: "admin2@greenfield.local", passwordHash, fullName: "Sanjay Iyer", role: "ADMIN" },
      { societyId: society.id, email: "ec@greenfield.local", passwordHash, fullName: "Vinod Menon", role: "EC" },
      { societyId: society.id, email: "ec2@greenfield.local", passwordHash, fullName: "Lakshmi Krishnan", role: "EC" },
      { societyId: society.id, email: "manager@greenfield.local", passwordHash, fullName: "Prakash J.", role: "MANAGER" },
      { societyId: society.id, email: "accounts@greenfield.local", passwordHash, fullName: "Divya Nair", role: "ACCOUNTANT" },
      { societyId: society.id, email: "security@greenfield.local", passwordHash, fullName: "Ganesh P.", role: "SECURITY" },
      { societyId: society.id, email: "resident@greenfield.local", passwordHash, fullName: "Ramesh Kumar", role: "RESIDENT" },
      { societyId: society.id, email: "vendor@greenfield.local", passwordHash, fullName: "Skyline Elevators", role: "VENDOR" },
    ],
  });

  const counts = {
    flats: await prisma.flat.count(),
    residents: await prisma.resident.count(),
    tickets: await prisma.ticket.count(),
    vendors: await prisma.vendor.count(),
    assets: await prisma.asset.count(),
    bookings: await prisma.booking.count(),
    users: await prisma.user.count(),
  };
  console.log("seed_ok", { society: society.name, ...counts });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
