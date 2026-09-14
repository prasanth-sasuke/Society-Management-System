import { loadCloudEnv } from "./cloud-env.js";

const cloud = await loadCloudEnv();
process.env.DATABASE_URL = cloud.DATABASE_URL;
process.env.DIRECT_URL = cloud.DIRECT_URL;
if (cloud.SUPERADMIN_EMAIL) process.env.SUPERADMIN_EMAIL = cloud.SUPERADMIN_EMAIL;
if (cloud.SUPERADMIN_PASSWORD) process.env.SUPERADMIN_PASSWORD = cloud.SUPERADMIN_PASSWORD;
await import("../prisma/seed.js");
