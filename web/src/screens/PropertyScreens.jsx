import { useMemo, useState } from "react";
import { Bar, Card, EmptyTableNote, KpiCard, PageHead, PageLead, PageTitle, Pill, PrimaryButton, SecondaryButton, SectionTitle, Td, Th } from "../components/ui.jsx";

export function HomeScreen({ view }) {
  const lower = [view.showComplaints, view.showStaff, view.showEvents].filter(Boolean).length;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
        <div>
          <PageTitle>Good morning! ☀️</PageTitle>
          <PageLead maxWidth={660}>Here's what's happening at {view.societyName} today — {view.homeLead}.</PageLead>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #e8e4d9", borderRadius: 999, padding: "9px 17px", font: "400 14px Lato,sans-serif", color: "#5f5f57", whiteSpace: "nowrap" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: view.syncOk ? "#1e6b52" : "#b0491a" }} />
          {view.syncOk ? "Connected to API · live data" : "Waiting for API"}
        </div>
      </div>
      {view.homeKpis.length ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(view.homeKpis.length, 4)}, minmax(0, 1fr))`, gap: 22, marginTop: 30 }}>
          {view.homeKpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      ) : null}
      {view.showChart || view.showAttention ? (
        <div style={{ display: "grid", gridTemplateColumns: view.showChart && view.showAttention ? "1.45fr 1fr" : "1fr", gap: 22, marginTop: 22, alignItems: "start" }}>
          {view.showChart ? (
            <Card padding="26px 28px 22px">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 26 }}>
                <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: 0 }}>Collection trend</h2>
                <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>Income vs expense, last 6 months</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: 220 }}>
                {view.chart.map((c) => (
                  <div key={c.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 190 }}>
                      <div style={{ width: 22, height: c.income, background: "#1e6b52", borderRadius: "3px 3px 0 0" }} />
                      <div style={{ width: 22, height: c.expense, background: "#c2571f", borderRadius: "3px 3px 0 0" }} />
                    </div>
                    <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>{c.month}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 22, marginTop: 16, paddingTop: 16, borderTop: "1px solid #efece3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 13px Lato,sans-serif", color: "#5f5f57" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1e6b52" }} />Income
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 13px Lato,sans-serif", color: "#5f5f57" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#c2571f" }} />Expense
                </div>
              </div>
            </Card>
          ) : null}
          {view.showAttention ? (
            <Card>
              <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 8px" }}>Attention needed</h2>
              {view.attention.map((a) => (
                <div key={a.text} style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline", padding: "15px 0", borderBottom: "1px solid #efece3" }}>
                  <div style={{ font: "400 15px/1.35 Lato,sans-serif" }}>{a.text}</div>
                  <div style={{ font: "700 14px 'Source Serif 4',Georgia,serif", color: a.tone, whiteSpace: "nowrap" }}>{a.amount}</div>
                </div>
              ))}
            </Card>
          ) : null}
        </div>
      ) : null}
      {lower ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${lower},1fr)`, gap: 22, marginTop: 22 }}>
          {view.showComplaints ? (
            <Card>
              <h2 style={{ font: "700 19px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Open complaints</h2>
              {view.homeComplaints.map((c) => (
                <div key={c.text} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "12px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                  <span>{c.text}</span>
                  <span style={{ fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase", color: c.tone, whiteSpace: "nowrap", paddingTop: 2 }}>{c.tag}</span>
                </div>
              ))}
            </Card>
          ) : null}
          {view.showStaff ? (
            <Card>
              <h2 style={{ font: "700 19px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Staff on duty today</h2>
              {view.homeStaff.map((s) => (
                <div key={s.text} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "12px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                  <span>{s.text}</span>
                  <span style={{ color: "#8a8a80", fontSize: 14, whiteSpace: "nowrap" }}>{s.meta}</span>
                </div>
              ))}
            </Card>
          ) : null}
          {view.showEvents ? (
            <Card>
              <h2 style={{ font: "700 19px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Today at the society</h2>
              {view.homeEvents.map((e) => (
                <div key={e.text} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "12px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                  <span>{e.text}</span>
                  <span style={{ color: "#8a8a80", fontSize: 14, whiteSpace: "nowrap" }}>{e.meta}</span>
                </div>
              ))}
            </Card>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function BlocksScreen({ view, onAdd }) {
  return (
    <>
      <PageHead
        tag="Module 1 · Property Master"
        title="Blocks, floors & flats"
        lead="5 blocks — A, B, C, D, E — each with 4 floors. Blocks B and C run units A–D per floor; Blocks A, D and E run wider, A–F. Colour shows occupancy and due status."
        action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Flat</PrimaryButton> : null}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 30 }}>
        {view.blocks.map((b) => (
          <Card key={b.name} padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
              <h2 style={{ font: "700 19px/1 'Source Serif 4',Georgia,serif", margin: 0 }}>{b.name}</h2>
              <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>{b.count} flats</span>
            </div>
            {b.floors.map((f) => (
              <div key={f.n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", width: 12 }}>{f.n}</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {f.flats.map((u) => (
                    <span key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 31, borderRadius: 6, font: "700 13px 'IBM Plex Mono',monospace", background: u.bg, color: u.fg }}>
                      {u.id}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 26, margin: "22px 0 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, font: "400 14px Lato,sans-serif", color: "#5f5f57" }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: "#1e6b52" }} />Occupied, dues clear
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, font: "400 14px Lato,sans-serif", color: "#5f5f57" }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: "#c2571f" }} />Occupied, dues pending
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, font: "400 14px Lato,sans-serif", color: "#5f5f57" }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: "#ddd8cb" }} />Vacant
        </div>
      </div>
      <Card padding="26px 30px">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <SectionTitle>Flat register</SectionTitle>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>{view.flatRegister.length} units from PostgreSQL</span>
        </div>
        <table>
          <thead>
            <tr>
              <Th>Flat</Th><Th>Type</Th><Th>Carpet area</Th><Th>UDS</Th><Th>Parking</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {view.flatRegister.length ? view.flatRegister.map((r) => (
              <tr key={r.id || r.flat}>
                <Td mono>{r.flat}</Td>
                <Td>{r.type}</Td>
                <Td>{r.carpet}</Td>
                <Td>{r.uds}</Td>
                <Td>{r.parking}</Td>
                <Td><Pill bg={r.bg} fg={r.fg}>{r.status}</Pill></Td>
              </tr>
            )) : <EmptyTableNote colSpan={6}>No flats loaded for this society.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function ResidentsScreen({ view, onAdd }) {
  const [query, setQuery] = useState("");
  const [block, setBlock] = useState("All blocks");
  const [kind, setKind] = useState("Owner + Tenant");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return view.residents.filter((r) => {
      const matchesQuery = !needle || r.name.toLowerCase().includes(needle) || String(r.flat).toLowerCase().includes(needle);
      const matchesBlock = block === "All blocks" || String(r.flat).startsWith(`${block.replace("Block ", "")}-`);
      const matchesKind = kind === "Owner + Tenant" || (kind === "Owners only" ? r.type === "Owner" : r.type === "Tenant");
      return matchesQuery && matchesBlock && matchesKind;
    });
  }, [view.residents, query, block, kind]);
  return (
    <>
      <PageHead tag="Module 2 · Owners & Residents" title="Residents directory" lead="Owner and tenant records, family members, emergency contacts, and move history." action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Resident</PrimaryButton> : null} />
      <div style={{ display: "flex", gap: 14, margin: "28px 0 22px" }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or flat no." style={{ border: "1px solid #e0dccf", background: "#fff", borderRadius: 9, padding: "12px 16px", font: "400 15px Lato,sans-serif", width: 250, color: "#2a2a28" }} />
        <select value={block} onChange={(e) => setBlock(e.target.value)} style={{ border: "1px solid #e0dccf", background: "#fff", borderRadius: 9, padding: "12px 14px", font: "400 15px Lato,sans-serif", color: "#2a2a28" }}>
          <option>All blocks</option><option>Block A</option><option>Block B</option><option>Block C</option><option>Block D</option><option>Block E</option>
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ border: "1px solid #e0dccf", background: "#fff", borderRadius: 9, padding: "12px 14px", font: "400 15px Lato,sans-serif", color: "#2a2a28" }}>
          <option>Owner + Tenant</option><option>Owners only</option><option>Tenants only</option>
        </select>
      </div>
      <Card padding="26px 30px">
        <table>
          <thead>
            <tr>
              <Th>Name</Th><Th>Flat</Th><Th>Type</Th><Th>Family</Th><Th>Contact</Th><Th>Emergency contact</Th><Th>Since</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.id || r.name + r.flat}>
                <Td>{r.name}</Td>
                <Td mono>{r.flat}</Td>
                <Td><Pill bg={r.bg} fg={r.fg}>{r.type}</Pill></Td>
                <Td muted>{r.family}</Td>
                <Td>{r.phone}</Td>
                <Td muted>{r.emergency}</Td>
                <Td>{r.since}</Td>
              </tr>
            )) : <EmptyTableNote colSpan={7}>No residents match this search.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 8 }}>Move-in / Move-out log</SectionTitle>
        {view.moveLog.map((m) => (
          <div key={m.text} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "15px 0", borderBottom: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
            <span>{m.text}</span>
            <span style={{ font: "700 14px 'Source Serif 4',Georgia,serif", whiteSpace: "nowrap" }}>{m.date}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

export function AccessScreen({ view }) {
  return (
    <>
      <PageHead tag="Module 3 · User & Access" title="Users & role permissions" lead="Seven roles across the society. A role decides which modules a login can open and whether it can only read or also edit." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.roleCards.map((r) => (
          <Card key={r.role} padding="22px 24px">
            <div style={{ font: "700 17px/1 'Source Serif 4',Georgia,serif" }}>{r.role}</div>
            <div style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80", margin: "10px 0 14px" }}>{r.count}</div>
            <div style={{ font: "400 14px/1.5 Lato,sans-serif", color: "#5f5f57" }}>{r.scope}</div>
          </Card>
        ))}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22, overflowX: "auto" }}>
        <SectionTitle style={{ marginBottom: 20 }}>Permission matrix</SectionTitle>
        <table>
          <thead>
            <tr>
              <Th>Module</Th>
              {view.permRoles.map((h) => (
                <Th key={h} center>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.permRows.map((row) => (
              <tr key={row.module}>
                <Td nowrap>{row.module}</Td>
                {row.cells.map((c, i) => (
                  <td key={i} style={{ textAlign: "center", padding: "13px 12px", borderTop: "1px solid #efece3", font: "400 14px Lato,sans-serif", color: c.fg }}>{c.mark}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 18, borderTop: "1px solid #efece3", font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>
          <span>● Full — create, edit, approve</span><span>◐ Read only</span><span>— No access</span>
        </div>
      </Card>
      {view.users?.length ? (
        <Card padding="26px 30px" style={{ marginTop: 22 }}>
          <SectionTitle style={{ marginBottom: 20 }}>Active logins</SectionTitle>
          <table>
            <thead>
              <tr><Th>Name</Th><Th>Email</Th><Th>Role</Th></tr>
            </thead>
            <tbody>
              {view.users.map((u) => (
                <tr key={u.id}>
                  <Td>{u.fullName}</Td>
                  <Td muted>{u.email}</Td>
                  <Td>{u.roleLabel}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </>
  );
}

export function BillsScreen({ view, onGenerate, onReceipt }) {
  return (
    <>
      <PageHead tag="Module 4 · Maintenance Billing" title={view.billTitle} lead={view.billIntro} action={onGenerate ? <PrimaryButton onClick={onGenerate}>{view.billCta}</PrimaryButton> : null} />
      <div style={{ background: "#fffdf8", border: "1px solid #e8e4d9", borderRadius: 12, padding: "24px 28px", marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: 0 }}>Billing cycle settings</h2>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>Configurable per society</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 38, marginTop: 18, font: "400 15px Lato,sans-serif", color: "#5f5f57" }}>
          <div>Billing frequency: <strong style={{ color: "#2a2a28" }}>{view.freqLabel}</strong></div>
          <div>Bill raised on: <strong style={{ color: "#2a2a28" }}>{view.raisedOn}</strong></div>
          <div>Due date: <strong style={{ color: "#2a2a28" }}>15th of the billing month</strong></div>
          <div>Penalty: <strong style={{ color: "#2a2a28" }}>₹{view.penalty}/day</strong> after due date</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 22 }}>
        {view.billKpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <SectionTitle>{view.billRegisterTitle}</SectionTitle>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>Penalty = ₹{view.penalty}/day from 16 Jul until paid</span>
        </div>
        <table>
          <thead>
            <tr>
              <Th>Flat</Th><Th>Resident</Th><Th>{view.maintColLabel}</Th><Th>Special contribution</Th><Th>Prev. balance</Th><Th>Penalty</Th><Th>Total due</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {view.bills.length ? view.bills.map((b) => (
              <tr key={b.id || b.flat}>
                <Td mono>{b.flat}</Td>
                <Td>{b.resident}</Td>
                <Td mono>{b.maint}</Td>
                <Td mono muted>{b.special}</Td>
                <Td mono muted>{b.prev}</Td>
                <Td mono muted>{b.penalty}</Td>
                <Td mono style={{ fontWeight: 500 }}>{b.total}</Td>
                <Td><Pill bg={b.bg} fg={b.fg}>{b.status}</Pill></Td>
              </tr>
            )) : <EmptyTableNote colSpan={8}>No bills in this cycle yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <SectionTitle>Receipt preview — A-1A</SectionTitle>
          {onReceipt ? <button type="button" onClick={onReceipt} style={{ border: "1px solid #e0dccf", background: "#fff", cursor: "pointer", borderRadius: 8, padding: "10px 18px", font: "700 14px Lato,sans-serif", color: "#2a2a28" }}>Download PDF</button> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, font: "400 15px/1.5 Lato,sans-serif", color: "#5f5f57" }}>
          <div>Receipt No: MR/2026/Q3/0101 · Date: 05-Jul-2026</div>
          <div>Flat A-1A — Ramesh Kumar</div>
          <div>{view.receiptLine}</div>
          <div style={{ fontWeight: 700, color: "#2a2a28" }}>Amount Paid: ₹12,600 — via UPI</div>
        </div>
      </Card>
    </>
  );
}

export function AccountsScreen({ view }) {
  return (
    <>
      <PageHead tag="Module 5 · Accounting & Finance" title="Accounts, vouchers & budget" lead="Financial year 2026–27, as of 27 Aug 2026. Books close monthly; the last audit was signed off for FY 2025–26." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.finKpis.map((k) => (
          <KpiCard key={k.label} compact {...k} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22, marginTop: 22, alignItems: "start" }}>
        <Card padding="26px 30px">
          <SectionTitle style={{ marginBottom: 20 }}>Voucher register — August</SectionTitle>
          <table>
            <thead>
              <tr><Th>Voucher</Th><Th>Head</Th><Th>Paid to</Th><Th>Amount</Th><Th>Approval</Th></tr>
            </thead>
            <tbody>
              {view.vouchers.map((v) => (
                <tr key={v.id || v.no}>
                  <Td mono style={{ fontSize: 14 }}>{v.no}</Td>
                  <Td>{v.head}</Td>
                  <Td muted>{v.party}</Td>
                  <Td mono style={{ fontWeight: 500 }}>{v.amount}</Td>
                  <Td><Pill bg={v.bg} fg={v.fg}>{v.state}</Pill></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Bank & cash</h2>
            {view.banks.map((b) => (
              <div key={b.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: "1px solid #efece3" }}>
                <div>
                  <div style={{ font: "400 15px Lato,sans-serif" }}>{b.name}</div>
                  <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginTop: 3 }}>{b.meta}</div>
                </div>
                <div style={{ font: "700 16px 'Source Serif 4',Georgia,serif", whiteSpace: "nowrap" }}>{b.balance}</div>
              </div>
            ))}
          </Card>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Budget vs actual</h2>
            {view.budget.map((b) => (
              <div key={b.head} style={{ padding: "13px 0", borderTop: "1px solid #efece3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", marginBottom: 9 }}>
                  <span>{b.head}</span><span style={{ color: "#5f5f57" }}>{b.figures}</span>
                </div>
                <Bar pct={b.pct} color={b.tone} />
              </div>
            ))}
          </Card>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Statements & audit</h2>
            {view.statements.map((s) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "13px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                <span>{s.name}</span><span style={{ color: "#1e6b52", fontSize: 14, whiteSpace: "nowrap" }}>{s.action}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
