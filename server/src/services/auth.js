import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import { signSession } from "../auth/jwt.js";
import { ROLE_LABELS, ROLE_SCOPES, CREATABLE_ROLES, permissionsFor, permissionMatrixView } from "../auth/permissions.js";
import { sessionScope } from "../auth/scope.js";
import { findFlatByCode } from "./society.js";

const LINKS = { flat: { select: { code: true } }, vendor: { select: { name: true } } };

function withLinks(user) {
  return { ...user, flatCode: user.flat?.code || null, vendorName: user.vendor?.name || null };
}

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
  const linked = withLinks(user);
  return {
    token: signSession(user),
    user: publicUser(user),
    permissions: permissionsFor(user.role),
    scope: sessionScope(linked),
  };
}

// Compared against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
    include: LINKS,
  });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH) && Boolean(user);
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
    scope: sessionScope(reqUser),
  };
}

function roleFrom(requested) {
  const text = String(requested || "").trim();
  const role = CREATABLE_ROLES.find((item) => (
    item === text.toUpperCase() || ROLE_LABELS[item].toLowerCase() === text.toLowerCase()
  ));
  if (!role) throw new AppError(400, "Choose a valid role. Superadmin cannot be created from the app.");
  return role;
}

async function linksFor(role, body) {
  if (role === "RESIDENT") {
    const code = String(body.flat || "").trim();
    if (!code) throw new AppError(400, "Enter the resident's flat, e.g. A-1A.");
    const flat = await findFlatByCode(code);
    return { flatId: flat.id, vendorId: null };
  }
  if (role === "VENDOR") {
    const vendorId = String(body.vendor || "").trim();
    if (!vendorId) throw new AppError(400, "Pick the vendor this login belongs to.");
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new AppError(400, "That vendor no longer exists.");
    return { flatId: null, vendorId: vendor.id };
  }
  return { flatId: null, vendorId: null };
}

export async function createUser(body) {
  const society = await prisma.society.findFirst({ orderBy: { createdAt: "asc" } });
  if (!society) throw new AppError(404, "No society found.");
  const role = roleFrom(body.role);
  const links = await linksFor(role, body);
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
        ...links,
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

export async function updateUser(id, body) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "Login not found.");
  const name = String(body.name || "").trim();
  const data = user.role === "SUPERADMIN"
    ? { fullName: name }
    : { fullName: name, role: roleFrom(body.role), ...(await linksFor(roleFrom(body.role), body)) };
  const updated = await prisma.user.update({ where: { id }, data });
  return publicUser(updated);
}

export async function removeUser(id, actorId) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "Login not found.");
  if (user.id === actorId) throw new AppError(409, "You can't remove your own login.");
  if (user.role === "SUPERADMIN") throw new AppError(409, "The superadmin login can't be removed.");
  await prisma.user.delete({ where: { id } });
  return { email: user.email };
}

export async function listAccess() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: { id: true, email: true, fullName: true, role: true, vendorId: true, ...LINKS },
  });
  const counts = {};
  for (const user of users) {
    counts[user.role] = (counts[user.role] || 0) + 1;
  }
  const matrix = permissionMatrixView();
  return {
    users: users.map(({ flat, vendor, ...user }) => ({
      ...user,
      roleLabel: ROLE_LABELS[user.role],
      flat: flat?.code || "",
      vendorId: user.vendorId || "",
      linkedTo: flat ? `Flat ${flat.code}` : vendor ? vendor.name : "",
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
  if (permissions.billing || permissions.finance || permissions.reports) {
    next.money = dashboard.money;
    next.trend = dashboard.trend;
    next.ageing = dashboard.ageing;
    next.expenseSplit = dashboard.expenseSplit;
    next.blockMoney = dashboard.blockMoney;
  }
  return next;
}
