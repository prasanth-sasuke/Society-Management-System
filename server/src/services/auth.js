import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import { signSession } from "../auth/jwt.js";
import { ROLE_LABELS, ROLE_SCOPES, CREATABLE_ROLES, permissionsFor, permissionMatrixView } from "../auth/permissions.js";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role],
  };
}

export function sessionPayload(user) {
  const permissions = permissionsFor(user.role);
  return {
    token: signSession(user),
    user: publicUser(user),
    permissions,
  };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
  });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !user.active || !ok) {
    throw new AppError(401, "Invalid email or password.");
  }
  return sessionPayload(user);
}

export function currentSession(reqUser) {
  return {
    user: {
      id: reqUser.id,
      email: reqUser.email,
      fullName: reqUser.fullName,
      role: reqUser.role,
      roleLabel: ROLE_LABELS[reqUser.role],
    },
    permissions: reqUser.permissions,
  };
}

export async function createUser(body) {
  const society = await prisma.society.findFirst({ orderBy: { createdAt: "asc" } });
  if (!society) throw new AppError(404, "No society found.");
  const requested = String(body.role || "").trim();
  const role = CREATABLE_ROLES.find((item) => (
    item === requested.toUpperCase() || ROLE_LABELS[item].toLowerCase() === requested.toLowerCase()
  ));
  if (!role) {
    throw new AppError(400, "Choose a valid role. Superadmin cannot be created from the app.");
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const created = await prisma.user.create({
      data: {
        societyId: society.id,
        email,
        passwordHash,
        fullName: String(body.name || "").trim(),
        role,
      },
    });
    return publicUser(created);
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AppError(409, "A login with that email already exists.");
    }
    throw error;
  }
}

export async function listAccess() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: { id: true, email: true, fullName: true, role: true },
  });
  const counts = {};
  for (const user of users) {
    counts[user.role] = (counts[user.role] || 0) + 1;
  }
  const matrix = permissionMatrixView();
  return {
    users: users.map((user) => ({
      ...user,
      roleLabel: ROLE_LABELS[user.role],
    })),
    roleCards: Object.keys(ROLE_LABELS).map((role) => ({
      role: ROLE_LABELS[role],
      count: `${counts[role] || 0} login${(counts[role] || 0) === 1 ? "" : "s"}`,
      scope: ROLE_SCOPES[role],
    })),
    permRoles: matrix.permRoles,
    permRows: matrix.permRows.map((row) => ({
      module: row.module,
      cells: row.marks.map((mark) => ({
        mark,
        fg: mark === "●" ? "#1e6b52" : mark === "◐" ? "#8a6414" : "#c4c0b4",
      })),
    })),
  };
}

export function filterDashboard(dashboard, permissions) {
  const next = { society: dashboard.society };
  if (permissions.property || permissions.reports) next.occupancy = dashboard.occupancy;
  if (permissions.helpdesk || permissions.reports) next.openTickets = dashboard.openTickets;
  if (permissions.billing || permissions.reports) next.overdueBills = dashboard.overdueBills;
  if (permissions.staff || permissions.reports) next.staffOnPayroll = dashboard.staffOnPayroll;
  if (permissions.vendors || permissions.reports) next.vendors = dashboard.vendors;
  return next;
}
