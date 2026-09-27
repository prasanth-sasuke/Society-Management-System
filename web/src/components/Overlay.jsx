import { useEffect } from "react";

export default function ModalForm({ cfg, form, error, submitting, onChange, onClose, onSubmit }) {
  useEffect(() => {
    if (!cfg) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cfg, submitting, onClose]);

  if (!cfg) return null;
  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,38,45,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        zIndex: 50,
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "86vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(22,38,45,.24)",
        }}
      >
        <div style={{ padding: "26px 30px 20px", borderBottom: "1px solid #efece3" }}>
          <div style={{ font: "400 12px Lato,sans-serif", letterSpacing: ".08em", textTransform: "uppercase", color: "#8a8a80", marginBottom: 8 }}>
            {cfg.kicker}
          </div>
          <h2 style={{ font: "700 24px/1 'Source Serif 4',Georgia,serif", margin: 0 }}>{cfg.title}</h2>
        </div>
        <div className="modal-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "26px 30px" }}>
          {cfg.fields.map((f) => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ font: "400 13px Lato,sans-serif", color: "#5f5f57" }}>{f.label}</span>
              {f.options ? (
                <select
                  value={form[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  style={{
                    border: "1px solid #e0dccf",
                    background: "#fdfcf8",
                    borderRadius: 8,
                    padding: "11px 12px",
                    font: "400 15px Lato,sans-serif",
                    color: "#2a2a28",
                    width: "100%",
                  }}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || (f.key === "password" ? "password" : "text")}
                  required={Boolean(f.required)}
                  readOnly={Boolean(f.readOnly)}
                  value={form[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    border: "1px solid #e0dccf",
                    background: f.readOnly ? "#f3f1ea" : "#fdfcf8",
                    borderRadius: 8,
                    padding: "11px 14px",
                    font: "400 15px Lato,sans-serif",
                    color: "#2a2a28",
                    width: "100%",
                  }}
                />
              )}
            </label>
          ))}
        </div>
        {error ? (
          <div style={{ margin: "0 30px 16px", padding: "12px 14px", borderRadius: 8, background: "#fbe6d8", color: "#b0491a", font: "400 14px/1.4 Lato,sans-serif" }}>
            {error}
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "0 30px 26px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              border: "1px solid #e0dccf",
              background: "#fff",
              cursor: submitting ? "default" : "pointer",
              borderRadius: 9,
              padding: "12px 20px",
              font: "700 15px Lato,sans-serif",
              color: "#2a2a28",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              border: 0,
              cursor: submitting ? "default" : "pointer",
              background: "#1e6b52",
              color: "#fff",
              borderRadius: 9,
              padding: "12px 22px",
              font: "700 15px Lato,sans-serif",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Saving…" : cfg.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="app-toast"
      style={{
        position: "fixed",
        left: 300,
        bottom: 28,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 11,
        background: "#16262d",
        color: "#f2efe7",
        borderRadius: 10,
        padding: "14px 20px",
        font: "400 15px Lato,sans-serif",
        boxShadow: "0 12px 60px rgba(22,38,45,.28)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4fbf95" }} />
      {message}
    </div>
  );
}
