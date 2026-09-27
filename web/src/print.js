const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function printDocument({ title, css, body, width = 640 }) {
  const win = window.open("", "_blank", `width=${width},height=760`);
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${body}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
  return true;
}

export function printReceipt(societyName, receipt) {
  return printDocument({
    title: receipt.receiptNo,
    css: "body{font:15px/1.6 Georgia,serif;color:#2a2a28;padding:40px;max-width:520px;margin:auto}h1{font-size:22px;margin:0 0 4px}.muted{color:#6f6f68}.row{display:flex;justify-content:space-between;border-top:1px solid #e8e4d9;padding:10px 0}.total{font-weight:700;font-size:18px}",
    body: `<h1>${esc(societyName)}</h1><div class="muted">Maintenance receipt</div><br>
<div class="row"><span>Receipt no.</span><span>${esc(receipt.receiptNo)}</span></div>
<div class="row"><span>Date</span><span>${esc(receipt.paidOn)}</span></div>
<div class="row"><span>Flat</span><span>${esc(receipt.flat)}</span></div>
<div class="row"><span>Resident</span><span>${esc(receipt.resident)}</span></div>
<div class="row"><span>Billing period</span><span>${esc(receipt.period)}</span></div>
<div class="row"><span>Paid via</span><span>${esc(receipt.mode)}</span></div>
<div class="row total"><span>Amount paid</span><span>${esc(receipt.amount)}</span></div>`,
  });
}

function table(headers, rows, empty) {
  if (!rows.length) return `<p class="empty">${esc(empty)}</p>`;
  const head = headers.map((h) => `<th${h.num ? ' class="num"' : ""}>${esc(h.label)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell, i) => `<td${headers[i].num ? ' class="num"' : ""}>${esc(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function section(title, content) {
  return `<section><h2>${esc(title)}</h2>${content}</section>`;
}

const PACK_CSS = `
@page{size:A4;margin:16mm}
body{font:12.5px/1.5 "Helvetica Neue",Arial,sans-serif;color:#2a2a28;margin:0;padding:24px}
header{border-bottom:2px solid #1e6b52;padding-bottom:12px;margin-bottom:18px}
h1{font:700 24px/1.2 Georgia,serif;margin:0}
.sub{color:#6f6f68;margin-top:4px}
h2{font:700 15px/1.2 Georgia,serif;margin:0 0 8px;color:#1e6b52}
section{margin:0 0 20px;break-inside:avoid}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
.kpi{border:1px solid #e0dccf;border-radius:6px;padding:10px 12px}
.kpi .label{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#6f6f68}
.kpi .value{font:700 18px/1.3 Georgia,serif;margin-top:3px}
.kpi .note{font-size:11px;color:#6f6f68}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#6f6f68;border-bottom:1px solid #d9d4c5;padding:5px 8px 5px 0}
td{border-bottom:1px solid #efece3;padding:6px 8px 6px 0;vertical-align:top}
.num{text-align:right;white-space:nowrap}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.empty{color:#6f6f68;margin:0}
footer{margin-top:24px;color:#8a8a80;font-size:10.5px}
`;

export function printCommitteePack(view) {
  const kpis = (view.reportKpis || [])
    .map((k) => `<div class="kpi"><div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}</div><div class="note">${esc(k.note)}</div></div>`)
    .join("");

  const ageing = table(
    [{ label: "Overdue for" }, { label: "Amount", num: true }, { label: "Share", num: true }],
    (view.ageing || []).map((a) => [a.bucket, a.amount, a.pct]),
    "No outstanding dues.",
  );
  const expenses = table(
    [{ label: "Account head" }, { label: "Amount", num: true }, { label: "Share", num: true }],
    (view.expenseSplit || []).map((e) => [e.head, e.amount, e.pct]),
    "No approved expenses yet.",
  );
  const blocks = table(
    [{ label: "Block" }, { label: "Flats", num: true }, { label: "Occupied", num: true }, { label: "Billed", num: true }, { label: "Collected", num: true }, { label: "Collection %", num: true }, { label: "Open complaints", num: true }],
    (view.blockSummary || []).map((b) => [b.block, b.flats, b.occupied, b.billed, b.collected, b.pct, b.complaints]),
    "No blocks in the register yet.",
  );

  const parts = [
    `<div class="kpis">${kpis}</div>`,
    `<div class="two">${section("Outstanding dues — ageing", ageing)}${section("Expense split — approved vouchers", expenses)}</div>`,
    section("Block-wise summary", blocks),
  ];

  if (view.canSee?.bills) {
    const overdue = (view.bills || []).filter((b) => String(b.status).startsWith("Overdue"));
    parts.push(section(`Overdue bills (${overdue.length})`, table(
      [{ label: "Flat" }, { label: "Period" }, { label: "Resident" }, { label: "Late fee", num: true }, { label: "Still due", num: true }, { label: "Status" }],
      overdue.map((b) => [b.flat, b.period, b.resident, b.penalty, b.remaining, b.status]),
      "No overdue bills.",
    )));
  }
  if (view.canSee?.complaints) {
    const open = (view.tickets || []).filter((t) => t.status !== "Resolved");
    parts.push(section(`Open complaints (${open.length})`, table(
      [{ label: "Ticket" }, { label: "Flat / place" }, { label: "Category" }, { label: "Complaint" }, { label: "Priority" }, { label: "Assigned to" }, { label: "Status" }],
      open.map((t) => [t.id, t.flat, t.category, t.text, t.priority, t.owner, t.status]),
      "No open complaints.",
    )));
  }
  if (view.canSee?.invoices) {
    parts.push(section(`Vendor invoices awaiting payment (${(view.invoices || []).length})`, table(
      [{ label: "Invoice" }, { label: "Vendor / for" }, { label: "Amount", num: true }, { label: "Due" }],
      (view.invoices || []).map((i) => [i.no, i.who, i.amount, i.due]),
      "No unpaid vendor invoices.",
    )));
  }

  return printDocument({
    title: `${view.societyName} — committee pack ${view.reportDate}`,
    width: 900,
    css: PACK_CSS,
    body: `<header><h1>${esc(view.societyName)}</h1><div class="sub">Committee pack · prepared on ${esc(view.reportDate)}</div></header>
${parts.join("\n")}
<footer>Generated from Society Operations Suite. Figures are live as of the preparation date.</footer>`,
  });
}
