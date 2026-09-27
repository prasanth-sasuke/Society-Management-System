import { AppError } from "../http.js";

// Matches no row, so an unlinked resident or vendor login sees nothing rather than everything.
const NO_MATCH = "00000000-0000-0000-0000-000000000000";

export function flatScope(user) {
  if (user?.role !== "RESIDENT") return null;
  return user.flatId || NO_MATCH;
}

export function vendorScope(user) {
  if (user?.role !== "VENDOR") return null;
  return { id: user.vendorId || NO_MATCH, name: user.vendorName || null };
}

export function requireOwnFlat(user) {
  const flatId = flatScope(user);
  if (flatId === NO_MATCH) {
    throw new AppError(403, "Your login isn't linked to a flat yet. Ask the society office to link it.");
  }
  return flatId ? user.flatCode : null;
}

export function assertFlatAccess(user, flatId, label) {
  const own = flatScope(user);
  if (own && own !== flatId) throw new AppError(404, `${label} not found.`);
}

export function sessionScope(user) {
  if (user.role === "RESIDENT") return { flat: user.flatCode || null };
  if (user.role === "VENDOR") return { vendor: user.vendorName || null };
  return null;
}
