export const T = {
  green: ["#e3efe8", "#1e6b52"],
  rust: ["#fbe6d8", "#b0491a"],
  amber: ["#fbeed0", "#8a6414"],
  purple: ["#ece8f7", "#5b4b96"],
  grey: ["#eceae2", "#6f6f68"],
};

export const tag = (label, tone) => ({ label, bg: T[tone][0], fg: T[tone][1] });

export const NAV = [
  { title: "Overview", items: [["home", "🏠", "Home"], ["reports", "📊", "Reports & Dashboard"]] },
  { title: "Property & people", items: [["blocks", "🏢", "Blocks & Flats"], ["residents", "👥", "Residents"], ["access", "🔐", "Users & Access"]] },
  { title: "Billing & finance", items: [["bills", "💰", "Maintenance Bills"], ["accounts", "📒", "Accounting & Finance"], ["vendors", "🤝", "Vendors"]] },
  { title: "Operations", items: [["helpdesk", "🛠️", "Helpdesk"], ["security", "🛡️", "Security"], ["staff", "🧹", "Staff"], ["roster", "🗓️", "Duty Roster"], ["assets", "⚙️", "Assets"], ["ppm", "🔧", "Preventive Maintenance"], ["facility", "🎉", "Facility Booking"]] },
];

export const MODALS = {
  flat: {
    title: "Add flat",
    kicker: "Module 1 · Property Master",
    submit: "Save flat",
    fields: [
      { key: "flat", label: "Flat no.", placeholder: "A-2C", required: true },
      { key: "type", label: "Flat type", options: ["1BHK", "2BHK", "3BHK", "4BHK"] },
      { key: "carpet", label: "Carpet area", placeholder: "980 sq.ft" },
      { key: "uds", label: "UDS", placeholder: "330 sq.ft" },
      { key: "parking", label: "Parking slots", options: ["0", "1", "2"] },
      { key: "status", label: "Status", options: ["Owner-occupied", "Tenant", "Vacant"] },
    ],
  },
  resident: {
    title: "Add resident",
    kicker: "Module 2 · Owners & Residents",
    submit: "Save resident",
    fields: [
      { key: "name", label: "Full name", placeholder: "Ramesh Kumar", required: true },
      { key: "flat", label: "Flat no.", placeholder: "A-2C", required: true },
      { key: "type", label: "Resident type", options: ["Owner", "Tenant"] },
      { key: "family", label: "Family members", placeholder: "3 members" },
      { key: "phone", label: "Contact number", placeholder: "98430 XXXXX", required: true },
      { key: "emergency", label: "Emergency contact", placeholder: "Name — number" },
      { key: "since", label: "Resident since", placeholder: "Aug 2026" },
    ],
  },
  ticket: {
    title: "New complaint",
    kicker: "Module 6 · Helpdesk",
    submit: "Raise ticket",
    fields: [
      { key: "flat", label: "Flat / location", placeholder: "C-2A", required: true },
      { key: "category", label: "Category", options: ["Plumbing", "Electrical", "Lift", "Housekeeping", "Security", "Carpentry", "Facility"] },
      { key: "text", label: "Complaint", placeholder: "Describe the issue", required: true },
      { key: "priority", label: "Priority", options: ["High", "Medium", "Low"] },
      { key: "owner", label: "Assign to", placeholder: "Suresh (electrician)", required: true },
    ],
  },
  vendor: {
    title: "Add vendor",
    kicker: "Module 10 · Vendor Management",
    submit: "Save vendor",
    fields: [
      { key: "name", label: "Vendor name", placeholder: "AquaPure", required: true },
      { key: "service", label: "Service", placeholder: "Water tank cleaning", required: true },
      { key: "phone", label: "Contact", placeholder: "93450 XXXXX", required: true },
      { key: "value", label: "Contract value", placeholder: "₹1,08,000/yr", required: true },
      { key: "renewal", label: "Renewal date", placeholder: "30 Jun 2027" },
      { key: "pay", label: "Payment state", options: ["Clear", "Due"] },
    ],
  },
  asset: {
    title: "Add asset",
    kicker: "Module 11 · Asset Management",
    submit: "Save asset",
    fields: [
      { key: "tag", label: "Asset tag", placeholder: "PMP-04", required: true },
      { key: "name", label: "Asset name", placeholder: "Booster pump — Block E", required: true },
      { key: "category", label: "Category", options: ["Lifts", "Power backup", "Pumps", "Electrical", "CCTV", "Fire safety", "Gym equipment", "Furniture"] },
      { key: "location", label: "Location", placeholder: "Pump room", required: true },
      { key: "installed", label: "Installed year", placeholder: "2026" },
      { key: "amc", label: "Warranty / AMC", placeholder: "AMC to 31 Mar 2027" },
      { key: "condition", label: "Condition", options: ["Good", "Monitor", "Under repair", "Out of service"] },
    ],
  },
  booking: {
    title: "New booking",
    kicker: "Module 13 · Facility Booking",
    submit: "Confirm booking",
    fields: [
      { key: "facility", label: "Facility", options: ["Community hall", "Party area", "Gym", "Swimming pool", "Sports room", "Guest suite"] },
      { key: "flat", label: "Flat no.", placeholder: "B-2B", required: true },
      { key: "date", label: "Date", placeholder: "12 Sep", required: true },
      { key: "slot", label: "Slot", placeholder: "6–10 pm", required: true },
      { key: "charge", label: "Charge", placeholder: "₹3,000" },
      { key: "deposit", label: "Refundable deposit", placeholder: "₹5,000" },
      { key: "pay", label: "Payment", options: ["Paid", "Pending", "Awaiting approval"] },
    ],
  },
  user: {
    title: "Add login",
    kicker: "Module 3 · Users & Access",
    submit: "Create login",
    fields: [
      { key: "name", label: "Full name", placeholder: "Meera Rao", required: true },
      { key: "email", label: "Email", placeholder: "manager@yopmail.com", required: true },
      { key: "password", label: "Password", placeholder: "At least 8 characters", required: true },
      { key: "role", label: "Role", options: ["Admin", "EC member", "Manager", "Accountant", "Security", "Resident", "Vendor"] },
    ],
  },
  billGenerate: {
    title: "Generate bills",
    kicker: "Module 4 · Maintenance Billing",
    submit: "Generate bills",
    fields: [
      { key: "period", label: "Billing period", placeholder: "Oct 2026", required: true, default: () => monthLabel(new Date()) },
      { key: "amount", label: "Maintenance per flat (₹)", placeholder: "4200", required: true },
      { key: "special", label: "Special contribution per flat (₹)", placeholder: "0" },
      { key: "dueOn", label: "Due date", type: "date", required: true, default: () => isoDay(addDays(new Date(), 15)) },
      { key: "scope", label: "Bill which flats", options: ["All flats", "Occupied flats only"] },
    ],
  },
  payment: {
    title: "Record payment",
    kicker: "Module 4 · Maintenance Billing",
    submit: "Save payment",
    fields: [
      { key: "billLabel", label: "Bill", readOnly: true },
      { key: "amount", label: "Amount received (₹)", placeholder: "4200", required: true },
      { key: "mode", label: "Paid via", options: ["UPI", "Cash", "Cheque", "Bank transfer"] },
      { key: "paidOn", label: "Paid on", type: "date", required: true, default: () => isoDay(new Date()) },
    ],
  },
  voucher: {
    title: "Add expense voucher",
    kicker: "Module 5 · Accounting & Finance",
    submit: "Save voucher",
    fields: [
      { key: "head", label: "Account head", placeholder: "Housekeeping", required: true },
      { key: "party", label: "Paid to", placeholder: "CleanCo Services", required: true },
      { key: "amount", label: "Amount (₹)", placeholder: "18000", required: true },
      { key: "state", label: "Approval", options: ["Approved", "EC approval", "Draft"] },
    ],
  },
};

