import { useEffect, useState } from "react";
import { formatApiError } from "../api.js";
import { Card, EditDelete, EmptyNote, EmptyTableNote, KpiCard, PageHead, Pill, PrimaryButton, RowActions, SectionTitle, Td, Th, dangerButton, rowButton } from "../components/ui.jsx";

const cardTitle = { font: "700 20px/1 'Source Serif 4',Georgia,serif", margin: 0 };

function CardHead({ title, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <h2 style={cardTitle}>{title}</h2>
      {children ? <RowActions>{children}</RowActions> : null}
    </div>
  );
}

function SmallButton({ children, onClick, danger }) {
  return <button type="button" style={danger ? dangerButton : rowButton} onClick={onClick}>{children}</button>;
}

function plural(n, word, many = `${word}s`) {
  return `${n} ${n === 1 ? word : many}`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SecurityScreen({ view, actions }) {
  const openIncidents = view.incidents.filter((i) => i.status === "Under review").length;
  const lead = view.shifts.length
    ? `${plural(view.shifts.length, "shift")}, ${plural(view.guards.length, "guard entry", "guard entries")} today${openIncidents ? `, ${plural(openIncidents, "incident")} under review` : ""}.`
    : "Set up your guard shifts, then log daily attendance, handovers, patrol rounds and incidents.";
  return (
    <>
      <PageHead tag="Module 7 · Security Management" title="Security & gate operations" lead={lead} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 14 }}>
        <SectionTitle>Shifts</SectionTitle>
        {actions ? <SmallButton onClick={actions.addShift}>+ Add shift</SmallButton> : null}
      </div>
      {view.shifts.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {view.shifts.map((s) => (
            <Card key={s.id || s.name} padding="22px 24px">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ font: "700 18px/1 'Source Serif 4',Georgia,serif" }}>{s.name}</div>
                <Pill compact bg={s.bg} fg={s.fg}>{s.state}</Pill>
              </div>
              <div style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80", margin: "9px 0 14px" }}>{s.hours}</div>
              <div style={{ font: "400 15px/1.6 Lato,sans-serif", color: "#5f5f57" }}>{s.staff}</div>
              {actions ? <div style={{ marginTop: 14 }}><EditDelete row={s} onEdit={actions.editShift} onDelete={actions.removeShift} /></div> : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="22px 24px"><EmptyNote>No shifts yet.</EmptyNote></Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 22, marginTop: 22, alignItems: "start" }}>
        <Card padding="26px 30px">
          <CardHead title={`Guard attendance — ${view.securityToday || "today"}`}>
            {actions ? <SmallButton onClick={actions.addGuard}>+ Add entry</SmallButton> : null}
          </CardHead>
          <table>
            <thead><tr><Th>Guard</Th><Th>Post</Th><Th>Shift</Th><Th>In / Out</Th><Th>Status</Th>{actions ? <Th /> : null}</tr></thead>
            <tbody>
              {view.guards.length ? view.guards.map((g) => (
                <tr key={g.id || g.name}>
                  <Td>{g.name}</Td>
                  <Td muted>{g.post}</Td>
                  <Td>{g.shift}</Td>
                  <Td mono muted style={{ fontSize: 14 }}>{g.times}</Td>
                  <Td><Pill bg={g.bg} fg={g.fg}>{g.status}</Pill></Td>
                  {actions ? <Td><EditDelete row={g} onEdit={actions.editGuard} onDelete={actions.removeGuard} /></Td> : null}
                </tr>
              )) : <EmptyTableNote colSpan={actions ? 6 : 5}>No guard attendance logged today.</EmptyTableNote>}
            </tbody>
          </table>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card>
            <CardHead title="Shift handover notes">
              {actions ? <SmallButton onClick={actions.addHandover}>+ Add note</SmallButton> : null}
            </CardHead>
            {view.handover.length ? view.handover.map((h) => (
              <div key={h.id || h.when} style={{ padding: "14px 0", borderTop: "1px solid #efece3", display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80", marginBottom: 5 }}>{h.when}</div>
                  <div style={{ font: "400 15px/1.5 Lato,sans-serif" }}>{h.note}</div>
                </div>
                {actions ? <div><SmallButton danger onClick={() => actions.removeHandover(h)}>Delete</SmallButton></div> : null}
              </div>
            )) : <EmptyNote>No handover notes yet.</EmptyNote>}
          </Card>
          <Card>
            <CardHead title="Patrol checklist">
              {actions && view.patrol.length ? <SmallButton onClick={actions.resetPatrol}>New round</SmallButton> : null}
              {actions ? <SmallButton onClick={actions.addPatrol}>+ Add checkpoint</SmallButton> : null}
            </CardHead>
            {view.patrol.length ? view.patrol.map((p) => (
              <div key={p.id || p.point} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderTop: "1px solid #efece3", font: "400 15px Lato,sans-serif" }}>
                <span>{p.point}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: p.tone, fontSize: 14 }}>{p.mark}</span>
                  {actions ? <EditDelete row={p} onEdit={actions.editPatrol} onDelete={actions.removePatrol} editLabel="Update" /> : null}
                </span>
              </div>
            )) : <EmptyNote>No patrol checkpoints yet.</EmptyNote>}
          </Card>
        </div>
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <CardHead title="Incident register">
          {actions ? <SmallButton onClick={actions.addIncident}>+ Report incident</SmallButton> : null}
        </CardHead>
        {view.incidents.length ? view.incidents.map((i) => (
          <div key={i.id || i.what} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "15px 0", borderBottom: "1px solid #efece3" }}>
            <div style={{ font: "400 15px Lato,sans-serif" }}>{i.what}</div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", whiteSpace: "nowrap" }}>
              <span style={{ font: "400 14px Lato,sans-serif", color: "#8a8a80" }}>{i.when}</span>
              <Pill bg={i.bg} fg={i.fg}>{i.status}</Pill>
              {actions ? <EditDelete row={i} onEdit={actions.editIncident} onDelete={actions.removeIncident} editLabel="Update" /> : null}
            </div>
          </div>
        )) : <EmptyNote>No incidents recorded.</EmptyNote>}
      </Card>
    </>
  );
}

