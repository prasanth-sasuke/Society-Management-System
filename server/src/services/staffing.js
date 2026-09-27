import { prisma } from "../prisma.js";
import { AppError } from "../http.js";
import {
  FOLLOW_UP_STATUS,
  PAYOUT_STATUS,
  STAFF_DAY,
  dayLabel,
  fromLabel,
  inr,
  money,
  societyNow,
} from "../labels.js";
import { getSociety } from "./society.js";

export const ROSTER_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function payoutLabel(status, note) {
  if (status === "HOLD" && note) return `Hold — ${note}`;
  return PAYOUT_STATUS[status];
}

function presentCount(rows) {
  return rows.reduce((sum, a) => sum + (a.status === "PRESENT" ? 1 : a.status === "HALF_DAY" ? 0.5 : 0), 0);
}

export async function listStaff() {
  const society = await getSociety();
  const now = societyNow();
  const monthStart = new Date(`${now.iso.slice(0, 7)}-01T00:00:00.000Z`);
  const rows = await prisma.staffMember.findMany({
    where: { societyId: society.id },
    include: { attendance: { where: { date: { gte: monthStart, lte: now.date } } } },
    orderBy: { name: "asc" },
  });
  return rows.map((s) => {
    const present = presentCount(s.attendance);
    const today = s.attendance.find((a) => isoDay(a.date) === now.iso);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      area: s.area || "—",
      present: `${present} / ${s.workingDays}`,
      presentDays: present,
      workingDays: s.workingDays,
      salary: inr(s.salary),
      salaryAmount: money(s.salary),
      payout: payoutLabel(s.payoutStatus, s.payoutNote),
      payoutStatus: PAYOUT_STATUS[s.payoutStatus],
      payoutNote: s.payoutNote || "",
      today: today ? STAFF_DAY[today.status] : null,
    };
  });
}

function staffData(body) {
  const payoutStatus = fromLabel(PAYOUT_STATUS, body.payout, "payout");
  return {
    name: body.name,
    role: body.role,
    area: body.area,
    salary: body.salary,
    workingDays: body.workingDays,
    payoutStatus,
    payoutNote: payoutStatus === "HOLD" && body.payoutNote ? body.payoutNote : null,
  };
}

export async function createStaff(body) {
  const society = await getSociety();
  const created = await prisma.staffMember.create({
    data: { societyId: society.id, presentDays: 0, ...staffData(body) },
  });
  return { id: created.id, name: created.name };
}

export async function updateStaff(id, body) {
  const staff = await prisma.staffMember.findUnique({ where: { id } });
  if (!staff) throw new AppError(404, "Staff member not found.");
  const updated = await prisma.staffMember.update({ where: { id }, data: staffData(body) });
  return { id: updated.id, name: updated.name };
}

export async function deleteStaff(id) {
  const staff = await prisma.staffMember.findUnique({ where: { id } });
  if (!staff) throw new AppError(404, "Staff member not found.");
  await prisma.staffMember.delete({ where: { id } });
  return { name: staff.name };
}

function attendanceDate(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(date.getTime()) || isoDay(date) !== iso) {
    throw new AppError(400, "Pick a valid date.");
  }
  if (iso > societyNow().iso) throw new AppError(400, "You can't mark attendance for a future date.");
  return date;
}

export async function getAttendance(iso) {
  const society = await getSociety();
  const date = attendanceDate(iso);
  const staff = await prisma.staffMember.findMany({
    where: { societyId: society.id },
    include: { attendance: { where: { date } } },
    orderBy: { name: "asc" },
  });
  return {
    date: iso,
    label: dayLabel(date),
    rows: staff.map((s) => ({
      staffId: s.id,
      name: s.name,
      role: s.role,
      status: s.attendance[0] ? STAFF_DAY[s.attendance[0].status] : "",
    })),
  };
}

