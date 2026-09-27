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

// Booking slots are free text ("6–10 pm", "9 am - 1 pm", "18:00-22:00", "Full day").
// Returns [startMinute, endMinute] or null when the text isn't a readable time range.
const FULL_DAY = /\b(full|all|whole)\s*day\b|\b24\s*h/i;
const TIME_RANGE = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;

function toMinutes(hour, minute, meridiem) {
  let h = Number(hour) % (meridiem ? 12 : 24);
  if (meridiem?.toLowerCase() === "pm") h += 12;
  return h * 60 + Number(minute || 0);
}

export function slotRange(slot) {
  const text = String(slot).trim().replace(/(\d)\.(\d{2})/g, "$1:$2").replace(/\./g, "");
  if (FULL_DAY.test(text)) return [0, 24 * 60];
  const m = text.match(TIME_RANGE);
  if (!m) return null;
  const [, h1, m1, mer1, h2, m2, mer2] = m;
  if (Number(h1) > 24 || Number(h2) > 24 || Number(m1 || 0) > 59 || Number(m2 || 0) > 59) return null;
  const end = toMinutes(h2, m2, mer2);
  let start = toMinutes(h1, m1, mer1 || mer2);
  // "11–2 pm" means 11 am to 2 pm.
  if (!mer1 && mer2 && start > end) start = toMinutes(h1, m1, mer2.toLowerCase() === "pm" ? "am" : "pm");
  return [start, end > start ? end : end + 24 * 60];
}

const normalizeSlot = (slot) => String(slot).toLowerCase().replace(/[\s.]/g, "").replace(/[–—]|to/g, "-");

export function slotsClash(a, b) {
  const ra = slotRange(a);
  const rb = slotRange(b);
  if (ra && rb) return ra[0] < rb[1] && rb[0] < ra[1];
  return normalizeSlot(a) === normalizeSlot(b);
}

export async function assertSlotFree(db, { facility, bookingDate, slot, exceptId }) {
  const sameDay = await db.booking.findMany({
    where: { facilityId: facility.id, bookingDate, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { slot: true, dateLabel: true },
  });
  const clash = sameDay.find((b) => slotsClash(b.slot, slot));
  if (clash) {
    throw new AppError(409, `${facility.name} is already booked on ${clash.dateLabel} for ${clash.slot}. Pick another slot or date.`);
  }
}
