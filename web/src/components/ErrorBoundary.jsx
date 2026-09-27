import React from "react";

// Shows a message instead of a blank page if a screen crashes while rendering.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f3ed", font: "400 16px Lato,sans-serif", color: "#2a2a28", padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ font: "700 26px 'Source Serif 4',Georgia,serif", margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#5f5f57", lineHeight: 1.5, margin: "0 0 22px" }}>
            This screen hit an unexpected error. Your data is safe on the server. Reload the page to continue.
          </p>
          <button type="button" onClick={() => window.location.reload()} style={{ background: "#1e6b52", color: "#fff", border: 0, borderRadius: 10, padding: "12px 22px", font: "700 15px Lato,sans-serif", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
