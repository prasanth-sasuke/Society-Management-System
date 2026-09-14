export function Pill({ children, bg, fg, compact }) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: compact ? "4px 12px" : "5px 13px",
        font: compact ? "400 12px Lato,sans-serif" : "400 13px Lato,sans-serif",
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function ModuleTag({ children }) {
  return (
    <div
      style={{
        display: "inline-block",
        background: "#e3efe8",
        color: "#1e6b52",
        borderRadius: 999,
        padding: "6px 15px",
        font: "400 13px Lato,sans-serif",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children }) {
  return (
    <h1 style={{ font: "300 36px/1.15 Lato,sans-serif", margin: "0 0 12px", letterSpacing: "-.01em" }}>
      {children}
    </h1>
  );
}

export function PageLead({ children, maxWidth = 700 }) {
  return (
    <p style={{ font: "300 17px/1.5 Lato,sans-serif", color: "#5f5f57", margin: 0, maxWidth, textWrap: "pretty" }}>
      {children}
    </p>
  );
}

export function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        cursor: "pointer",
        background: "#1e6b52",
        color: "#fff",
        borderRadius: 9,
        padding: "13px 22px",
        font: "700 15px Lato,sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid #e0dccf",
        background: "#fff",
        cursor: "pointer",
        borderRadius: 9,
        padding: "13px 22px",
        font: "700 15px Lato,sans-serif",
        color: "#2a2a28",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, padding = "26px 28px", style }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e4d9",
        borderRadius: 12,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return (
    <h2 style={{ font: "700 21px/1 'Source Serif 4',Georgia,serif", margin: 0, ...style }}>
      {children}
    </h2>
  );
}

export function KpiCard({ label, value, note, tone, compact }) {
  return (
    <Card padding="22px 24px 20px">
      <div style={{ font: "400 11px/1 Lato,sans-serif", letterSpacing: ".1em", textTransform: "uppercase", color: "#8a8a80" }}>
        {label}
      </div>
      <div style={{ font: `700 ${compact ? 30 : 33}px/1.1 'Source Serif 4',Georgia,serif`, margin: note ? "14px 0 10px" : "14px 0 0" }}>
        {value}
      </div>
      {note ? <div style={{ font: "400 13px Lato,sans-serif", color: tone }}>{note}</div> : null}
    </Card>
  );
}

export function Th({ children, center }) {
  return (
    <th
      style={{
        textAlign: center ? "center" : "left",
        font: "400 11px Lato,sans-serif",
        letterSpacing: ".09em",
        textTransform: "uppercase",
        color: "#8a8a80",
        padding: center ? "0 12px 14px" : "0 14px 14px 0",
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, mono, muted, nowrap, style }) {
  return (
    <td
      style={{
        font: `${mono ? "400 15px 'IBM Plex Mono',monospace" : "400 15px Lato,sans-serif"}`,
        padding: "14px 14px 14px 0",
        borderTop: "1px solid #efece3",
        color: muted ? "#5f5f57" : undefined,
        whiteSpace: nowrap ? "nowrap" : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function PageHead({ tag, title, lead, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
      <div>
        {tag ? <ModuleTag>{tag}</ModuleTag> : null}
        <PageTitle>{title}</PageTitle>
        {lead ? <PageLead>{lead}</PageLead> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyNote({ children }) {
  return (
    <div style={{ font: "400 15px Lato,sans-serif", color: "#8a8a80", padding: "8px 0" }}>
      {children}
    </div>
  );
}

export function EmptyTableNote({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "22px 0", color: "#8a8a80", font: "400 15px Lato,sans-serif" }}>
        {children}
      </td>
    </tr>
  );
}

export function Bar({ pct, color }) {
  return (
    <div style={{ height: 7, borderRadius: 4, background: "#efece3", overflow: "hidden" }}>
      <div style={{ height: 7, borderRadius: 4, width: pct, background: color }} />
    </div>
  );
}
