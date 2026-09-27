import { Bar, Card, EditDelete, EmptyNote, EmptyTableNote, KpiCard, PageHead, Pill, PrimaryButton, SecondaryButton, SectionTitle, Td, Th } from "../components/ui.jsx";

export function HelpdeskScreen({ view, onAdd, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);
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
            <tr><Th>Ticket</Th><Th>Flat</Th><Th>Category</Th><Th>Complaint</Th><Th>Priority</Th><Th>Assigned to</Th><Th>Status</Th>{hasActions ? <Th /> : null}</tr>
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
                <Td><Pill bg={t.sbg} fg={t.sfg}>{t.status}</Pill></Td>
                {hasActions ? <Td><EditDelete row={t} onEdit={onEdit} onDelete={onDelete} editLabel="Update" /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 8 : 7}>No helpdesk tickets yet.</EmptyTableNote>}
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
          {view.feedback.length ? view.feedback.map((f) => (
            <div key={f.who} style={{ padding: "14px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif" }}>
                <span>{f.who}</span><span style={{ color: "#b8862a" }}>{f.stars}</span>
              </div>
              <div style={{ font: "400 14px/1.5 Lato,sans-serif", color: "#5f5f57", marginTop: 5 }}>{f.note}</div>
            </div>
          )) : <EmptyNote>No resident feedback yet.</EmptyNote>}
        </Card>
      </div>
    </>
  );
}

export function VendorsScreen({ view, onAdd, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);
  const count = view.vendors.length;
  const lead = count
    ? `${count} empanelled vendor${count === 1 ? "" : "s"}. Contracts, quotations, invoices and renewal dates in one place.`
    : "Contracts, quotations, invoices and renewal dates in one place.";
  return (
    <>
      <PageHead tag="Module 10 · Vendor Management" title="Vendors & contracts" lead={lead} action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Vendor</PrimaryButton> : null} />
      <Card padding="26px 30px" style={{ marginTop: 30 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Vendor register</SectionTitle>
        <table>
          <thead><tr><Th>Vendor</Th><Th>Service</Th><Th>Contact</Th><Th>Contract value</Th><Th>Renewal</Th><Th>Payment</Th>{hasActions ? <Th /> : null}</tr></thead>
          <tbody>
            {count ? view.vendors.map((v) => (
              <tr key={v.id || v.name}>
                <Td>{v.name}</Td>
                <Td muted>{v.service}</Td>
                <Td mono muted style={{ fontSize: 14 }}>{v.phone}</Td>
                <Td mono>{v.value}</Td>
                <Td style={{ color: v.rtone }}>{v.renewal}</Td>
                <Td><Pill bg={v.bg} fg={v.fg}>{v.pay}</Pill></Td>
                {hasActions ? <Td><EditDelete row={v} onEdit={onEdit} onDelete={onDelete} /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 7 : 6}>No vendors yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Open quotations</h2>
          {view.quotes.length ? view.quotes.map((q) => (
            <div key={q.work} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: "1px solid #efece3" }}>
              <div>
                <div style={{ font: "400 15px Lato,sans-serif" }}>{q.work}</div>
                <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginTop: 3 }}>{q.vendors}</div>
              </div>
              <div style={{ font: "700 15px 'Source Serif 4',Georgia,serif", whiteSpace: "nowrap" }}>{q.range}</div>
            </div>
          )) : <EmptyNote>No open quotations.</EmptyNote>}
        </Card>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 14px" }}>Invoices awaiting payment</h2>
          {view.invoices.length ? view.invoices.map((i) => (
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
          )) : <EmptyNote>No invoices awaiting payment.</EmptyNote>}
        </Card>
      </div>
    </>
  );
}

