import { canRead } from "./auth.js";
import { DEFAULT_SETTINGS, T, buildView } from "./data.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function tone(name) {
  return { bg: T[name][0], fg: T[name][1] };
}

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDay(value) {
  if (!value) return "—";
  const text = String(value);
  if (/^\d{4}-\d{2}$/.test(text)) {
    const date = new Date(`${text}-01T00:00:00Z`);
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  if (/^\d{2}-\d{2}$/.test(text)) {
    const [, month, day] = text.match(/^(\d{2})-(\d{2})$/);
    return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  return text;
}

function formatStamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${hh}:${mm}`;
}

function occupancyTone(status) {
  if (status === "Vacant") return "grey";
  if (status === "Tenant") return "purple";
  return "green";
}

function billTone(status) {
  const label = String(status);
  if (label.startsWith("Overdue")) return "rust";
  if (label === "Paid") return "green";
  return "amber";
}

function voucherTone(state) {
  if (state === "Approved") return "green";
  if (state === "Draft") return "grey";
  return "amber";
}

function priorityTone(priority) {
  if (priority === "High") return "rust";
  if (priority === "Medium") return "amber";
  return "grey";
}

function ticketStatusTone(status) {
  if (status === "Resolved") return "green";
  if (status === "Assigned") return "purple";
  return "amber";
}

function payoutTone(payout) {
  return String(payout).startsWith("Processed") ? "green" : "amber";
}

function payTone(pay) {
  const label = String(pay).toLowerCase();
  if (label.includes("clear") || label === "paid") return "green";
  if (label.includes("awaiting")) return "purple";
  if (label === "n/a") return "grey";
  return "amber";
}

function assetTone(condition) {
  if (condition === "Good") return "green";
  if (condition === "Monitor" || condition === "Refill due") return "amber";
  return "rust";
}

function facilityTone(state) {
  if (state === "Available") return "green";
  if (state === "Maintenance") return "rust";
  return "amber";
}

function followTone(status) {
  const label = String(status).toLowerCase();
  if (label.includes("verif") || label === "done") return "green";
  if (label.includes("escal")) return "rust";
  if (label.includes("progress")) return "amber";
  return "purple";
}

function amcTone(status) {
  const label = String(status).toLowerCase();
  if (label.includes("renewal") || label.includes("due this")) return "rust";
  if (label.includes("active")) return "green";
  if (label.includes("schedul")) return "purple";
  return "amber";
}

function guardTone(status) {
  const label = String(status).toLowerCase();
  if (label.includes("absent")) return "rust";
  if (label.includes("late")) return "amber";
  if (label.includes("roster")) return "purple";
  return "green";
}

function shiftTone(state) {
  const label = String(state).toLowerCase();
  if (label.includes("duty")) return "green";
  if (label.includes("next")) return "purple";
  return "grey";
}

function incidentTone(status) {
  return String(status).toLowerCase().includes("review") ? "amber" : "green";
}

function dueTone(due) {
  const label = String(due).toLowerCase();
  if (label.includes("overdue")) return "#b0491a";
  if (label.includes("approval") || label.includes("due")) return "#8a6414";
  return "#5f5f57";
}

function reminderTone(when) {
  const label = String(when).toLowerCase();
  if (label.includes("today")) return "#b0491a";
  if (label.includes("due") || /\d/.test(label)) return "#8a6414";
  return "#5f5f57";
}

function patrolTone(mark) {
  const label = String(mark).toLowerCase();
  if (label.includes("not")) return "#b0491a";
  if (label.includes("open") || label.includes("fixed")) return "#8a6414";
  return "#1e6b52";
}

function priorityColor(priority) {
  if (priority === "High") return "#b0491a";
  if (priority === "Medium") return "#8a6414";
  return "#8a8a80";
}

export function buildViewFromApi(catalog, permissions = {}) {
  const society = catalog.society || {};
  const dashboard = catalog.dashboard || {};
  const occupancy = dashboard.occupancy || { occupied: 0, vacant: 0, total: 0 };
  const settings = {
    societyName: society.name || DEFAULT_SETTINGS.societyName,
    penaltyPerDay: society.penaltyPerDay ?? DEFAULT_SETTINGS.penaltyPerDay,
    billingFrequency: society.billingFrequency || DEFAULT_SETTINGS.billingFrequency,
  };
  const base = buildView(settings);
  const showMoney = canRead(permissions, "billing") || canRead(permissions, "finance") || canRead(permissions, "reports");
  const showChart = canRead(permissions, "finance") || canRead(permissions, "reports");
  const showAttention = canRead(permissions, "billing") || canRead(permissions, "vendors") || canRead(permissions, "reports");
  const showComplaints = canRead(permissions, "helpdesk");
  const showStaff = canRead(permissions, "staff");
  const showEvents = canRead(permissions, "facility");
  const showOccupancy = canRead(permissions, "property") || canRead(permissions, "reports");

  const flats = (catalog.flats || []).map((row) => ({ ...row, ...tone(occupancyTone(row.status)) }));
  const residents = (catalog.residents || []).map((row) => ({ ...row, since: formatDay(row.since), ...tone(row.type === "Tenant" ? "purple" : "green") }));
  const bills = (catalog.bills || []).map((row) => ({ ...row, ...tone(billTone(row.status)) }));
  const tickets = (catalog.tickets || []).map((row) => ({
    ...row,
    pbg: T[priorityTone(row.priority)][0],
    pfg: T[priorityTone(row.priority)][1],
    sbg: T[ticketStatusTone(row.status)][0],
    sfg: T[ticketStatusTone(row.status)][1],
  }));
  const staffRows = (catalog.staff || []).map((row) => ({ ...row, ...tone(payoutTone(row.payout)) }));
  const vendors = (catalog.vendors || []).map((row) => ({
    ...row,
    rtone: String(row.pay).toLowerCase().includes("due") ? "#b0491a" : "#5f5f57",
    ...tone(payTone(row.pay)),
  }));
  const assets = (catalog.assets || []).map((row) => ({ ...row, ...tone(assetTone(row.condition)) }));
  const bookings = (catalog.bookings || []).map((row) => ({ ...row, ...tone(payTone(row.pay)) }));
  const finance = catalog.finance || {};
  const security = catalog.security || {};
  const roster = catalog.roster || {};
  const openTickets = tickets.filter((row) => row.status !== "Resolved");
  const highOpen = openTickets.filter((row) => row.priority === "High");
  const trailSource = tickets.find((row) => (row.events || []).length) || tickets[0];
  const occupiedNote = `${occupancy.occupied} / ${occupancy.total}`;
  const occupancyPct = occupancy.total ? ((occupancy.occupied / occupancy.total) * 100).toFixed(1) : "0.0";

  const attention = [
    ...bills
      .filter((row) => String(row.status).startsWith("Overdue"))
      .slice(0, 3)
      .map((row) => ({ text: `${row.flat} — ${row.status}`, amount: row.total, tone: "#b0491a" })),
    ...(catalog.reminders || []).slice(0, 2).map((row) => ({ text: row.what, amount: row.when, tone: reminderTone(row.when) })),
  ].slice(0, 5);

  const roleCounts = {};
  staffRows.forEach((row) => {
    roleCounts[row.role] = (roleCounts[row.role] || 0) + 1;
  });

  const access = catalog.access || {};
  const homeKpis = [];
  if (showMoney) {
    homeKpis.push(...base.homeKpis.filter((kpi) => kpi.label !== "Flats occupied"));
  }
  if (showOccupancy) {
    homeKpis.push({
      label: "Flats occupied",
      value: occupiedNote,
      note: `${occupancy.vacant} flats are empty`,
      tone: "#8a8a80",
    });
  }

  return {
    ...base,
    societyName: settings.societyName,
    syncOk: true,
    occupancy,
    showChart,
    showAttention,
    showComplaints,
    showStaff,
    showEvents,
    homeLead: showOccupancy && occupancy.total
      ? `${(catalog.blocks || []).length || 5} blocks (A, B, C, D, E), ${occupancy.total} flats in total`
      : "signed in with your assigned modules",
    homeKpis,
    attention,
    homeComplaints: openTickets.slice(0, 4).map((row) => ({
      text: `${row.id} — ${row.text}`,
      tag: row.priority,
      tone: priorityColor(row.priority),
    })),
    homeStaff: Object.entries(roleCounts).slice(0, 4).map(([role, count]) => ({
      text: role,
      meta: `${count} on payroll`,
    })),
    homeEvents: bookings.slice(0, 4).map((row) => ({
      text: `${row.facility} — ${row.flat}`,
      meta: row.slot,
    })),
    blocks: catalog.blocks || [],
    flatRegister: flats,
    residents,
    moveLog: (catalog.moveEvents || []).map((row) => ({ text: row.text, date: formatDay(row.date) })),
    bills,
    vouchers: (finance.vouchers || []).map((row) => ({ ...row, ...tone(voucherTone(row.state)) })),
    banks: finance.banks || [],
    budget: (finance.budget || []).map((row) => ({
      ...row,
      tone: parseInt(row.pct, 10) >= 90 ? "#c2571f" : "#1e6b52",
    })),
    helpKpis: [
      { label: "Open tickets", value: String(openTickets.length), note: `${highOpen.length} high priority`, tone: "#b0491a" },
      { label: "Closed tickets", value: String(tickets.filter((row) => row.status === "Resolved").length), note: "Resolved in register", tone: "#1e6b52" },
      base.helpKpis[2],
      base.helpKpis[3],
    ],
    tickets,
    trailTicket: trailSource?.id || "—",
    trail: (trailSource?.events || []).map((row) => ({ when: formatStamp(row.when), what: row.what })),
    shifts: (security.shifts || []).map((row) => {
      const state = titleCase(row.state);
      return { ...row, state, ...tone(shiftTone(state)) };
    }),
    guards: (security.guards || []).map((row) => ({ ...row, ...tone(guardTone(row.status)) })),
    handover: security.handover || [],
    patrol: (security.patrol || []).map((row) => ({ ...row, tone: patrolTone(row.mark) })),
    incidents: (security.incidents || []).map((row) => {
      const status = titleCase(row.status);
      return { ...row, when: formatStamp(row.when), status, ...tone(incidentTone(status)) };
    }),
    staffKpis: base.staffKpis.map((kpi) => (
      kpi.label === "On payroll"
        ? { ...kpi, value: String(staffRows.length), note: `${Object.keys(roleCounts).length} categories` }
        : kpi
    )),
    staffRows,
    days: roster.days?.length ? roster.days : [],
    rosterRows: (roster.rows || []).map((row) => ({
      duty: row.duty,
      cells: (row.cells || []).map((cell) => (
        cell.isOff || cell.who === "Off"
          ? { who: cell.who || "Off", bg: "#f3f1ea", fg: "#a8a49a" }
          : { who: cell.who, bg: T.green[0], fg: T.green[1] }
      )),
    })),
    followUps: (catalog.followUps || []).map((row) => ({ ...row, due: formatDay(row.due), ...tone(followTone(row.status)) })),
    vendors,
    quotes: catalog.quotations || [],
    invoices: (catalog.invoices || []).map((row) => ({ ...row, tone: dueTone(row.due) })),
    assetKpis: [
      { label: "Tagged assets", value: String(assets.length), note: "From asset register", tone: "#8a8a80" },
      base.assetKpis[1],
      { label: "Under AMC", value: String(assets.filter((row) => /amc/i.test(row.amc || "")).length), note: "Warranty / AMC notes", tone: "#1e6b52" },
      { label: "Needs attention", value: String(assets.filter((row) => row.condition !== "Good").length), note: "Not in good condition", tone: "#b0491a" },
    ],
    assets,
    amc: (catalog.amc || []).map((row) => ({ ...row, next: formatDay(row.next), ...tone(amcTone(row.status)) })),
    reminders: (catalog.reminders || []).map((row) => ({ ...row, tone: reminderTone(row.when) })),
    breakdowns: (catalog.breakdowns || []).map((row) => ({ ...row, when: formatDay(row.when) })),
    facilities: (catalog.facilities || []).map((row) => ({ ...row, ...tone(facilityTone(row.state)) })),
    bookings,
    reportKpis: base.reportKpis.map((kpi) => (
      kpi.label === "Occupancy"
        ? { ...kpi, value: `${occupancyPct}%`, note: `${occupancy.occupied} of ${occupancy.total} flats` }
        : kpi
    )),
    blockSummary: (catalog.blocks || []).map((block) => {
      const units = (block.floors || []).flatMap((floor) => floor.flats || []);
      const occupied = units.filter((unit) => unit.status && unit.status !== "Vacant").length;
      const complaints = openTickets.filter((row) => String(row.flat).startsWith(`${block.code}-`) || String(row.flat).startsWith(block.code)).length;
      const previous = base.blockSummary.find((row) => row.block === block.name) || {};
      const pct = block.count ? ((occupied / block.count) * 100).toFixed(1) : previous.pct;
      return {
        ...previous,
        block: block.name,
        flats: block.count,
        occupied,
        complaints,
        pct: `${pct}%`,
        tone: Number(pct) >= 90 ? "#1e6b52" : Number(pct) >= 85 ? "#8a6414" : "#b0491a",
      };
    }),
    roleCards: access.roleCards || base.roleCards,
    permRoles: access.permRoles || base.permRoles,
    permRows: access.permRows || base.permRows,
    users: access.users || [],
  };
}
