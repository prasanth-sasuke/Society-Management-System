import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = String(process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "";
  if (!email || !password) {
    throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env (never commit them).");
  }

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
      name: "My Society",
      penaltyPerDay: 15,
      billingFrequency: "QUARTERLY",
    },
  });

  await prisma.user.create({
    data: {
      societyId: society.id,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName: "Superadmin",
      role: "SUPERADMIN",
    },
  });

  console.log("seed_ok", { society: society.name, users: 1, login: email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
