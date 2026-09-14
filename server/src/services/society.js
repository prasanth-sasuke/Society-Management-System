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
