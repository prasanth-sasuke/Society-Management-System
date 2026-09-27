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
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hh}:${mm}`;
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
  if (label.includes("overdue") || label.includes("renewal") || label.includes("due this")) return "rust";
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
  if (label.includes("today") || label.includes("overdue")) return "#b0491a";
  if (label.includes("due") || /\d/.test(label)) return "#8a6414";
  return "#5f5f57";
}

function patrolTone(mark) {
  const label = String(mark).toLowerCase();
  if (label === "pending") return "#8a8a80";
  if (label.includes("not")) return "#b0491a";
  if (label.includes("open") || label.includes("fixed")) return "#8a6414";
  return "#1e6b52";
}

function priorityColor(priority) {
  if (priority === "High") return "#b0491a";
  if (priority === "Medium") return "#8a6414";
  return "#8a8a80";
}

function plural(count, word, many = `${word}s`) {
  return `${count} ${count === 1 ? word : many}`;
}

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function chartBars(trend) {
  const rows = Array.isArray(trend) && trend.length
    ? trend
    : MONTHS.slice(-6).map((month) => ({ month, income: 0, expense: 0 }));
  const max = Math.max(0, ...rows.map((row) => Math.max(Number(row.income) || 0, Number(row.expense) || 0)));
  return rows.map((row) => ({
    month: row.month,
    income: max ? Math.max(Number(row.income) ? 8 : 4, Math.round((Number(row.income) / max) * 180)) : 4,
    expense: max ? Math.max(Number(row.expense) ? 8 : 4, Math.round((Number(row.expense) / max) * 180)) : 4,
  }));
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
  const lastEventAt = (row) => (row.events || []).reduce((latest, e) => (e.when > latest ? e.when : latest), "");
  const trailSource = tickets.reduce((best, row) => (!best || lastEventAt(row) > lastEventAt(best) ? row : best), null);
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
  const money = dashboard.money || {};
  const blocks = catalog.blocks || [];
  const blockNames = blocks.map((block) => block.code).filter(Boolean).join(", ");
  const presentDays = staffRows.reduce((sum, row) => sum + Number(row.presentDays || 0), 0);
  const workingDays = staffRows.reduce((sum, row) => sum + Number(row.workingDays || 0), 0);
  const salaryTotal = money.salary ?? staffRows.reduce((sum, row) => sum + Number(row.salaryAmount || 0), 0);
  const pendingPayouts = staffRows.filter((row) => !/^processed$/i.test(row.payout || "")).length;
  const homeKpis = [];
  if (showMoney) {
    homeKpis.push(
      {
        label: "Money collected",
        value: rupees(money.collected),
        note: money.paidBills ? `${plural(money.paidBills, "bill")} fully paid` : "No collections yet",
        tone: "#1e6b52",
      },
      {
        label: "Money still due",
        value: rupees(money.due),
        note: money.unpaidFlats ? `${plural(money.unpaidFlats, "flat")} yet to pay` : "No dues yet",
        tone: "#b0491a",
      },
      {
        label: "Money spent",
        value: rupees(money.spent),
        note: money.vouchers ? `${plural(money.vouchers, "approved voucher")}` : "No expenses yet",
        tone: "#8a8a80",
      },
    );
  }
  if (showOccupancy) {
    homeKpis.push({
      label: "Flats occupied",
      value: occupiedNote,
      note: occupancy.total ? `${plural(occupancy.vacant, "flat")} empty` : "No flats in the register yet",
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
      ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}${blockNames ? ` (${blockNames})` : ""}, ${occupancy.total} flats in total`
      : "signed in with your assigned modules",
    homeKpis,
    chart: chartBars(dashboard.trend),
    billKpis: [
      { label: "Total billed", value: rupees(money.billed), note: bills.length ? `${plural(bills.length, "bill")} in register` : "No bills generated yet" },
      { label: "Collected so far", value: rupees(money.collected), note: money.paidBills ? `${plural(money.paidBills, "bill")} fully paid` : "No collections yet" },
      { label: "Still pending", value: rupees(money.due), note: money.unpaidBills ? `${plural(money.unpaidBills, "bill")} unpaid` : "No dues yet" },
    ],
    finKpis: [
      { label: "Income YTD", value: rupees(money.collected), note: money.paidBills ? "From maintenance collections" : "No income recorded yet", tone: "#8a8a80" },
      { label: "Expenses YTD", value: rupees(money.spent), note: money.vouchers ? plural(money.vouchers, "approved voucher") : "No expenses recorded yet", tone: "#8a8a80" },
      { label: "Corpus fund", value: rupees(0), note: "Not set up yet", tone: "#8a8a80" },
      { label: "Cash + bank", value: rupees(money.cash), note: money.banks ? `Across ${money.banks} account${money.banks === 1 ? "" : "s"}` : "No bank accounts yet", tone: "#8a8a80" },
    ],
    ageing: (dashboard.ageing || []).map((row) => ({ ...row, amount: rupees(row.amount) })),
    expenseSplit: (dashboard.expenseSplit || []).map((row) => ({ ...row, amount: rupees(row.amount) })),
    statements: [],
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
    billCta: "Generate bills",
    billRegisterTitle: bills.length ? `Bill register — latest period: ${bills[0].period}` : "Bill register",
    receiptPreview: (() => {
      const paid = bills
        .filter((row) => row.lastPayment)
        .sort((a, b) => String(b.lastPayment.at).localeCompare(String(a.lastPayment.at)))[0];
      if (!paid) return null;
      const p = paid.lastPayment;
      return {
        title: `Latest receipt — ${paid.flat}`,
        receiptNo: p.receiptNo,
        paidOn: formatDay(p.paidOn),
        flat: paid.flat,
        resident: paid.resident,
        period: paid.period,
        mode: p.mode,
        amount: p.amount,
      };
    })(),
    vouchers: (finance.vouchers || []).map((row) => ({ ...row, ...tone(voucherTone(row.state)) })),
    banks: finance.banks || [],
    budget: (finance.budget || []).map((row) => ({
      ...row,
      tone: parseInt(row.pct, 10) >= 90 ? "#c2571f" : "#1e6b52",
    })),
    helpKpis: [
      { label: "Open tickets", value: String(openTickets.length), note: `${highOpen.length} high priority`, tone: "#b0491a" },
      { label: "Closed tickets", value: String(tickets.filter((row) => row.status === "Resolved").length), note: "Resolved in register", tone: "#1e6b52" },
      { label: "Avg resolution", value: "—", note: "Not tracked yet", tone: "#8a8a80" },
      { label: "Resident rating", value: "—", note: "No feedback yet", tone: "#8a8a80" },
    ],
    tickets,
    trailTicket: trailSource?.id || "—",
    trail: (trailSource?.events || []).map((row) => ({ when: formatStamp(row.when), what: row.what })),
    feedback: [],
    securityToday: security.today || "",
    shifts: (security.shifts || []).map((row) => ({ ...row, ...tone(shiftTone(row.state)) })),
    guards: (security.guards || []).map((row) => ({ ...row, ...tone(guardTone(row.status)) })),
    handover: security.handover || [],
    patrol: (security.patrol || []).map((row) => ({ ...row, tone: patrolTone(row.mark) })),
    incidents: (security.incidents || []).map((row) => ({ ...row, when: formatStamp(row.when), ...tone(incidentTone(row.status)) })),
    staffKpis: [
      { label: "On payroll", value: String(staffRows.length), note: `${Object.keys(roleCounts).length} categories`, tone: "#8a8a80" },
      { label: "Attendance on file", value: staffRows.length ? `${presentDays} / ${workingDays}` : "0 / 0", note: "Present vs working days", tone: "#8a8a80" },
      { label: "Monthly salary", value: rupees(salaryTotal), note: staffRows.length ? `${staffRows.length} staff` : "No staff yet", tone: "#8a8a80" },
      { label: "Pending payouts", value: String(pendingPayouts), note: "Hold or pending", tone: pendingPayouts ? "#8a6414" : "#8a8a80" },
    ],
    staffRows,
    staffMonth: `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()} · present days so far this month`,
    days: roster.days?.length ? roster.days : [],
    rosterRows: (roster.rows || []).map((row) => ({
      duty: row.duty,
      cells: (row.cells || []).map((cell) => (
        cell.isOff || cell.who === "Off"
          ? { who: cell.who || "Off", bg: "#f3f1ea", fg: "#a8a49a" }
          : { who: cell.who, bg: T.green[0], fg: T.green[1] }
      )),
    })),
    followUps: (catalog.followUps || []).map((row) => ({ ...row, ...tone(followTone(row.status)) })),
    vendors,
    quotes: catalog.quotations || [],
    invoices: (catalog.invoices || []).map((row) => ({ ...row, tone: dueTone(row.due) })),
    assetKpis: [
      { label: "Tagged assets", value: String(assets.length), note: "From asset register", tone: "#8a8a80" },
      { label: "Book value", value: rupees(0), note: "Not tracked yet", tone: "#8a8a80" },
      { label: "Under AMC", value: String(assets.filter((row) => /amc/i.test(row.amc || "")).length), note: "Warranty / AMC notes", tone: "#1e6b52" },
      { label: "Needs attention", value: String(assets.filter((row) => row.condition !== "Good").length), note: "Not in good condition", tone: "#b0491a" },
    ],
    assets,
    amc: (catalog.amc || []).map((row) => ({ ...row, ...tone(amcTone(row.status)) })),
    reminders: (catalog.reminders || []).map((row) => ({ ...row, tone: reminderTone(row.when) })),
    breakdowns: catalog.breakdowns || [],
    facilities: (catalog.facilities || []).map((row) => ({ ...row, ...tone(facilityTone(row.state)) })),
    bookings,
    reportDate: formatDay(new Date().toLocaleDateString("en-CA")),
    canSee: {
      bills: canRead(permissions, "billing"),
      complaints: canRead(permissions, "helpdesk"),
      invoices: canRead(permissions, "vendors"),
    },
    reportKpis: [
      {
        label: "Collection %",
        value: `${Number(money.collectionPct || 0).toFixed(1)}%`,
        note: money.billed ? `${rupees(money.collected)} of ${rupees(money.billed)}` : "No bills yet",
        tone: Number(money.collectionPct || 0) >= 92 ? "#1e6b52" : Number(money.billed) ? "#8a6414" : "#8a8a80",
      },
      {
        label: "Outstanding dues",
        value: rupees(money.due),
        note: money.unpaidFlats ? plural(money.unpaidFlats, "flat") : "No dues yet",
        tone: money.due ? "#b0491a" : "#8a8a80",
      },
      {
        label: "Occupancy",
        value: `${occupancyPct}%`,
        note: occupancy.total ? `${occupancy.occupied} of ${occupancy.total} flats` : "No flats yet",
        tone: "#1e6b52",
      },
      {
        label: "Vendor payments due",
        value: rupees(money.vendorDue),
        note: money.invoices ? plural(money.invoices, "invoice") : "No vendor invoices yet",
        tone: money.vendorDue ? "#8a6414" : "#8a8a80",
      },
    ],
    blockSummary: blocks.map((block) => {
      const units = (block.floors || []).flatMap((floor) => floor.flats || []);
      const occupiedCount = units.filter((unit) => unit.status && unit.status !== "Vacant").length;
      const complaints = openTickets.filter((row) => String(row.flat).startsWith(`${block.code}-`) || String(row.flat).startsWith(block.code)).length;
      const totals = dashboard.blockMoney?.[block.code] || { billed: 0, collected: 0 };
      const pct = totals.billed ? ((totals.collected / totals.billed) * 100).toFixed(1) : block.count ? ((occupiedCount / block.count) * 100).toFixed(1) : "0.0";
      return {
        block: block.name,
        flats: block.count,
        occupied: occupiedCount,
        billed: rupees(totals.billed),
        collected: rupees(totals.collected),
        complaints,
        pct: `${pct}%`,
        tone: Number(pct) >= 90 ? "#1e6b52" : Number(pct) >= 85 ? "#8a6414" : Number(totals.billed) || block.count ? "#b0491a" : "#8a8a80",
      };
    }),
    roleCards: access.roleCards || base.roleCards,
    permRoles: access.permRoles || base.permRoles,
    permRows: access.permRows || base.permRows,
    users: access.users || [],
  };
}