export function AssetsScreen({ view, onAdd, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);
  return (
    <>
      <PageHead tag="Module 11 · Asset Management" title="Asset register" lead="Every tagged asset with its location, purchase year, warranty and current condition." action={onAdd ? <PrimaryButton onClick={onAdd}>+ Add Asset</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.assetKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <table>
          <thead><tr><Th>Tag</Th><Th>Asset</Th><Th>Category</Th><Th>Location</Th><Th>Installed</Th><Th>Warranty / AMC</Th><Th>Condition</Th>{hasActions ? <Th /> : null}</tr></thead>
          <tbody>
            {view.assets.length ? view.assets.map((a) => (
              <tr key={a.id || a.tag}>
                <Td mono style={{ fontSize: 14 }}>{a.tag}</Td>
                <Td>{a.name}</Td>
                <Td muted>{a.category}</Td>
                <Td muted>{a.location}</Td>
                <Td>{a.installed}</Td>
                <Td muted>{a.amc}</Td>
                <Td><Pill bg={a.bg} fg={a.fg}>{a.condition}</Pill></Td>
                {hasActions ? <Td><EditDelete row={a} onEdit={onEdit} onDelete={onDelete} /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 8 : 7}>No assets tagged yet.</EmptyTableNote>}
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

export function FacilityScreen({ view, onAdd, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);
  return (
    <>
      <PageHead tag="Module 13 · Facility Booking" title="Facility booking" lead="Residents book slots in the app; charges and refundable deposits post straight to the flat's ledger." action={onAdd ? <PrimaryButton onClick={onAdd}>+ New Booking</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 30 }}>
        {view.facilities.length ? null : (
          <Card padding="22px 24px" style={{ gridColumn: "1 / -1" }}>
            <EmptyNote>No facilities yet. A facility appears here after its first booking.</EmptyNote>
          </Card>
        )}
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
          <thead><tr><Th>Facility</Th><Th>Flat</Th><Th>Date</Th><Th>Slot</Th><Th>Charge</Th><Th>Deposit</Th><Th>Payment</Th>{hasActions ? <Th /> : null}</tr></thead>
          <tbody>
            {view.bookings.length ? view.bookings.map((b, i) => (
              <tr key={b.id || `${b.facility}-${b.flat}-${b.date}-${i}`}>
                <Td>{b.facility}</Td>
                <Td mono>{b.flat}</Td>
                <Td>{b.date}</Td>
                <Td muted>{b.slot}</Td>
                <Td mono>{b.charge}</Td>
                <Td mono muted>{b.deposit}</Td>
                <Td><Pill bg={b.bg} fg={b.fg}>{b.pay}</Pill></Td>
                {hasActions ? <Td><EditDelete row={b} onEdit={onEdit} onDelete={onDelete} deleteLabel="Cancel" /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 8 : 7}>No bookings yet.</EmptyTableNote>}
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
          {view.ageing.length ? view.ageing.map((a) => (
            <div key={a.bucket} style={{ padding: "13px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", marginBottom: 9 }}>
                <span>{a.bucket}</span><span style={{ font: "500 15px 'IBM Plex Mono',monospace" }}>{a.amount}</span>
              </div>
              <Bar pct={a.pct} color={a.tone} />
            </div>
          )) : <EmptyNote>No outstanding dues.</EmptyNote>}
        </Card>
        <Card>
          <h2 style={{ font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: "0 0 18px" }}>Expense split — August</h2>
          {view.expenseSplit.length ? view.expenseSplit.map((e) => (
            <div key={e.head} style={{ padding: "13px 0", borderTop: "1px solid #efece3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 15px Lato,sans-serif", marginBottom: 9 }}>
                <span>{e.head}</span><span style={{ font: "500 15px 'IBM Plex Mono',monospace" }}>{e.amount}</span>
              </div>
              <Bar pct={e.pct} color="#1e6b52" />
            </div>
          )) : <EmptyNote>No expenses recorded yet.</EmptyNote>}
        </Card>
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <SectionTitle style={{ marginBottom: 20 }}>Block-wise summary</SectionTitle>
        <table>
          <thead><tr><Th>Block</Th><Th>Flats</Th><Th>Occupied</Th><Th>Billed</Th><Th>Collected</Th><Th>Collection %</Th><Th>Open complaints</Th></tr></thead>
          <tbody>
            {view.blockSummary.length ? view.blockSummary.map((b) => (
              <tr key={b.block}>
                <Td>{b.block}</Td>
                <Td mono>{b.flats}</Td>
                <Td mono>{b.occupied}</Td>
                <Td mono>{b.billed}</Td>
                <Td mono>{b.collected}</Td>
                <Td mono style={{ fontWeight: 500, color: b.tone }}>{b.pct}</Td>
                <Td mono>{b.complaints}</Td>
              </tr>
            )) : <EmptyTableNote colSpan={7}>No blocks in the register yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