export async function saveAttendance({ date: iso, entries }) {
  const society = await getSociety();
  const date = attendanceDate(iso);
  const ids = [...new Set(entries.map((e) => e.staffId))];
  const known = await prisma.staffMember.findMany({
    where: { societyId: society.id, id: { in: ids } },
    select: { id: true },
  });
  if (known.length !== ids.length) throw new AppError(400, "Some staff in this sheet no longer exist. Reload and try again.");

  const marks = entries.map((e) => ({ staffId: e.staffId, status: e.status ? fromLabel(STAFF_DAY, e.status, "status") : null }));
  await prisma.$transaction(
    marks.map((m) => (m.status
      ? prisma.staffAttendance.upsert({
        where: { staffId_date: { staffId: m.staffId, date } },
        create: { staffId: m.staffId, date, status: m.status },
        update: { status: m.status },
      })
      : prisma.staffAttendance.deleteMany({ where: { staffId: m.staffId, date } }))),
  );
  const counts = { present: 0, halfDay: 0, leave: 0, absent: 0 };
  marks.forEach((m) => {
    if (m.status === "PRESENT") counts.present += 1;
    if (m.status === "HALF_DAY") counts.halfDay += 1;
    if (m.status === "LEAVE") counts.leave += 1;
    if (m.status === "ABSENT") counts.absent += 1;
  });
  return { date: iso, label: dayLabel(date), ...counts };
}

export async function listRoster() {
  const society = await getSociety();
  const duties = await prisma.rosterDuty.findMany({
    where: { societyId: society.id },
    include: { assignments: { orderBy: { dayIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return {
    days: ROSTER_DAYS,
    rows: duties.map((d) => {
      const byDay = ROSTER_DAYS.map((_, i) => d.assignments.find((a) => a.dayIndex === i));
      return {
        id: d.id,
        duty: d.name,
        cells: byDay.map((a) => ({ who: a && !a.isOff ? a.personName : "Off", isOff: !a || a.isOff })),
      };
    }),
  };
}

function assignmentRows(body) {
  return DAY_KEYS.map((key, i) => {
    const who = String(body[key] || "").trim();
    const isOff = !who || /^off$/i.test(who);
    return { dayIndex: i, dayLabel: ROSTER_DAYS[i], personName: isOff ? "Off" : who, isOff };
  });
}

function currentWeekStart() {
  const today = societyNow().date;
  const offset = (today.getUTCDay() + 6) % 7;
  return new Date(today.getTime() - offset * 86400000);
}

export async function createDuty(body) {
  const society = await getSociety();
  const created = await prisma.rosterDuty.create({
    data: {
      societyId: society.id,
      name: body.duty,
      weekStart: currentWeekStart(),
      assignments: { create: assignmentRows(body) },
    },
  });
  return { duty: created.name };
}

export async function updateDuty(id, body) {
  const duty = await prisma.rosterDuty.findUnique({ where: { id } });
  if (!duty) throw new AppError(404, "Duty not found.");
  await prisma.$transaction([
    prisma.rosterAssignment.deleteMany({ where: { dutyId: id } }),
    prisma.rosterDuty.update({
      where: { id },
      data: { name: body.duty, assignments: { create: assignmentRows(body) } },
    }),
  ]);
  return { duty: body.duty };
}

export async function deleteDuty(id) {
  const duty = await prisma.rosterDuty.findUnique({ where: { id } });
  if (!duty) throw new AppError(404, "Duty not found.");
  await prisma.rosterDuty.delete({ where: { id } });
  return { duty: duty.name };
}

export async function listFollowUps() {
  const society = await getSociety();
  const today = societyNow().date;
  const rows = await prisma.followUp.findMany({
    where: { societyId: society.id },
    orderBy: { dueOn: "asc" },
  });
  return rows.map((f) => ({
    id: f.id,
    task: f.task,
    owner: f.ownerName,
    due: dayLabel(f.dueOn),
    dueIso: isoDay(f.dueOn),
    verifier: f.verifier || "—",
    status: FOLLOW_UP_STATUS[f.status],
    overdue: f.status !== "VERIFIED" && f.dueOn < today,
  }));
}

function followUpData(body) {
  return {
    task: body.task,
    ownerName: body.owner,
    dueOn: new Date(`${body.due}T00:00:00.000Z`),
    verifier: body.verifier,
    status: fromLabel(FOLLOW_UP_STATUS, body.status, "status"),
  };
}

export async function createFollowUp(body) {
  const society = await getSociety();
  const created = await prisma.followUp.create({ data: { societyId: society.id, ...followUpData(body) } });
  return { task: created.task };
}

export async function updateFollowUp(id, body) {
  const row = await prisma.followUp.findUnique({ where: { id } });
  if (!row) throw new AppError(404, "Follow-up not found.");
  const updated = await prisma.followUp.update({ where: { id }, data: followUpData(body) });
  return { task: updated.task, status: FOLLOW_UP_STATUS[updated.status] };
}

export async function deleteFollowUp(id) {
  const row = await prisma.followUp.findUnique({ where: { id } });
  if (!row) throw new AppError(404, "Follow-up not found.");
  await prisma.followUp.delete({ where: { id } });
  return { task: row.task };
}
