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
  facility: z.string().trim().min(1),
  flat: z.string().trim().min(1),
  date: z.string().trim().min(1),
  slot: z.string().trim().min(1),
  charge: z.string().optional(),
  deposit: z.string().optional(),
  pay: z.string().trim().min(1),
});

export function validate(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
