import { prisma } from "../prisma.js";
import { AppError } from "../http.js";

export async function getSociety() {
  const society = await prisma.society.findFirst({ orderBy: { createdAt: "asc" } });
  if (!society) {
    throw new AppError(404, "No society found. Seed the database first.");
  }
  return society;
}

export async function findFlatByCode(code) {
  const flat = await prisma.flat.findUnique({
    where: { code: String(code).trim().toUpperCase() },
    include: { block: true },
  });
  if (!flat) throw new AppError(400, `Unknown flat: ${code}`);
  return flat;
}

export async function findOrCreateFacility(societyId, name, db = prisma) {
  const clean = String(name).trim();
  const existing = await db.facility.findFirst({
    where: { societyId, name: { equals: clean, mode: "insensitive" } },
  });
  if (existing) return existing;
  try {
    return await db.facility.create({
      data: { societyId, name: clean, capacityNote: "—", chargeNote: "—", nextNote: "—", status: "AVAILABLE" },
    });
  } catch (err) {
    if (err?.code !== "P2002") throw err;
    return db.facility.findFirst({ where: { societyId, name: { equals: clean, mode: "insensitive" } } });
  }
}
