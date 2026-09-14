import { AppError } from "../http.js";
import { prisma } from "../prisma.js";
import { canRead, canWrite, permissionsFor } from "./permissions.js";
import { verifySession } from "./jwt.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) throw new AppError(401, "Sign in required.");
    const payload = verifySession(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) throw new AppError(401, "Sign in required.");
    req.user = {
      id: user.id,
      societyId: user.societyId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: permissionsFor(user.role),
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(moduleName, level = "read") {
  return (req, _res, next) => {
    const allowed = level === "write"
      ? canWrite(req.user?.permissions, moduleName)
      : canRead(req.user?.permissions, moduleName);
    if (!allowed) {
      next(new AppError(403, "You do not have access to this module."));
      return;
    }
    next();
  };
}
