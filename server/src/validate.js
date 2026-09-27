import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const flatCreateSchema = z.object({
  flat: z.string().trim().min(1),
  type: z.string().trim().min(1),
  carpet: z.union([z.string(), z.number()]).optional(),
  uds: z.union([z.string(), z.number()]).optional(),
  parking: z.union([z.string(), z.number()]).optional(),
  status: z.string().trim().min(1),
});

export const residentCreateSchema = z.object({
  name: z.string().trim().min(1),
  flat: z.string().trim().min(1),
  type: z.string().trim().min(1),
  family: z.union([z.string(), z.number()]).optional(),
  phone: z.string().trim().min(1),
  emergency: z.string().optional(),
  since: z.string().optional(),
});

export const ticketCreateSchema = z.object({
  flat: z.string().trim().min(1),
  category: z.string().trim().min(1),
  text: z.string().trim().min(1),
  priority: z.string().trim().min(1),
  owner: z.string().trim().min(1),
});

export const vendorCreateSchema = z.object({
  name: z.string().trim().min(1),
  service: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  value: z.string().trim().min(1),
  renewal: z.string().optional(),
  pay: z.string().trim().min(1),
});

export const assetCreateSchema = z.object({
  tag: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  location: z.string().trim().min(1),
  installed: z.union([z.string(), z.number()]).optional(),
  amc: z.string().optional(),
  condition: z.string().trim().min(1),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  role: z.string().trim().min(1),
});

export const bookingCreateSchema = z.object({
  facility: z.string().trim().min(1).max(60),
  flat: z.string().trim().min(1),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  slot: z.string().trim().min(1),
  charge: z.string().optional(),
  deposit: z.string().optional(),
  pay: z.string().trim().min(1),
});

const amount = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) {
    ctx.addIssue({ code: "custom", message: "Enter an amount in rupees, e.g. 4200" });
    return z.NEVER;
  }
  return Math.round(n * 100) / 100;
});

const positiveAmount = amount.refine((n) => n > 0, { message: "Amount must be more than ₹0" });

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

export const billGenerateSchema = z.object({
  period: z.string().trim().min(1).max(40),
  amount: positiveAmount,
  special: amount.optional().default(0),
  dueOn: isoDate,
  scope: z.string().trim().optional().default("All flats"),
});

export const paymentCreateSchema = z.object({
  amount: positiveAmount,
  mode: z.string().trim().min(1).max(30),
  paidOn: isoDate,
});

export const voucherCreateSchema = z.object({
  head: z.string().trim().min(1).max(80),
  party: z.string().trim().min(1).max(120),
  amount: positiveAmount,
  state: z.string().trim().min(1),
});

export const flatUpdateSchema = flatCreateSchema.omit({ flat: true });

export const residentUpdateSchema = residentCreateSchema.omit({ flat: true });

export const billUpdateSchema = z.object({
  period: z.string().trim().min(1).max(40),
  amount: positiveAmount,
  special: amount.optional().default(0),
  dueOn: isoDate,
});

export const ticketUpdateSchema = ticketCreateSchema.omit({ flat: true }).extend({
  status: z.string().trim().min(1),
  note: z.string().trim().max(300).optional(),
});

export const vendorUpdateSchema = vendorCreateSchema;

export const assetUpdateSchema = assetCreateSchema.omit({ tag: true });

export const bookingUpdateSchema = bookingCreateSchema;

export const bankAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  meta: z.string().trim().max(120).optional().default(""),
  balance: amount,
});

const text = (max) => z.string().trim().min(1).max(max);
const optionalText = (max) => z.string().trim().max(max).optional().default("");
const hhmm = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time");
const optionalTime = z.union([hhmm, z.literal("")]).optional().default("");

const workingDays = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? 26 : Number(v)))
  .pipe(z.number({ message: "Working days must be a number" }).int().min(1, "Working days must be 1–31").max(31, "Working days must be 1–31"));

export const staffSchema = z.object({
  name: text(80),
  role: text(60),
  area: optionalText(80),
  salary: amount,
  workingDays,
  payout: text(20),
  payoutNote: optionalText(120),
});

export const attendanceSaveSchema = z.object({
  date: isoDate,
  entries: z.array(z.object({
    staffId: z.string().trim().min(1),
    status: z.string().trim().optional().default(""),
  })).min(1).max(500),
});

export const rosterDutySchema = z.object({
  duty: text(80),
  mon: optionalText(60),
  tue: optionalText(60),
  wed: optionalText(60),
  thu: optionalText(60),
  fri: optionalText(60),
  sat: optionalText(60),
  sun: optionalText(60),
});

export const followUpSchema = z.object({
  task: text(160),
  owner: text(80),
  due: isoDate,
  verifier: optionalText(80),
  status: text(20),
});

export const shiftSchema = z.object({
  name: text(40),
  start: hhmm,
  end: hhmm,
  staff: optionalText(200),
});

export const guardEntrySchema = z.object({
  name: text(80),
  post: text(60),
  shift: text(40),
  timeIn: optionalTime,
  timeOut: optionalTime,
  status: text(20),
});

export const handoverSchema = z.object({
  handover: optionalText(60),
  note: text(500),
});

export const patrolPointSchema = z.object({ point: text(120) });

export const patrolUpdateSchema = z.object({
  point: text(120),
  state: text(20),
  note: optionalText(200),
});

export const incidentSchema = z.object({
  what: text(300),
  when: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick the date and time"),
  status: text(30),
});

export function validate(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