const lockFlat = (f) => (f.key === "flat" ? { ...f, readOnly: true, required: false } : f);

MODALS.flatEdit = {
  title: "Edit flat",
  kicker: MODALS.flat.kicker,
  submit: "Save changes",
  fields: MODALS.flat.fields.map(lockFlat),
};

MODALS.residentEdit = {
  title: "Edit resident",
  kicker: MODALS.resident.kicker,
  submit: "Save changes",
  fields: MODALS.resident.fields.map(lockFlat),
};

MODALS.billEdit = {
  title: "Edit bill",
  kicker: MODALS.billGenerate.kicker,
  submit: "Save changes",
  fields: [
    { key: "flat", label: "Flat", readOnly: true },
    { key: "period", label: "Billing period", required: true },
    { key: "amount", label: "Maintenance (₹)", required: true },
    { key: "special", label: "Special contribution (₹)" },
    { key: "dueOn", label: "Due date", type: "date", required: true },
  ],
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const DEFAULT_SETTINGS = {
  societyName: "Greenfield Residency",
  penaltyPerDay: 15,
  billingFrequency: "Quarterly, in advance",
};

export function emptyForm(kind) {
  const form = {};
  MODALS[kind].fields.forEach((f) => {
    if (f.default !== undefined) {
      form[f.key] = typeof f.default === "function" ? f.default() : f.default;
    } else {
      form[f.key] = f.options ? f.options[0] : "";
    }
  });
  return form;
}

export function buildBlocks() {
  const defs = [
    { name: "Block A", units: 6, pending: ["2F", "4A"], vacant: ["2E"] },
    { name: "Block B", units: 4, pending: ["2D"], vacant: ["2B"] },
    { name: "Block C", units: 4, pending: ["4A", "1B"], vacant: ["2B", "2D"] },
    { name: "Block D", units: 6, pending: ["4A", "4C", "2D", "1C"], vacant: ["3F"] },
    { name: "Block E", units: 6, pending: ["3D", "2A", "2C", "1C"], vacant: [] },
  ];
  const letters = "ABCDEF";
  return defs.map((d) => ({
    name: d.name,
    count: d.units * 4,
    floors: [4, 3, 2, 1].map((n) => ({
      n,
      flats: Array.from({ length: d.units }, (_, i) => {
        const id = n + letters[i];
        const st = d.vacant.includes(id) ? "vacant" : d.pending.includes(id) ? "pending" : "ok";
        return {
          id,
          bg: st === "vacant" ? "#ddd8cb" : st === "pending" ? "#c2571f" : "#1e6b52",
          fg: st === "vacant" ? "#6f6f68" : "#fff",
        };
      }),
    })),
  }));
}

export function buildView(settings = DEFAULT_SETTINGS) {
  const penalty = settings.penaltyPerDay ?? 15;
  const quarterly = (settings.billingFrequency ?? "Quarterly, in advance") !== "Monthly";
  const societyName = settings.societyName ?? "Greenfield Residency";
  const pen42 = 42 * penalty;
  const inr = (n) => "₹" + n.toLocaleString("en-IN");

  return {
    societyName,
    penalty,
    quarterly,
    billTitle: quarterly ? "Quarterly maintenance & dues" : "Monthly maintenance & dues",
    billIntro: quarterly
      ? "Billed in advance for the quarter, on the 1st month: Jan bill covers Jan–Mar, Apr covers Apr–Jun, Jul covers Jul–Sep, Oct covers Oct–Dec. Due by the 15th of the billing month; penalty accrues per day after that."
      : "Billed in advance on the 1st of every month and due by the 15th; penalty accrues per day after that.",
    billCta: quarterly ? "Generate Q3 (Jul–Sep) Bills" : "Generate August Bills",
    freqLabel: quarterly ? "Quarterly, in advance" : "Monthly, in advance",
    raisedOn: quarterly ? "1st of Jan / Apr / Jul / Oct" : "1st of every month",
    billRegisterTitle: quarterly ? "Bill register — Q3 2026 (Jul–Sep, raised 1 Jul, due 15 Jul)" : "Bill register — August 2026 (raised 1 Aug, due 15 Aug)",
    maintColLabel: quarterly ? "Quarter maintenance" : "Month maintenance",
    receiptLine: quarterly ? "Quarterly maintenance (Jul–Sep 2026) ................ ₹12,600" : "Monthly maintenance (Aug 2026) ................ ₹4,200",
    generateToast: quarterly ? "Q3 (Jul–Sep) bills generated for 104 flats — ₹28,75,200." : "August bills generated for 104 flats — ₹9,58,400.",
    blocks: buildBlocks(),
    homeKpis: [
      { label: "Money collected", value: "₹8,42,000", note: "↑ 6% vs last month", tone: "#1e6b52" },
      { label: "Money still due", value: "₹1,16,400", note: "14 flats haven't paid yet", tone: "#b0491a" },
      { label: "Money spent", value: "₹5,10,200", note: "Housekeeping, DG fuel, lift AMC", tone: "#8a8a80" },
      { label: "Flats occupied", value: "96 / 104", note: "8 flats are empty", tone: "#8a8a80" },
    ],
    attention: [
      { text: "C-3D — 42 days overdue", amount: inr(12600 + 4600 + pen42), tone: "#b0491a" },
      { text: "A-1B — Q3 bill still pending", amount: "₹11,800", tone: "#b0491a" },
      { text: "Lift AMC renewal due 5 Sep", amount: "—", tone: "#8a8a80" },
      { text: "Bank recon pending — HDFC A/C", amount: "—", tone: "#8a8a80" },
      { text: "D-4C — move-out this week", amount: "—", tone: "#8a8a80" },
    ],
    homeComplaints: [
      { text: "HD-2041 — Lift B stuck on 3rd", tag: "High", tone: "#b0491a" },
      { text: "HD-2039 — Water leak, C-2A ceiling", tag: "High", tone: "#b0491a" },
      { text: "HD-2036 — Corridor light out, D-3", tag: "Low", tone: "#8a8a80" },
      { text: "HD-2033 — Gym treadmill noise", tag: "Medium", tone: "#8a6414" },
    ],
    homeStaff: [
      { text: "Housekeeping", meta: "6 of 6 present" },
      { text: "Security guards", meta: "7 of 8 present" },
      { text: "Plumber (on call)", meta: "Arriving 3 pm" },
      { text: "Gardener", meta: "On leave" },
    ],
    homeEvents: [
      { text: "Community hall — birthday party", meta: "6–10 pm" },
      { text: "DG diesel top-up", meta: "11 am" },
      { text: "EC meeting — Q3 accounts", meta: "7:30 pm" },
      { text: "Pest control, Block E", meta: "2 pm" },
    ],
    chart: [
      { month: "Mar", income: 132, expense: 88 },
      { month: "Apr", income: 146, expense: 79 },
      { month: "May", income: 118, expense: 104 },
      { month: "Jun", income: 158, expense: 92 },
      { month: "Jul", income: 172, expense: 112 },
      { month: "Aug", income: 140, expense: 85 },
    ],
    flatRegister: [
      { flat: "A-1A", type: "3BHK", carpet: "1,240 sq.ft", uds: "420 sq.ft", parking: 2, status: "Owner-occupied", bg: T.green[0], fg: T.green[1] },
      { flat: "A-1B", type: "2BHK", carpet: "980 sq.ft", uds: "330 sq.ft", parking: 1, status: "Tenant", bg: T.purple[0], fg: T.purple[1] },
      { flat: "A-1C", type: "3BHK", carpet: "1,240 sq.ft", uds: "420 sq.ft", parking: 2, status: "Vacant", bg: T.grey[0], fg: T.grey[1] },
      { flat: "A-1D", type: "2BHK", carpet: "980 sq.ft", uds: "330 sq.ft", parking: 1, status: "Owner-occupied", bg: T.green[0], fg: T.green[1] },
      { flat: "A-1E", type: "2BHK", carpet: "980 sq.ft", uds: "330 sq.ft", parking: 1, status: "Tenant", bg: T.purple[0], fg: T.purple[1] },
      { flat: "A-1F", type: "1BHK", carpet: "620 sq.ft", uds: "210 sq.ft", parking: 1, status: "Owner-occupied", bg: T.green[0], fg: T.green[1] },
    ],
    residents: [
      { name: "Ramesh Kumar", flat: "A-1A", type: "Owner", family: "4 members", phone: "98430 XXXXX", emergency: "Lakshmi K. — 90031 XXXXX", since: "Mar 2019", bg: T.green[0], fg: T.green[1] },
      { name: "Sneha Iyer", flat: "A-1B", type: "Tenant", family: "2 members", phone: "96297 XXXXX", emergency: "Arjun Iyer — 96297 XXXXX", since: "Jan 2026", bg: T.purple[0], fg: T.purple[1] },
      { name: "Vinod Menon", flat: "B-2B", type: "Owner", family: "3 members", phone: "90802 XXXXX", emergency: "Priya Menon — 90802 XXXXX", since: "Jul 2020", bg: T.green[0], fg: T.green[1] },
      { name: "Farida Sheikh", flat: "C-3D", type: "Tenant", family: "3 members", phone: "97511 XXXXX", emergency: "—", since: "Feb 2025", bg: T.purple[0], fg: T.purple[1] },
      { name: "Anil Deshmukh", flat: "D-4C", type: "Owner", family: "5 members", phone: "99401 XXXXX", emergency: "Sunita D. — 99401 XXXXX", since: "Nov 2018", bg: T.green[0], fg: T.green[1] },
      { name: "Kavya Raghavan", flat: "E-1C", type: "Tenant", family: "1 member", phone: "93810 XXXXX", emergency: "R. Raghavan — 93810 XXXXX", since: "Aug 2026", bg: T.purple[0], fg: T.purple[1] },
    ],
    moveLog: [
      { text: "D-4C — move-out scheduled", date: "2 Sep 2026" },
      { text: "E-1C — new tenant moved in", date: "14 Aug 2026" },
      { text: "C-3D — new tenant moved in", date: "14 Feb 2025" },
      { text: "A-1B — tenant renewed lease", date: "1 Jan 2026" },
    ],
    roleCards: [
      { role: "Admin", count: "2 logins", scope: "Everything, including masters and audit trail" },
      { role: "EC member", count: "7 logins", scope: "Read all, approve vouchers above ₹25,000" },
      { role: "Manager", count: "1 login", scope: "Day-to-day operations, billing, staff, vendors" },
      { role: "Security", count: "9 logins", scope: "Gate register, visitors, incidents only" },
    ],
    permRoles: ["Admin", "EC", "Manager", "Accountant", "Security", "Resident", "Vendor"],
    permRows: [
      { module: "Property master", marks: ["●", "◐", "●", "—", "—", "—", "—"] },
      { module: "Residents", marks: ["●", "◐", "●", "—", "◐", "◐", "—"] },
      { module: "Maintenance billing", marks: ["●", "◐", "●", "●", "—", "◐", "—"] },
      { module: "Accounting & finance", marks: ["●", "◐", "◐", "●", "—", "—", "—"] },
      { module: "Helpdesk", marks: ["●", "◐", "●", "—", "◐", "●", "◐"] },
      { module: "Security & incidents", marks: ["●", "◐", "●", "—", "●", "—", "—"] },
      { module: "Staff & roster", marks: ["●", "◐", "●", "—", "◐", "—", "—"] },
      { module: "Vendors & AMC", marks: ["●", "◐", "●", "◐", "—", "—", "◐"] },
      { module: "Facility booking", marks: ["●", "◐", "●", "—", "◐", "●", "—"] },
      { module: "Reports", marks: ["●", "●", "●", "●", "—", "◐", "—"] },
    ].map((r) => ({
      module: r.module,
      cells: r.marks.map((m) => ({ mark: m, fg: m === "●" ? "#1e6b52" : m === "◐" ? "#8a6414" : "#c4c0b4" })),
    })),
    billKpis: [
      { label: quarterly ? "Billed this quarter" : "Billed this month", value: quarterly ? "₹28,75,200" : "₹9,58,400" },
      { label: "Collected so far", value: quarterly ? "₹25,26,000" : "₹8,42,000" },
      { label: "Still pending", value: quarterly ? "₹3,49,200" : "₹1,16,400" },
    ],
    bills: [
      { flat: "A-1A", resident: "Ramesh Kumar", maint: "₹12,600", special: "—", prev: "—", penalty: "—", total: "₹12,600", status: "Paid", bg: T.green[0], fg: T.green[1] },
      { flat: "A-1B", resident: "Sneha Iyer", maint: "₹10,800", special: "₹1,000", prev: "—", penalty: "—", total: "₹11,800", status: "Pending", bg: T.amber[0], fg: T.amber[1] },
      { flat: "B-2B", resident: "Vinod Menon", maint: "₹12,600", special: "—", prev: "—", penalty: "—", total: "₹12,600", status: "Paid", bg: T.green[0], fg: T.green[1] },
      { flat: "C-3D", resident: "Farida Sheikh", maint: "₹12,600", special: "—", prev: "₹4,600", penalty: inr(pen42), total: inr(12600 + 4600 + pen42), status: "Overdue — 42 days", bg: T.rust[0], fg: T.rust[1] },
      { flat: "D-4C", resident: "Anil Deshmukh", maint: "₹14,400", special: "₹2,500", prev: "—", penalty: "—", total: "₹16,900", status: "Paid", bg: T.green[0], fg: T.green[1] },
      { flat: "E-1C", resident: "Kavya Raghavan", maint: "₹8,400", special: "—", prev: "—", penalty: "—", total: "₹8,400", status: "Part paid — ₹4,000", bg: T.amber[0], fg: T.amber[1] },
    ],
    finKpis: [
      { label: "Income YTD", value: "₹41,20,000", note: "Maintenance + interest + hall rent", tone: "#8a8a80" },
      { label: "Expenses YTD", value: "₹33,86,400", note: "82% of budget consumed", tone: "#8a8a80" },
      { label: "Corpus fund", value: "₹62,40,000", note: "Fixed deposit, matures Mar 2027", tone: "#1e6b52" },
      { label: "Cash + bank", value: "₹7,84,900", note: "Across 3 accounts", tone: "#8a8a80" },
    ],
    vouchers: [
      { no: "PV/26-27/218", head: "Lift AMC", party: "Skyline Elevators", amount: "₹48,000", state: "Approved", bg: T.green[0], fg: T.green[1] },
      { no: "PV/26-27/219", head: "DG diesel", party: "Sri Fuels", amount: "₹36,500", state: "Approved", bg: T.green[0], fg: T.green[1] },
      { no: "PV/26-27/220", head: "Housekeeping salary", party: "Payroll", amount: "₹1,42,000", state: "Approved", bg: T.green[0], fg: T.green[1] },
      { no: "PV/26-27/221", head: "Plumbing repair, C-block", party: "Ravi Plumbing", amount: "₹18,700", state: "EC approval", bg: T.amber[0], fg: T.amber[1] },
      { no: "PV/26-27/222", head: "CCTV upgrade (advance)", party: "SecureVision", amount: "₹75,000", state: "EC approval", bg: T.amber[0], fg: T.amber[1] },
      { no: "PV/26-27/223", head: "Garden saplings", party: "Green Nursery", amount: "₹6,200", state: "Draft", bg: T.grey[0], fg: T.grey[1] },
    ],
    banks: [
      { name: "HDFC — current A/C", meta: "••4821 · operating account", balance: "₹5,12,400" },
      { name: "SBI — sinking fund", meta: "••7730 · restricted", balance: "₹2,48,000" },
      { name: "Petty cash", meta: "Manager custody", balance: "₹24,500" },
    ],
    budget: [
      { head: "Housekeeping", figures: "₹14.2L of ₹17.0L", pct: "84%", tone: "#1e6b52" },
      { head: "Electricity & DG", figures: "₹9.8L of ₹11.0L", pct: "89%", tone: "#1e6b52" },
      { head: "Lift & pumps AMC", figures: "₹3.9L of ₹4.2L", pct: "93%", tone: "#c2571f" },
      { head: "Security", figures: "₹4.1L of ₹6.4L", pct: "64%", tone: "#1e6b52" },
      { head: "Repairs & civil", figures: "₹1.9L of ₹2.0L", pct: "95%", tone: "#c2571f" },
    ],
    statements: [
      { name: "Income & expenditure — Aug 2026", action: "View" },
      { name: "Balance sheet — FY 2025–26", action: "View" },
      { name: "Receipts & payments — Q1", action: "View" },
      { name: "Auditor report — FY 2025–26", action: "Signed 12 Jun" },
    ],
    helpKpis: [
      { label: "Open tickets", value: "14", note: "4 high priority", tone: "#b0491a" },
      { label: "Closed this month", value: "38", note: "↑ 9 vs July", tone: "#1e6b52" },
      { label: "Avg resolution", value: "19 hrs", note: "Target: 24 hrs", tone: "#1e6b52" },
      { label: "Resident rating", value: "4.3 / 5", note: "From 31 responses", tone: "#8a8a80" },
    ],
    tickets: [
      { id: "HD-2041", flat: "B-3A", category: "Lift", text: "Lift B stopped between 3rd and 4th", priority: "High", owner: "Skyline Elevators", photos: "2 photos", status: "In progress", pbg: T.rust[0], pfg: T.rust[1], sbg: T.amber[0], sfg: T.amber[1] },
      { id: "HD-2039", flat: "C-2A", category: "Plumbing", text: "Water seepage on bedroom ceiling", priority: "High", owner: "Ravi (plumber)", photos: "3 photos", status: "In progress", pbg: T.rust[0], pfg: T.rust[1], sbg: T.amber[0], sfg: T.amber[1] },
      { id: "HD-2038", flat: "A-4D", category: "Electrical", text: "Frequent MCB trip in kitchen line", priority: "Medium", owner: "Suresh (electrician)", photos: "1 photo", status: "Assigned", pbg: T.amber[0], pfg: T.amber[1], sbg: T.purple[0], sfg: T.purple[1] },
      { id: "HD-2036", flat: "D-3 corridor", category: "Housekeeping", text: "Corridor light not working", priority: "Low", owner: "Suresh (electrician)", photos: "—", status: "Assigned", pbg: T.grey[0], pfg: T.grey[1], sbg: T.purple[0], sfg: T.purple[1] },
      { id: "HD-2033", flat: "Gym", category: "Facility", text: "Treadmill making grinding noise", priority: "Medium", owner: "FitCare Services", photos: "1 photo", status: "Awaiting vendor", pbg: T.amber[0], pfg: T.amber[1], sbg: T.amber[0], sfg: T.amber[1] },
      { id: "HD-2030", flat: "E-2C", category: "Carpentry", text: "Main door lock jammed", priority: "Low", owner: "Manager", photos: "—", status: "Resolved", pbg: T.grey[0], pfg: T.grey[1], sbg: T.green[0], sfg: T.green[1] },
      { id: "HD-2027", flat: "Basement", category: "Security", text: "CCTV camera 7 offline", priority: "High", owner: "SecureVision", photos: "1 photo", status: "Resolved", pbg: T.rust[0], pfg: T.rust[1], sbg: T.green[0], sfg: T.green[1] },
    ],
    trail: [
      { when: "26 Aug, 08:12", what: "Raised by resident (B-3A) with 2 photos" },
      { when: "26 Aug, 08:40", what: "Assigned to Skyline Elevators by manager" },
      { when: "26 Aug, 11:05", what: "Technician on site — controller card fault" },
      { when: "27 Aug, 09:30", what: "Spare ordered; temporary lock-out in place" },
    ],
    feedback: [
      { who: "A-2C — plumbing", stars: "★★★★★", note: "Fixed the same evening, no follow-up needed." },
      { who: "E-2C — carpentry", stars: "★★★★☆", note: "Good work, took a day longer than promised." },
      { who: "Basement — CCTV", stars: "★★★★☆", note: "Camera back online; wiring still untidy." },
      { who: "D-1B — housekeeping", stars: "★★★☆☆", note: "Staircase cleaning missed twice last week." },
    ],
    shifts: [
      { name: "Morning", hours: "06:00 – 14:00", staff: "Ganesh P. (main gate) · Iqbal S. (basement) · Ramu K. (rounds)", state: "Completed", bg: T.grey[0], fg: T.grey[1] },
      { name: "Evening", hours: "14:00 – 22:00", staff: "Mahesh R. (main gate) · Dinesh V. (clubhouse) · Ravi T. (rounds)", state: "On duty", bg: T.green[0], fg: T.green[1] },
      { name: "Night", hours: "22:00 – 06:00", staff: "Karthik B. (main gate) · Selvam A. (rounds)", state: "Next", bg: T.purple[0], fg: T.purple[1] },
    ],
    guards: [
      { name: "Ganesh P.", post: "Main gate", shift: "Morning", times: "05:52 / 14:04", status: "Present", bg: T.green[0], fg: T.green[1] },
      { name: "Iqbal S.", post: "Basement", shift: "Morning", times: "06:05 / 14:02", status: "Late by 5m", bg: T.amber[0], fg: T.amber[1] },
      { name: "Ramu K.", post: "Patrol", shift: "Morning", times: "05:58 / 14:00", status: "Present", bg: T.green[0], fg: T.green[1] },
      { name: "Mahesh R.", post: "Main gate", shift: "Evening", times: "13:50 / —", status: "On duty", bg: T.green[0], fg: T.green[1] },
      { name: "Dinesh V.", post: "Clubhouse", shift: "Evening", times: "13:56 / —", status: "On duty", bg: T.green[0], fg: T.green[1] },
      { name: "Suman L.", post: "Patrol", shift: "Evening", times: "— / —", status: "Absent", bg: T.rust[0], fg: T.rust[1] },
      { name: "Karthik B.", post: "Main gate", shift: "Night", times: "— / —", status: "Rostered", bg: T.purple[0], fg: T.purple[1] },
    ],
    handover: [
      { when: "Morning → Evening, 14:00", note: "Lift B locked out on 3rd floor; vendor spare expected tomorrow. Visitor pass book at 41 entries." },
      { when: "Night → Morning, 06:00", note: "Two-wheeler without sticker parked in visitor bay — sticker issued at 07:20." },
      { when: "Evening → Night, 22:00 (26 Aug)", note: "Basement gate motor slow to close; PPM ticket raised." },
    ],
    patrol: [
      { point: "Terrace doors — all blocks", mark: "Locked · 23:10", tone: "#1e6b52" },
      { point: "Basement — fire exit clear", mark: "Clear · 23:25", tone: "#1e6b52" },
      { point: "Pump room", mark: "Checked · 00:05", tone: "#1e6b52" },
      { point: "Children’s play area", mark: "Gate open — fixed", tone: "#8a6414" },
      { point: "Perimeter walk (E → A)", mark: "Not signed", tone: "#b0491a" },
    ],
    incidents: [
      { what: "Unregistered visitor argued at gate — police not required", when: "25 Aug, 21:40", status: "Closed", bg: T.green[0], fg: T.green[1] },
      { what: "Two-wheeler scratched in basement (D block bay 12)", when: "22 Aug, 18:05", status: "Under review", bg: T.amber[0], fg: T.amber[1] },
      { what: "Fire alarm false trigger, Block C 2nd floor", when: "18 Aug, 03:15", status: "Closed", bg: T.green[0], fg: T.green[1] },
      { what: "Delivery agent entered without pass", when: "14 Aug, 12:30", status: "Closed — warning", bg: T.green[0], fg: T.green[1] },
    ],
    staffKpis: [
      { label: "On payroll", value: "14", note: "5 categories", tone: "#8a8a80" },
      { label: "Present today", value: "12 / 14", note: "1 leave, 1 absent", tone: "#8a6414" },
      { label: "August salary", value: "₹3,18,400", note: "Release on 5 Sep", tone: "#8a8a80" },
      { label: "Overtime hours", value: "46", note: "Mostly DG duty", tone: "#8a8a80" },
    ],
    staffRows: [
      { name: "Lakshmi Devi", role: "Housekeeping", area: "Blocks A & B", present: "25 / 26", salary: "₹16,500", payout: "Processed", bg: T.green[0], fg: T.green[1] },
      { name: "Shanti Bai", role: "Housekeeping", area: "Blocks C & D", present: "26 / 26", salary: "₹16,500", payout: "Processed", bg: T.green[0], fg: T.green[1] },
      { name: "Suresh N.", role: "Electrician", area: "Society-wide", present: "24 / 26", salary: "₹28,000", payout: "Processed", bg: T.green[0], fg: T.green[1] },
      { name: "Ravi Kumar", role: "Plumber", area: "Society-wide", present: "22 / 26", salary: "₹26,000", payout: "Hold — leave", bg: T.amber[0], fg: T.amber[1] },
      { name: "Murugan S.", role: "Gardener", area: "Lawns & podium", present: "20 / 26", salary: "₹15,000", payout: "Pending", bg: T.amber[0], fg: T.amber[1] },
      { name: "Prakash J.", role: "Manager", area: "Society office", present: "26 / 26", salary: "₹52,000", payout: "Processed", bg: T.green[0], fg: T.green[1] },
      { name: "Anitha R.", role: "Housekeeping", area: "Block E & clubhouse", present: "26 / 26", salary: "₹16,500", payout: "Processed", bg: T.green[0], fg: T.green[1] },
    ],
    days: ["Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28", "Sat 29", "Sun 30"],
    rosterRows: [
      { duty: "Common area sweeping", who: ["Lakshmi", "Lakshmi", "Shanti", "Shanti", "Lakshmi", "Anitha", "Anitha"] },
      { duty: "Staircase mopping", who: ["Shanti", "Anitha", "Anitha", "Lakshmi", "Shanti", "Shanti", "Off"] },
      { duty: "Garbage clearance", who: ["Murugan", "Murugan", "Murugan", "Murugan", "Murugan", "Murugan", "Off"] },
      { duty: "Pump / DG check", who: ["Suresh", "Suresh", "Suresh", "Suresh", "Suresh", "Ravi", "Ravi"] },
      { duty: "Garden watering", who: ["Murugan", "Off", "Murugan", "Off", "Murugan", "Off", "Murugan"] },
      { duty: "Gate supervision", who: ["Prakash", "Prakash", "Prakash", "Prakash", "Prakash", "Ganesh", "Ganesh"] },
    ].map((r) => ({
      duty: r.duty,
      cells: r.who.map((w) => (w === "Off" ? { who: "Off", bg: "#f3f1ea", fg: "#a8a49a" } : { who: w, bg: T.green[0], fg: T.green[1] })),
    })),
    followUps: [
      { task: "Terrace water tank cleaning — Block C", owner: "Prakash J.", due: "27 Aug", verifier: "EC — Mr. Menon", status: "Verified", bg: T.green[0], fg: T.green[1] },
      { task: "Basement gate motor servicing", owner: "Suresh N.", due: "28 Aug", verifier: "Manager", status: "In progress", bg: T.amber[0], fg: T.amber[1] },
      { task: "Perimeter patrol signature (night)", owner: "Selvam A.", due: "27 Aug", verifier: "Security supervisor", status: "Escalated", bg: T.rust[0], fg: T.rust[1] },
      { task: "Pest control — Block E", owner: "PestShield", due: "27 Aug", verifier: "Manager", status: "Scheduled", bg: T.purple[0], fg: T.purple[1] },
      { task: "Fire extinguisher refill (6 units)", owner: "SafeGuard Fire", due: "30 Aug", verifier: "EC — Mrs. Rao", status: "Scheduled", bg: T.purple[0], fg: T.purple[1] },
      { task: "Lift B controller card fitment", owner: "Skyline Elevators", due: "28 Aug", verifier: "Manager", status: "In progress", bg: T.amber[0], fg: T.amber[1] },
    ],
    vendors: [
      { name: "Skyline Elevators", service: "Lift AMC — 4 lifts", phone: "98410 XXXXX", value: "₹1,92,000/yr", renewal: "5 Sep 2026", rtone: "#b0491a", pay: "Due ₹48,000", bg: T.amber[0], fg: T.amber[1] },
      { name: "PowerGen Services", service: "DG set AMC", phone: "99620 XXXXX", value: "₹84,000/yr", renewal: "31 Mar 2027", rtone: "#5f5f57", pay: "Clear", bg: T.green[0], fg: T.green[1] },
      { name: "SecureVision", service: "CCTV — 32 cameras", phone: "90035 XXXXX", value: "₹1,20,000/yr", renewal: "18 Nov 2026", rtone: "#5f5f57", pay: "Due ₹75,000", bg: T.amber[0], fg: T.amber[1] },
      { name: "SafeGuard Fire", service: "Fire equipment", phone: "97890 XXXXX", value: "₹66,000/yr", renewal: "12 Oct 2026", rtone: "#8a6414", pay: "Clear", bg: T.green[0], fg: T.green[1] },
      { name: "PestShield", service: "Pest control — quarterly", phone: "94441 XXXXX", value: "₹48,000/yr", renewal: "1 Jan 2027", rtone: "#5f5f57", pay: "Clear", bg: T.green[0], fg: T.green[1] },
      { name: "AquaPure", service: "Water tank cleaning, STP", phone: "93450 XXXXX", value: "₹1,08,000/yr", renewal: "30 Jun 2027", rtone: "#5f5f57", pay: "Clear", bg: T.green[0], fg: T.green[1] },
      { name: "Sri Fuels", service: "DG diesel supply", phone: "90921 XXXXX", value: "Per order", renewal: "—", rtone: "#8a8a80", pay: "Due ₹36,500", bg: T.amber[0], fg: T.amber[1] },
    ],
    quotes: [
      { work: "Block C exterior painting", vendors: "3 quotations received", range: "₹4.2L – ₹5.6L" },
      { work: "Basement waterproofing", vendors: "2 quotations · 1 awaited", range: "₹1.8L – ₹2.1L" },
      { work: "Gym equipment servicing", vendors: "2 quotations received", range: "₹22K – ₹31K" },
      { work: "Solar lighting, podium", vendors: "1 quotation received", range: "₹3.4L" },
    ],
    invoices: [
      { no: "INV/SKY/2026/311", who: "Skyline Elevators · Lift AMC Q3", amount: "₹48,000", due: "Due in 3 days", tone: "#8a6414" },
      { no: "INV/SV/2026/104", who: "SecureVision · CCTV upgrade advance", amount: "₹75,000", due: "EC approval pending", tone: "#8a6414" },
      { no: "INV/SF/2026/882", who: "Sri Fuels · diesel, Aug", amount: "₹36,500", due: "Overdue 6 days", tone: "#b0491a" },
      { no: "INV/PS/2026/067", who: "PestShield · Q2 service", amount: "₹12,000", due: "Due 5 Sep", tone: "#5f5f57" },
    ],
    assetKpis: [
      { label: "Tagged assets", value: "148", note: "Across 9 categories", tone: "#8a8a80" },
      { label: "Book value", value: "₹1.42 Cr", note: "Net of depreciation", tone: "#8a8a80" },
      { label: "Under AMC", value: "61", note: "41% of assets", tone: "#1e6b52" },
      { label: "Needs attention", value: "5", note: "2 out of service", tone: "#b0491a" },
    ],
    assets: [
      { tag: "LFT-A1", name: "Passenger lift — Block A", category: "Lifts", location: "Block A core", installed: "2018", amc: "AMC to 5 Sep 2026", condition: "Good", bg: T.green[0], fg: T.green[1] },
      { tag: "LFT-B1", name: "Passenger lift — Block B", category: "Lifts", location: "Block B core", installed: "2018", amc: "AMC to 5 Sep 2026", condition: "Under repair", bg: T.rust[0], fg: T.rust[1] },
      { tag: "DG-01", name: "Diesel generator 250 kVA", category: "Power backup", location: "DG yard", installed: "2019", amc: "AMC to 31 Mar 2027", condition: "Good", bg: T.green[0], fg: T.green[1] },
      { tag: "PMP-03", name: "Booster pump — Block C", category: "Pumps", location: "Pump room", installed: "2020", amc: "Warranty expired", condition: "Monitor", bg: T.amber[0], fg: T.amber[1] },
      { tag: "PNL-01", name: "Main LT panel", category: "Electrical", location: "Substation", installed: "2018", amc: "Annual thermography", condition: "Good", bg: T.green[0], fg: T.green[1] },
      { tag: "CCTV-07", name: "Dome camera — basement ramp", category: "CCTV", location: "Basement", installed: "2021", amc: "AMC to 18 Nov 2026", condition: "Good", bg: T.green[0], fg: T.green[1] },
      { tag: "FIRE-12", name: "Fire extinguisher 6 kg ABC", category: "Fire safety", location: "Block D lobby", installed: "2023", amc: "Refill due 30 Aug", condition: "Refill due", bg: T.amber[0], fg: T.amber[1] },
      { tag: "GYM-04", name: "Treadmill", category: "Gym equipment", location: "Clubhouse gym", installed: "2022", amc: "No AMC", condition: "Out of service", bg: T.rust[0], fg: T.rust[1] },
      { tag: "FUR-31", name: "Hall chairs (set of 100)", category: "Furniture", location: "Community hall", installed: "2019", amc: "—", condition: "Good", bg: T.green[0], fg: T.green[1] },
    ],
    amc: [
      { equip: "Lifts (4 nos.)", vendor: "Skyline Elevators", freq: "Monthly", next: "5 Sep 2026", status: "Renewal due", bg: T.rust[0], fg: T.rust[1] },
      { equip: "DG set 250 kVA", vendor: "PowerGen Services", freq: "Quarterly", next: "15 Sep 2026", status: "Active", bg: T.green[0], fg: T.green[1] },
      { equip: "CCTV — 32 cameras", vendor: "SecureVision", freq: "Quarterly", next: "2 Oct 2026", status: "Active", bg: T.green[0], fg: T.green[1] },
      { equip: "Fire equipment", vendor: "SafeGuard Fire", freq: "Half-yearly", next: "30 Aug 2026", status: "Due this week", bg: T.amber[0], fg: T.amber[1] },
      { equip: "Water tanks & STP", vendor: "AquaPure", freq: "Quarterly", next: "12 Sep 2026", status: "Active", bg: T.green[0], fg: T.green[1] },
      { equip: "Pest control", vendor: "PestShield", freq: "Quarterly", next: "27 Aug 2026", status: "Scheduled today", bg: T.purple[0], fg: T.purple[1] },
      { equip: "Booster pumps", vendor: "In-house (Suresh)", freq: "Monthly", next: "1 Sep 2026", status: "Active", bg: T.green[0], fg: T.green[1] },
    ],
    reminders: [
      { what: "Pest control — Block E", when: "Today", tone: "#b0491a" },
      { what: "Fire extinguisher refill (6)", when: "30 Aug", tone: "#8a6414" },
      { what: "Lift AMC renewal", when: "5 Sep", tone: "#b0491a" },
      { what: "Water tank cleaning", when: "12 Sep", tone: "#5f5f57" },
      { what: "DG quarterly service", when: "15 Sep", tone: "#5f5f57" },
    ],
    breakdowns: [
      { what: "Controller card fault", when: "26 Aug 2026", note: "Lift B locked out; spare ordered, ETA 28 Aug." },
      { what: "Door sensor misalignment", when: "11 Jun 2026", note: "Adjusted on site, no cost under AMC." },
      { what: "Overload sensor trip", when: "3 Feb 2026", note: "Sensor replaced — ₹4,200 outside AMC scope." },
      { what: "Emergency light battery", when: "19 Nov 2025", note: "Battery pack replaced under warranty." },
    ],
    facilities: [
      { name: "Community hall", capacity: "Seats 120 · 6 slots/week", charge: "₹3,000 / slot", next: "Booked today", state: "Booked", bg: T.amber[0], fg: T.amber[1] },
      { name: "Party area (podium)", capacity: "Seats 60", charge: "₹1,500 / slot", next: "Free", state: "Available", bg: T.green[0], fg: T.green[1] },
      { name: "Gym", capacity: "18 stations", charge: "Free for residents", next: "Open 5 am – 10 pm", state: "Available", bg: T.green[0], fg: T.green[1] },
      { name: "Swimming pool", capacity: "25 m · 4 lanes", charge: "₹500 / guest", next: "Reopens 29 Aug", state: "Maintenance", bg: T.rust[0], fg: T.rust[1] },
      { name: "Sports room", capacity: "TT, carrom, chess", charge: "Free for residents", next: "Free", state: "Available", bg: T.green[0], fg: T.green[1] },
      { name: "Guest suite", capacity: "2 rooms", charge: "₹900 / night", next: "1 room free", state: "Partly booked", bg: T.amber[0], fg: T.amber[1] },
    ],
    bookings: [
      { facility: "Community hall", flat: "B-2B", date: "27 Aug", slot: "6–10 pm", charge: "₹3,000", deposit: "₹5,000", pay: "Paid", bg: T.green[0], fg: T.green[1] },
      { facility: "Party area", flat: "A-1A", date: "29 Aug", slot: "7–10 pm", charge: "₹1,500", deposit: "₹2,000", pay: "Paid", bg: T.green[0], fg: T.green[1] },
      { facility: "Community hall", flat: "D-4C", date: "31 Aug", slot: "11 am–3 pm", charge: "₹3,000", deposit: "₹5,000", pay: "Pending", bg: T.amber[0], fg: T.amber[1] },
      { facility: "Guest suite", flat: "E-1C", date: "2–4 Sep", slot: "2 nights", charge: "₹1,800", deposit: "—", pay: "Paid", bg: T.green[0], fg: T.green[1] },
      { facility: "Sports room", flat: "C-1D", date: "3 Sep", slot: "5–7 pm", charge: "Free", deposit: "—", pay: "N/A", bg: T.grey[0], fg: T.grey[1] },
      { facility: "Community hall", flat: "A-3B", date: "7 Sep", slot: "4–9 pm", charge: "₹3,000", deposit: "₹5,000", pay: "Awaiting approval", bg: T.purple[0], fg: T.purple[1] },
    ],
    reportKpis: [
      { label: "Collection %", value: "87.9%", note: "Target 92%", tone: "#8a6414" },
      { label: "Outstanding dues", value: "₹3,49,200", note: "14 flats", tone: "#b0491a" },
      { label: "Occupancy", value: "92.3%", note: "96 of 104 flats", tone: "#1e6b52" },
      { label: "Vendor payments due", value: "₹1,71,500", note: "4 invoices", tone: "#8a6414" },
    ],
    ageing: [
      { bucket: "0–30 days", amount: "₹1,42,000", pct: "41%", tone: "#1e6b52" },
      { bucket: "31–60 days", amount: "₹98,600", pct: "28%", tone: "#8a6414" },
      { bucket: "61–90 days", amount: "₹64,200", pct: "18%", tone: "#c2571f" },
      { bucket: "90+ days", amount: "₹44,400", pct: "13%", tone: "#b0491a" },
    ],
    expenseSplit: [
      { head: "Housekeeping", amount: "₹1,58,000", pct: "31%" },
      { head: "Electricity & DG", amount: "₹1,24,000", pct: "24%" },
      { head: "Security", amount: "₹96,000", pct: "19%" },
      { head: "Lift & pumps AMC", amount: "₹58,000", pct: "11%" },
      { head: "Repairs", amount: "₹42,200", pct: "8%" },
      { head: "Others", amount: "₹32,000", pct: "7%" },
    ],
    blockSummary: [
      { block: "Block A", flats: 24, occupied: 22, billed: "₹6,84,000", collected: "₹6,32,000", pct: "92.4%", complaints: 3, tone: "#1e6b52" },
      { block: "Block B", flats: 16, occupied: 15, billed: "₹4,42,000", collected: "₹4,10,000", pct: "92.8%", complaints: 2, tone: "#1e6b52" },
      { block: "Block C", flats: 16, occupied: 13, billed: "₹4,38,000", collected: "₹3,52,000", pct: "80.4%", complaints: 4, tone: "#b0491a" },
      { block: "Block D", flats: 24, occupied: 22, billed: "₹6,92,000", collected: "₹5,98,000", pct: "86.4%", complaints: 3, tone: "#8a6414" },
      { block: "Block E", flats: 24, occupied: 24, billed: "₹6,19,200", collected: "₹5,34,000", pct: "86.2%", complaints: 2, tone: "#8a6414" },
    ],
  };
}