const DAY_STATUSES = ["Present", "Half day", "Leave", "Absent"];

function AttendanceSheet({ staffCount, onLoad, onSave }) {
  const [date, setDate] = useState(todayIso);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    onLoad(date)
      .then((data) => {
        if (cancelled) return;
        setRows(data.rows);
        setError(null);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(formatApiError(err));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [date, onLoad, staffCount]);

  function setRow(staffId, value) {
    setRows((prev) => prev.map((r) => (r.staffId === staffId ? { ...r, status: value } : r)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(date, rows.map((r) => ({ staffId: r.staffId, status: r.status })));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const selectStyle = { border: "1px solid #e0dccf", background: "#fdfcf8", borderRadius: 8, padding: "8px 10px", font: "400 14px Lato,sans-serif" };
  return (
    <Card padding="26px 30px" style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <SectionTitle>Mark attendance</SectionTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" value={date} max={todayIso()} onChange={(e) => e.target.value && setDate(e.target.value)} style={selectStyle} />
          <SmallButton onClick={() => setRows((prev) => prev.map((r) => ({ ...r, status: "Present" })))}>Mark all present</SmallButton>
        </div>
      </div>
      {status === "loading" ? <EmptyNote>Loading attendance…</EmptyNote> : null}
      {status === "ready" ? (
        <table>
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Attendance</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.staffId}>
                <Td>{r.name}</Td>
                <Td muted>{r.role}</Td>
                <Td>
                  <select value={r.status} onChange={(e) => setRow(r.staffId, e.target.value)} style={selectStyle}>
                    <option value="">Not marked</option>
                    {DAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {error ? <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: "#fbe6d8", color: "#b0491a", font: "400 14px/1.4 Lato,sans-serif" }}>{error}</div> : null}
      {status === "ready" ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <PrimaryButton onClick={saving ? undefined : save}>{saving ? "Saving…" : "Save attendance"}</PrimaryButton>
        </div>
      ) : null}
    </Card>
  );
}

export function StaffScreen({ view, actions }) {
  const count = view.staffRows.length;
  const hasActions = Boolean(actions);
  const lead = count
    ? `${plural(count, "person", "people")} on the society payroll. Mark attendance daily; present days count from the 1st of the month.`
    : "Add your housekeeping, maintenance, gardening and office staff, then mark attendance daily.";
  return (
    <>
      <PageHead tag="Module 8 · Staff Management" title="Staff, attendance & salary" lead={lead} action={actions ? <PrimaryButton onClick={actions.add}>+ Add staff</PrimaryButton> : null} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22, marginTop: 30 }}>
        {view.staffKpis.map((k) => <KpiCard key={k.label} compact {...k} />)}
      </div>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <SectionTitle>Staff register</SectionTitle>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#8a8a80" }}>{view.staffMonth}</span>
        </div>
        <table>
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Duty area</Th><Th>Today</Th><Th>Present</Th><Th>Salary</Th><Th>Payout</Th>{hasActions ? <Th /> : null}</tr></thead>
          <tbody>
            {count ? view.staffRows.map((s) => (
              <tr key={s.id || s.name}>
                <Td>{s.name}</Td>
                <Td>{s.role}</Td>
                <Td muted>{s.area}</Td>
                <Td muted>{s.today || "—"}</Td>
                <Td mono>{s.present}</Td>
                <Td mono>{s.salary}</Td>
                <Td><Pill bg={s.bg} fg={s.fg}>{s.payout}</Pill></Td>
                {hasActions ? <Td><EditDelete row={s} onEdit={actions.edit} onDelete={actions.remove} /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 8 : 7}>No staff yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      {actions && count ? <AttendanceSheet staffCount={count} onLoad={actions.loadAttendance} onSave={actions.saveAttendance} /> : null}
    </>
  );
}

export function RosterScreen({ view, actions }) {
  const hasActions = Boolean(actions);
  const lead = view.rosterRows.length
    ? `A standing weekly roster with ${plural(view.rosterRows.length, "duty", "duties")}. Every task below carries an owner and someone who verifies it.`
    : "Build a standing weekly roster: one row per duty, a name for each day (blank means Off).";
  return (
    <>
      <PageHead tag="Module 9 · Duty Roster & Follow-up" title="Weekly duty roster" lead={lead} action={actions ? <PrimaryButton onClick={actions.addDuty}>+ Add duty</PrimaryButton> : null} />
      <Card padding="26px 30px" style={{ marginTop: 30, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <Th>Duty</Th>
              {view.days.map((d) => <Th key={d}>{d}</Th>)}
              {hasActions ? <Th /> : null}
            </tr>
          </thead>
          <tbody>
            {view.rosterRows.length ? view.rosterRows.map((r) => (
              <tr key={r.id || r.duty}>
                <Td nowrap>{r.duty}</Td>
                {r.cells.map((c, i) => (
                  <Td key={i}><span style={{ display: "inline-block", borderRadius: 7, padding: "6px 11px", font: "400 13px Lato,sans-serif", whiteSpace: "nowrap", background: c.bg, color: c.fg }}>{c.who}</span></Td>
                ))}
                {hasActions ? <Td><EditDelete row={r} onEdit={actions.editDuty} onDelete={actions.removeDuty} /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={view.days.length + (hasActions ? 2 : 1)}>No duties on the roster yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
      <Card padding="26px 30px" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <SectionTitle>Follow-up tracker</SectionTitle>
          {actions ? <SmallButton onClick={actions.addFollowUp}>+ Add follow-up</SmallButton> : null}
        </div>
        <table>
          <thead><tr><Th>Task</Th><Th>Owner</Th><Th>Due</Th><Th>Verified by</Th><Th>Status</Th>{hasActions ? <Th /> : null}</tr></thead>
          <tbody>
            {view.followUps.length ? view.followUps.map((f) => (
              <tr key={f.id || f.task}>
                <Td>{f.task}</Td>
                <Td muted>{f.owner}</Td>
                <Td style={f.overdue ? { color: "#b0491a", fontWeight: 700 } : undefined}>{f.due}{f.overdue ? " · overdue" : ""}</Td>
                <Td muted>{f.verifier}</Td>
                <Td><Pill bg={f.bg} fg={f.fg}>{f.status}</Pill></Td>
                {hasActions ? <Td><EditDelete row={f} onEdit={actions.editFollowUp} onDelete={actions.removeFollowUp} editLabel="Update" /></Td> : null}
              </tr>
            )) : <EmptyTableNote colSpan={hasActions ? 6 : 5}>No follow-ups yet.</EmptyTableNote>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
