import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import {
  GUARD_STATUS,
  INCIDENT_STATUS,
  dayLabel,
  fromLabel,
  fromSocietyLocal,
  societyNow,
  toSocietyLocal,
} from "../labels.js";
import { getSociety } from "./society.js";

const PATROL_STATES = ["Pending", "Checked", "Issue found"];

function toMinutes(hhmm) {
  const m = String(hhmm || "").match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function splitHours(hours) {
  const m = String(hours || "").match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);
  return m ? { start: m[1], end: m[2] } : { start: "", end: "" };
}

function isActive(start, end, now) {
  if (start == null || end == null || start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

function shiftStates(shifts, now) {
  const parsed = shifts.map((s) => {
    const { start, end } = splitHours(s.hours);
    return { row: s, start, end, startMin: toMinutes(start), endMin: toMinutes(end) };
  });
  const activeIds = new Set(parsed.filter((p) => isActive(p.startMin, p.endMin, now)).map((p) => p.row.id));
  const upcoming = parsed
    .filter((p) => !activeIds.has(p.row.id) && p.startMin != null)
    .sort((a, b) => ((a.startMin - now + 1440) % 1440) - ((b.startMin - now + 1440) % 1440))[0];
  return parsed.map((p) => ({
    id: p.row.id,
    name: p.row.name,
    hours: p.row.hours,
    start: p.start,
    end: p.end,
    staff: p.row.staffNote || "—",
    state: activeIds.has(p.row.id) ? "On duty" : upcoming?.row.id === p.row.id ? "Next" : "Off",
  }));
}

function splitTimes(times) {
  const [timeIn = "", timeOut = ""] = String(times || "").split("/").map((t) => t.trim());
  return { timeIn: timeIn === "—" ? "" : timeIn, timeOut: timeOut === "—" ? "" : timeOut };
}

function patrolState(mark) {
  if (/^checked/i.test(mark)) return { state: "Checked", note: "" };
  if (/^not ok/i.test(mark)) return { state: "Issue found", note: mark.replace(/^not ok\s*—?\s*/i, "") };
  return { state: "Pending", note: "" };
}

export async function listSecurity() {
  const society = await getSociety();
  const now = societyNow();
  const [shifts, guards, handover, patrol, incidents] = await Promise.all([
    prisma.securityShift.findMany({ where: { societyId: society.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.guardAttendance.findMany({ where: { societyId: society.id, attendedOn: now.date }, orderBy: { createdAt: "asc" } }),
    prisma.handoverNote.findMany({ where: { societyId: society.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.patrolCheck.findMany({ where: { societyId: society.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.incident.findMany({ where: { societyId: society.id }, orderBy: { happenedAt: "desc" } }),
  ]);
  return {
    today: dayLabel(now.date),
    shifts: shiftStates(shifts, now.minutes),
    guards: guards.map((g) => ({
      id: g.id,
      name: g.name,
      post: g.post,
      shift: g.shift,
      times: g.times,
      ...splitTimes(g.times),
      status: GUARD_STATUS[g.status],
    })),
    handover: handover.map((h) => ({ id: h.id, when: h.whenLabel, note: h.note })),
    patrol: patrol.map((p) => ({ id: p.id, point: p.point, mark: p.mark, ...patrolState(p.mark) })),
    incidents: incidents.map((i) => ({
      id: i.id,
      what: i.description,
      when: i.happenedAt.toISOString(),
      whenLocal: toSocietyLocal(i.happenedAt),
      status: INCIDENT_STATUS[i.status],
    })),
  };
}

async function mustFind(model, id, label) {
  const row = await prisma[model].findUnique({ where: { id } });
  if (!row) throw new AppError(404, `${label} not found.`);
  return row;
}

function shiftData(body) {
  return {
    name: body.name,
    hours: `${body.start}–${body.end}`,
    staffNote: body.staff,
    sortOrder: toMinutes(body.start),
  };
}

export async function createShift(body) {
  const society = await getSociety();
  const created = await prisma.securityShift.create({ data: { societyId: society.id, state: "NEXT", ...shiftData(body) } });
  return { name: created.name, hours: created.hours };
}

export async function updateShift(id, body) {
  await mustFind("securityShift", id, "Shift");
  const updated = await prisma.securityShift.update({ where: { id }, data: shiftData(body) });
  return { name: updated.name, hours: updated.hours };
}

export async function deleteShift(id) {
  const row = await mustFind("securityShift", id, "Shift");
  await prisma.securityShift.delete({ where: { id } });
  return { name: row.name };
}

function guardData(body) {
  return {
    name: body.name,
    post: body.post,
    shift: body.shift,
    times: `${body.timeIn || "—"} / ${body.timeOut || "—"}`,
    status: fromLabel(GUARD_STATUS, body.status, "status"),
    statusNote: null,
  };
}

export async function createGuardEntry(body) {
  const society = await getSociety();
  const created = await prisma.guardAttendance.create({
    data: { societyId: society.id, attendedOn: societyNow().date, ...guardData(body) },
  });
  return { name: created.name, status: GUARD_STATUS[created.status] };
}

export async function updateGuardEntry(id, body) {
  await mustFind("guardAttendance", id, "Attendance entry");
  const updated = await prisma.guardAttendance.update({ where: { id }, data: guardData(body) });
  return { name: updated.name, status: GUARD_STATUS[updated.status] };
}

export async function deleteGuardEntry(id) {
  const row = await mustFind("guardAttendance", id, "Attendance entry");
  await prisma.guardAttendance.delete({ where: { id } });
  return { name: row.name };
}

export async function createHandover(body) {
  const society = await getSociety();
  const now = societyNow();
  const created = await prisma.handoverNote.create({
    data: {
      societyId: society.id,
      whenLabel: `${dayLabel(now.date)}, ${now.time}${body.handover ? ` · ${body.handover}` : ""}`,
      note: body.note,
    },
  });
  return { when: created.whenLabel };
}

export async function deleteHandover(id) {
  await mustFind("handoverNote", id, "Handover note");
  await prisma.handoverNote.delete({ where: { id } });
  return { ok: true };
}

function patrolMark(state, note) {
  if (state === "Checked") return `Checked ${societyNow().time}`;
  if (state === "Issue found") return `Not OK — ${note || "issue reported"}`;
  return "Pending";
}

export async function createPatrolPoint(body) {
  const society = await getSociety();
  const last = await prisma.patrolCheck.findFirst({ where: { societyId: society.id }, orderBy: { sortOrder: "desc" } });
  const created = await prisma.patrolCheck.create({
    data: { societyId: society.id, point: body.point, mark: "Pending", sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  return { point: created.point };
}

export async function updatePatrolPoint(id, body) {
  const row = await mustFind("patrolCheck", id, "Patrol point");
  if (!PATROL_STATES.includes(body.state)) throw new AppError(400, `Invalid state: ${body.state}`);
  const current = patrolState(row.mark);
  const unchanged = current.state === body.state && (body.state !== "Issue found" || current.note === body.note);
  const updated = await prisma.patrolCheck.update({
    where: { id },
    data: { point: body.point, mark: unchanged ? row.mark : patrolMark(body.state, body.note) },
  });
  return { point: updated.point, mark: updated.mark };
}

export async function deletePatrolPoint(id) {
  const row = await mustFind("patrolCheck", id, "Patrol point");
  await prisma.patrolCheck.delete({ where: { id } });
  return { point: row.point };
}

export async function resetPatrol() {
  const society = await getSociety();
  const { count } = await prisma.patrolCheck.updateMany({ where: { societyId: society.id }, data: { mark: "Pending" } });
  return { count };
}

function incidentData(body) {
  const happenedAt = fromSocietyLocal(body.when);
  if (!happenedAt) throw new AppError(400, "Pick the date and time of the incident.");
  return {
    description: body.what,
    happenedAt,
    status: fromLabel(INCIDENT_STATUS, body.status, "status"),
  };
}

export async function createIncident(body) {
  const society = await getSociety();
  const created = await prisma.incident.create({ data: { societyId: society.id, ...incidentData(body) } });
  return { status: INCIDENT_STATUS[created.status] };
}

export async function updateIncident(id, body) {
  await mustFind("incident", id, "Incident");
  const updated = await prisma.incident.update({ where: { id }, data: incidentData(body) });
  return { status: INCIDENT_STATUS[updated.status] };
}

export async function deleteIncident(id) {
  await mustFind("incident", id, "Incident");
  await prisma.incident.delete({ where: { id } });
  return { ok: true };
}
