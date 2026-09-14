import { Bar, Card, EmptyTableNote, KpiCard, PageHead, Pill, PrimaryButton, SecondaryButton, SectionTitle, Td, Th } from "../components/ui.jsx";

export function HelpdeskScreen({ view, onAdd }) {
  return (
    <>
      <PageHead tag="Module 6 · Complaints & Helpdesk" title="Helpdesk" lead="Residents raise tickets from the app; the manager assigns them to staff or a vendor and closes with resident feedback." action={onAdd ? <PrimaryButton onClick={onAdd}>+ New Complaint</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.helpKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Ticket queue</SectionTitle>
        <table>
          <thead>
            <tr><Th>Ticket</Th><Th>Flat</Th><Th>Category</Th><Th>Complaint</Th><Th>Priority</Th><Th>Assigned to</Th><Th>Photos</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {view.tickets.length ? view.tickets.map((t) => (
              <tr key={t.id}>
                <Td mono style={{ fontSize: 14 }}>{t.id}</Td>
                <Td mono>{t.flat}</Td>
                <Td>{t.category}</Td>
                <Td muted style={{ maxWidth: 280 }}>{t.text}</Td>
                <Td><Pill bg={t.pbg} fg={t.pfg}>{t.priority}</Pill></Td>
                <Td>{t.owner}</Td>
                <Td style={{ color: "#8a8a80", fontSize: 14 }}>{t.photos}</Td>
                <Td><Pill bg={t.sbg} fg={t.sfg}>{t.status}</Pill></Td>
              </tr>
            )) : <EmptyTableNote colSpan={8}>No helpdesk tickets yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Resolution trail — {view.trailTicket}</h2>
          {(view.trail.length ? view.trail : [{ when: "—", what: "No trail events yet for this ticket." }]).map((t) => (
            <div key={t.when + t.what} style={{ display: "flex", gap: 16, padding: "13px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
              <span style={{ color: "#8a8a80", fontSize: 14, width: 104, flex: "0 0 104px" }}>{t.when}</span>
              <span>{t.what}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Recent resident feedback</h2>
          {view.feedback.map((f) => (
            <div key={f.who} style={{ padding: "14px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif" }}>
                <span>{f.who}</span><span style={{ color: "#b8862a" }}>{f.stars}</span>
              </div>
              <div style={{ font: "400 14px/1.5 Lato,sans-serif", color: "#5f5f57", marginTop: 5 }}>{f.note}</div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function SecurityScreen({ view }) {
  return (
    <>
      <PageHead tag="Module 7 · Security Management" title="Security & gate operations" lead="Three shifts, eight guards, one supervisor. Shift handover and patrol checklists are signed on the gate tablet." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 30 }}>
        {view.shifts.map((s) => (
          <Card key={s.name} padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ font: "700 18px/1 'Source Serif 4',Georgia,serif" }}>{s.name}</div>
              <Pill compact bg={s.bg} fg={s.fg}>{s.state}</Pill>
            </div>
            <div style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80", margin: "9px 0 14px" }}>{s.hours}</div>
            <div style={{ font: "400 15px/1.6 Lato,sans-serif", color: "#5f5f57" }}>{s.staff}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 22, marginTop: 22, alignItems: "start" }}>
        <Card padding="26px 30px">
          <SectionTitle style={{ marginBottom: 20 }}>Guard attendance — 27 Aug</SectionTitle>
          <table>
            <thead><tr><Th>Guard</Th><Th>Post</Th><Th>Shift</Th><Th>In / Out</Th><Th>Status</Th></tr></thead>
            <tbody>
              {view.guards.map((g) => (
                <tr key={g.name}>
                  <Td>{g.name}</Td>
                  <Td muted>{g.post}</Td>
                  <Td>{g.shift}</Td>
                  <Td mono muted style={{ fontSize: 14 }}>{g.times}</Td>
                  <Td><Pill bg={g.bg} fg={g.fg}>{g.status}</Pill></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Shift handover notes</h2>
            {view.handover.map((h) => (
              <div key={h.when} style={{ padding: "14px 0", borderTop: "1px solid #efece3" }}>
                <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginBottom: 5 }}>{h.when}</div>
                <div style={{ font: "400 15px/1.5 Lato,sans-serif" }}>{h.note}</div>
              </div>
            ))}
          </Card>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Patrol checklist — night round</h2>
            {view.patrol.map((p) => (
              <div key={p.point} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "12px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                <span>{p.point}</span>
                <span style={{ color: p.tone, fontSize: 14, whiteSpace: "nowrap" }}>{p.mark}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 8 }}>Incident register</SectionTitle>
        {view.incidents.map((i) => (
          <div key={i.what} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "15px 0", borderBottom: "1px solid #efece3" }}>
            <div style={{ font: "400 15px Lato,sans-serif" }}>{i.what}</div>
            <div style={{ display: "flex", gap: 20, alignItems: "baseline", whiteSpace: "nowrap" }}>
              <span style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80" }}>{i.when}</span>
              <Pill bg={i.bg} fg={i.fg}>{i.status}</Pill>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

export function StaffScreen({ view, onAttendance }) {
  return (
    <>
      <PageHead tag="Module 8 · Staff Management" title="Staff, attendance & salary" lead="Fourteen on the society payroll — housekeeping, electrician, plumber, gardeners and the manager. Salaries are released on the 5th." action={onAttendance ? <PrimaryButton onClick={onAttendance}>Mark Attendance</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.staffKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <SectionTitle>Staff register</SectionTitle>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>August 2026 · 26 working days</span>
        </div>
        <table>
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Duty area</Th><Th>Present</Th><Th>Salary</Th><Th>Payout</Th></tr></thead>
          <tbody>
            {view.staffRows.map((s) => (
              <tr key={s.id || s.name}>
                <Td>{s.name}</Td>
                <Td>{s.role}</Td>
                <Td muted>{s.area}</Td>
                <Td mono>{s.present}</Td>
                <Td mono>{s.salary}</Td>
                <Td><Pill bg={s.bg} fg={s.fg}>{s.payout}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function RosterScreen({ view, onPublish }) {
  return (
    <>
      <PageHead tag="Module 9 · Duty Roster & Follow-up" title="Weekly duty roster" lead="Week of 24–30 Aug 2026. Every duty carries a follow-up owner; anything unverified by 6 pm escalates to the manager." action={onPublish ? <PrimaryButton onClick={onPublish}>Publish Roster</PrimaryButton> : null} />
      <Card padding="26px 30px" style={{ marginTop: 30, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <Th>Duty</Th>
              {view.days.map((d) => <Th key={d}>{d}</Th>)}
            </tr>
          </thead>
          <tbody>
            {view.rosterRows.map((r) => (
              <tr key={r.duty}>
                <Td nowrap>{r.duty}</Td>
                {r.cells.map((c, i) => (
                  <Td key={i}><span style={{ display: "inline-block", borderRadius: 7, padding: "6px 11px", font: "400 13px Lato,sans-serif", whiteSpace: "nowrap", background: c.bg, color: c.fg }}>{c.who}</span></Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Follow-up tracker</SectionTitle>
        <table>
          <thead><tr><Th>Task</Th><Th>Owner</Th><Th>Due</Th><Th>Verified by</Th><Th>Status</Th></tr></thead>
          <tbody>
            {view.followUps.map((f) => (
              <tr key={f.id || f.task}>
                <Td>{f.task}</Td>
                <Td muted>{f.owner}</Td>
                <Td>{f.due}</Td>
                <Td muted>{f.verifier}</Td>
                <Td><Pill bg={f.bg} fg={f.fg}>{f.status}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function VendorsScreen({ view, onAdd }) {
  return (
    <>
      <PageHead tag="Module 10 · Vendor Management" title="Vendors & contracts" lead="Nine empanelled vendors. Contracts, quotations, invoices and renewal dates in one place." action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Vendor</PrimaryButton> : null} />
      <Card padding="26px 30px" style={{ marginTop: 30 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Vendor register</SectionTitle>
        <table>
          <thead><tr><Th>Vendor</Th><Th>Service</Th><Th>Contact</Th><Th>Contract value</Th><Th>Renewal</Th><Th>Payment</Th></tr></thead>
          <tbody>
            {view.vendors.map((v) => (
              <tr key={v.id || v.name}>
                <Td>{v.name}</Td>
                <Td muted>{v.service}</Td>
                <Td mono muted style={{ fontSize: 14 }}>{v.phone}</Td>
                <Td mono>{v.value}</Td>
                <Td style={{ color: v.rtone }}>{v.renewal}</Td>
                <Td><Pill bg={v.bg} fg={v.fg}>{v.pay}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Open quotations</h2>
          {view.quotes.map((q) => (
            <div key={q.work} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: "1px solid #efece3" }}>
              <div>
                <div style={{ font: "400 15px Lato,sans-serif" }}>{q.work}</div>
                <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginTop: 3 }}>{q.vendors}</div>
              </div>
              <div style={{ font: "700 15px 'Source Serif 4',Georgia,serif", whiteSpace: "nowrap" }}>{q.range}</div>
            </div>
          ))}
        </Card>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Invoices awaiting payment</h2>
          {view.invoices.map((i) => (
            <div key={i.no} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: "1px solid #efece3" }}>
              <div>
                <div style={{ font: "400 15px Lato,sans-serif" }}>{i.no}</div>
                <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginTop: 3 }}>{i.who}</div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ font: "700 15px 'Source Serif 4',Georgia,serif" }}>{i.amount}</div>
                <div style={{ font: "400 13px Lato,sans-serif", color: i.tone, marginTop: 3 }}>{i.due}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function AssetsScreen({ view, onAdd }) {
  return (
    <>
      <PageHead tag="Module 11 · Asset Management" title="Asset register" lead="Every tagged asset with its location, purchase year, warranty and current condition." action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Asset</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.assetKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <table>
          <thead><tr><Th>Tag</Th><Th>Asset</Th><Th>Category</Th><Th>Location</Th><Th>Installed</Th><Th>Warranty / AMC</Th><Th>Condition</Th></tr></thead>
          <tbody>
            {view.assets.map((a) => (
              <tr key={a.id || a.tag}>
                <Td mono style={{ fontSize: 14 }}>{a.tag}</Td>
                <Td>{a.name}</Td>
                <Td muted>{a.category}</Td>
                <Td muted>{a.location}</Td>
                <Td>{a.installed}</Td>
                <Td muted>{a.amc}</Td>
                <Td><Pill bg={a.bg} fg={a.fg}>{a.condition}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function PpmScreen({ view }) {
  return (
    <>
      <PageHead tag="Module 12 · Preventive Maintenance" title="AMC & service schedule" lead="Reminders fire 15 days before a service is due. Every visit and breakdown is logged against the asset's history." />
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22, marginTop: 30, alignItems: "start" }}>
        <Card padding="26px 30px">
          <SectionTitle style={{ marginBottom: 20 }}>AMC contracts</SectionTitle>
          <table>
            <thead><tr><Th>Equipment</Th><Th>Vendor</Th><Th>Frequency</Th><Th>Next due</Th><Th>Status</Th></tr></thead>
            <tbody>
              {view.amc.map((a) => (
                <tr key={a.id || a.equip}>
                  <Td>{a.equip}</Td>
                  <Td muted>{a.vendor}</Td>
                  <Td muted>{a.freq}</Td>
                  <Td>{a.next}</Td>
                  <Td><Pill bg={a.bg} fg={a.fg}>{a.status}</Pill></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Reminders — next 30 days</h2>
            {view.reminders.map((r) => (
              <div key={r.what} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "13px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                <span>{r.what}</span><span style={{ color: r.tone, whiteSpace: "nowrap", fontSize: 14 }}>{r.when}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Breakdown history — Lift A</h2>
            {view.breakdowns.map((b) => (
              <div key={b.what} style={{ padding: "14px 0", borderTop: "1px solid #efece3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif" }}>
                  <span>{b.what}</span><span style={{ color: "#8a8a80", fontSize: 14, whiteSpace: "nowrap" }}>{b.when}</span>
                </div>
                <div style={{ font: "400 14px Lato,sans-serif", color: "#5f5f57", marginTop: 5 }}>{b.note}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

export function FacilityScreen({ view, onAdd }) {
  return (
    <>
      <PageHead tag="Module 13 · Facility Booking" title="Facility booking" lead="Residents book slots in the app; charges and refundable deposits post straight to the flat's ledger." action={onAdd ? <PrimaryButton onClick={onAdd}>+ New Booking</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 30 }}>
        {view.facilities.map((f) => (
          <Card key={f.name} padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ font: "700 18px/1 'Source Serif 4',Georgia,serif", margin: 0 }}>{f.name}</h2>
              <Pill compact bg={f.bg} fg={f.fg}>{f.state}</Pill>
            </div>
            <div style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80", margin: "10px 0 14px" }}>{f.capacity}</div>
            <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", color: "#5f5f57", paddingTop: 14, borderTop: "1px solid #efece3" }}>
              <span>{f.charge}</span><span>{f.next}</span>
            </div>
          </Card>
        ))}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Upcoming bookings</SectionTitle>
        <table>
          <thead><tr><Th>Facility</Th><Th>Flat</Th><Th>Date</Th><Th>Slot</Th><Th>Charge</Th><Th>Deposit</Th><Th>Payment</Th></tr></thead>
          <tbody>
            {view.bookings.map((b, i) => (
              <tr key={b.id || `${b.facility}-${b.flat}-${b.date}-${i}`}>
                <Td>{b.facility}</Td>
                <Td mono>{b.flat}</Td>
                <Td>{b.date}</Td>
                <Td muted>{b.slot}</Td>
                <Td mono>{b.charge}</Td>
                <Td mono muted>{b.deposit}</Td>
                <Td><Pill bg={b.bg} fg={b.fg}>{b.pay}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function ReportsScreen({ view, onExport }) {
  return (
    <>
      <PageHead tag="Module 14 · Reports & Dashboard" title="Reports" lead="Committee pack for August 2026 — collection, dues ageing, expense split, complaints and occupancy." action={onExport ? <SecondaryButton onClick={onExport}>Export pack (PDF)</SecondaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.reportKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22, alignItems: "start" }}>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Outstanding dues — ageing</h2>
          {view.ageing.map((a) => (
            <div key={a.bucket} style={{ padding: "13px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", marginBottom: 9 }}>
                <span>{a.bucket}</span><span style={{ font: "500 15px 'IBM Plex Mono',monospace" }}>{a.amount}</span>
              </div>
              <Bar pct={a.pct} color={a.tone} />
            </div>
          ))}
        </Card>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Expense split — August</h2>
          {view.expenseSplit.map((e) => (
            <div key={e.head} style={{ padding: "13px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", marginBottom: 9 }}>
                <span>{e.head}</span><span style={{ font: "500 15px 'IBM Plex Mono',monospace" }}>{e.amount}</span>
              </div>
              <Bar pct={e.pct} color="#1e6b52" />
            </div>
          ))}
        </Card>
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Block-wise summary</SectionTitle>
        <table>
          <thead><tr><Th>Block</Th><Th>Flats</Th><Th>Occupied</Th><Th>Billed</Th><Th>Collected</Th><Th>Collection %</Th><Th>Open complaints</Th></tr></thead>
          <tbody>
            {view.blockSummary.map((b) => (
              <tr key={b.block}>
                <Td>{b.block}</Td>
                <Td mono>{b.flats}</Td>
                <Td mono>{b.occupied}</Td>
                <Td mono>{b.billed}</Td>
                <Td mono>{b.collected}</Td>
                <Td mono style={{ fontWeight: 500, color: b.tone }}>{b.pct}</Td>
                <Td mono>{b.complaints}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
