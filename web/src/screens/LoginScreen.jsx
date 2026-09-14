export default function LoginScreen({ societyName, error, submitting, onSubmit }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f3ed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "Lato,'Helvetica Neue',sans-serif",
        color: "#2a2a28",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #e8e4d9",
          borderRadius: 16,
          padding: "36px 34px 30px",
          boxShadow: "0 18px 40px rgba(22,38,45,.08)",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#1e6b52",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            💧
          </div>
          <div>
            <div style={{ font: "700 22px/1.15 'Source Serif 4',Georgia,serif" }}>{societyName}</div>
            <div style={{ font: "400 12px Lato,sans-serif", letterSpacing: ".12em", textTransform: "uppercase", color: "#8a8a80", marginTop: 4 }}>
              Society Operations Suite
            </div>
          </div>
        </div>
        <h1 style={{ font: "300 30px/1.2 Lato,sans-serif", margin: "0 0 8px" }}>Sign in</h1>
        <p style={{ font: "400 15px/1.5 Lato,sans-serif", color: "#5f5f57", margin: "0 0 22px" }}>
          Use your society login. Access follows the role permission matrix.
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#5f5f57" }}>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@greenfield.local"
            style={{
              border: "1px solid #e0dccf",
              background: "#fdfcf8",
              borderRadius: 8,
              padding: "12px 14px",
              font: "400 15px Lato,sans-serif",
              color: "#2a2a28",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
          <span style={{ font: "400 13px Lato,sans-serif", color: "#5f5f57" }}>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={{
              border: "1px solid #e0dccf",
              background: "#fdfcf8",
              borderRadius: 8,
              padding: "12px 14px",
              font: "400 15px Lato,sans-serif",
              color: "#2a2a28",
            }}
          />
        </label>
        {error ? (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 8, background: "#fbe6d8", color: "#b0491a", font: "400 14px/1.4 Lato,sans-serif" }}>
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            border: 0,
            cursor: submitting ? "default" : "pointer",
            background: "#1e6b52",
            color: "#fff",
            borderRadius: 9,
            padding: "13px 22px",
            font: "700 15px Lato,sans-serif",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
