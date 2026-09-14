import { NAV } from "../data.js";
import { SCREEN_MODULE, canRead } from "../auth.js";

export default function Sidebar({ societyName, screen, onGo, permissions, user, onLogout, open }) {
  return (
    <aside
      className={`app-sidebar${open ? " is-open" : ""}`}
      style={{
        width: 272,
        flex: "0 0 272px",
        alignSelf: "stretch",
        background: "#16262d",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        paddingBottom: 30,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "26px 24px 24px", borderBottom: "1px solid #24383f" }}>
        <div
          style={{
            width: 34,
            height: 34,
            flex: "0 0 34px",
            borderRadius: 9,
            background: "#1e6b52",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
          }}
        >
          💧
        </div>
        <div>
          <div style={{ font: "700 21px/1.15 'Source Serif 4',Georgia,serif", color: "#f7f5ef" }}>{societyName}</div>
          <div style={{ font: "400 10px/1.4 Lato,sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d9099", marginTop: 5 }}>
            Society Operations Suite
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "20px 14px 0" }}>
        {NAV.map((group) => {
          const items = group.items.filter(([id]) => canRead(permissions, SCREEN_MODULE[id]));
          if (!items.length) return null;
          return (
          <div key={group.title}>
            <div style={{ font: "400 10px/1 Lato,sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "#6d8189", padding: "18px 12px 10px" }}>
              {group.title}
            </div>
            {items.map(([id, icon, label]) => {
              const active = screen === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onGo(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    border: 0,
                    cursor: "pointer",
                    borderRadius: 9,
                    padding: "11px 12px",
                    font: "400 15px/1.2 Lato,sans-serif",
                    background: active ? "#1e6b52" : "transparent",
                    color: active ? "#ffffff" : "#c6d2d7",
                  }}
                >
                  <span style={{ fontSize: 15, width: 19, textAlign: "center" }}>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          );
        })}
      </nav>
      {user ? (
        <div style={{ marginTop: "auto", padding: "22px 18px 0" }}>
          <div style={{ borderTop: "1px solid #24383f", padding: "18px 8px 0" }}>
            <div style={{ font: "700 14px Lato,sans-serif", color: "#f7f5ef" }}>{user.fullName}</div>
            <div style={{ font: "400 12px Lato,sans-serif", color: "#7d9099", marginTop: 4 }}>{user.roleLabel}</div>
            <button
              type="button"
              onClick={onLogout}
              style={{
                marginTop: 12,
                border: "1px solid #24383f",
                background: "transparent",
                color: "#c6d2d7",
                cursor: "pointer",
                borderRadius: 8,
                padding: "8px 12px",
                font: "700 13px Lato,sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
