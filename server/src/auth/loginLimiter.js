import { AppError } from "../http.js";

// Slows down password guessing. Counts failed sign-ins per IP + email and per IP, in memory
// (one Render instance; counts reset on restart, which is acceptable for this purpose).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 8;
const MAX_PER_IP = 40;

const failures = new Map();

function entry(key, now) {
  const found = failures.get(key);
  if (found && now - found.firstAt < WINDOW_MS) return found;
  return null;
}

function bump(key, now) {
  const found = entry(key, now);
  if (found) found.count += 1;
  else failures.set(key, { count: 1, firstAt: now });
}

function keysFor(ip, email) {
  return { account: `acct:${ip}:${String(email || "").trim().toLowerCase()}`, ip: `ip:${ip}` };
}

export function assertLoginAllowed(ip, email, now = Date.now()) {
  const keys = keysFor(ip, email);
  const blocked = [[keys.account, MAX_PER_ACCOUNT], [keys.ip, MAX_PER_IP]]
    .map(([key, max]) => ({ found: entry(key, now), max }))
    .find(({ found, max }) => found && found.count >= max);
  if (blocked) {
    const minutes = Math.max(1, Math.ceil((blocked.found.firstAt + WINDOW_MS - now) / 60000));
    throw new AppError(429, `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }
}

export function recordLoginFailure(ip, email, now = Date.now()) {
  const keys = keysFor(ip, email);
  bump(keys.account, now);
  bump(keys.ip, now);
}

export function recordLoginSuccess(ip, email) {
  failures.delete(keysFor(ip, email).account);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of failures) if (now - value.firstAt >= WINDOW_MS) failures.delete(key);
}, WINDOW_MS).unref();
