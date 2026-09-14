import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.vendor.count();

  const created = await prisma.vendor.create({
    data: {
      society: { connect: { id: (await prisma.society.findFirstOrThrow()).id } },
      name: "Phase2 CRUD Test Vendor",
      service: "Temporary verification row",
      phone: "00000 XXXXX",
      contractValue: "₹1",
      paymentState: "CLEAR",
      paymentNote: "Clear",
    },
  });

  const readBack = await prisma.vendor.findUniqueOrThrow({
    where: { id: created.id },
  });
  if (readBack.name !== "Phase2 CRUD Test Vendor") {
    throw new Error("read mismatch");
  }

  const updated = await prisma.vendor.update({
    where: { id: created.id },
    data: { service: "Updated verification row" },
  });
  if (updated.service !== "Updated verification row") {
    throw new Error("update mismatch");
  }

  await prisma.vendor.delete({ where: { id: created.id } });
  const gone = await prisma.vendor.findUnique({ where: { id: created.id } });
  if (gone) {
    throw new Error("delete mismatch");
  }

  const after = await prisma.vendor.count();
  if (after !== before) {
    throw new Error("row count changed after CRUD smoke test");
  }

  const sample = await prisma.society.findFirstOrThrow({
    include: {
      _count: {
        select: { blocks: true, tickets: true, vendors: true, staffMembers: true },
      },
      blocks: { include: { _count: { select: { flats: true } } } },
    },
  });

  const flatTotal = sample.blocks.reduce((sum, block) => sum + block._count.flats, 0);
  console.log("crud_ok", {
    society: sample.name,
    blocks: sample._count.blocks,
    flats: flatTotal,
    tickets: sample._count.tickets,
    vendors: sample._count.vendors,
    staff: sample._count.staffMembers,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
