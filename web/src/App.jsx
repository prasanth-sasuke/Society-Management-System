import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ModalForm, { Toast } from "./components/Overlay.jsx";
import { approveVoucherRequest, createRecord, fetchCatalog, fetchSession, formatApiError, loginRequest, logoutRequest, toastForCreate } from "./api.js";
import { CREATE_MODULE, canOpenScreen, canWrite, clearToken, getToken, setToken } from "./auth.js";
import { DEFAULT_SETTINGS, emptyForm, MODALS } from "./data.js";
import { buildViewFromApi } from "./viewFromApi.js";
import LoginScreen from "./screens/LoginScreen.jsx";
import {
  AccessScreen,
  AccountsScreen,
  BillsScreen,
  BlocksScreen,
  HomeScreen,
  ResidentsScreen,
} from "./screens/PropertyScreens.jsx";
import {
  AssetsScreen,
  FacilityScreen,
  HelpdeskScreen,
  PpmScreen,
  ReportsScreen,
  RosterScreen,
  SecurityScreen,
  StaffScreen,
  VendorsScreen,
} from "./screens/OperationsScreens.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState(getToken() ? "checking" : "guest");
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [screen, setScreen] = useState("home");
  const [catalog, setCatalog] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const permissions = session?.permissions || {};
  const permissionsRef = useRef(permissions);
  permissionsRef.current = permissions;

  const load = useCallback(async (isRefresh = false, nextPermissions) => {
    const perms = nextPermissions || permissionsRef.current;
    if (!isRefresh) {
      setLoadState("loading");
      setLoadError(null);
    }
    try {
      const data = await fetchCatalog(perms);
      setCatalog(data);
      setLoadState("ready");
      setLoadError(null);
      if (data._failed?.length) {
        setToast(`Some modules could not be refreshed: ${data._failed.join(", ")}.`);
      }
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        setSession(null);
        setAuthState("guest");
        setCatalog(null);
        return;
      }
      const message = formatApiError(err);
      if (isRefresh) {
        setToast(message);
        return;
      }
      setCatalog(null);
      setLoadError(message);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (authState !== "checking") return undefined;
    let cancelled = false;
    fetchSession()
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setAuthState("in");
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setSession(null);
        setAuthState("guest");
      });
    return () => {
      cancelled = true;
    };
  }, [authState]);

  useEffect(() => {
    if (authState !== "in" || !session) return undefined;
    load(false, session.permissions);
    return undefined;
  }, [authState, session, load]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const view = useMemo(
    () => (catalog
      ? buildViewFromApi(catalog, permissions)
      : { societyName: DEFAULT_SETTINGS.societyName, syncOk: false, homeKpis: [], homeComplaints: [], homeStaff: [], homeEvents: [], attention: [], chart: [] }),
    [catalog, permissions],
  );

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const data = await loginRequest(String(formData.get("email") || ""), String(formData.get("password") || ""));
      setToken(data.token);
      setSession(data);
      setAuthState("in");
      setScreen("home");
      setCatalog(null);
    } catch (err) {
      setLoginError(formatApiError(err));
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleLogout() {
    await logoutRequest();
    clearToken();
    setSession(null);
    setAuthState("guest");
    setCatalog(null);
    setScreen("home");
  }

  function go(id) {
    if (!canOpenScreen(permissions, id)) return;
    setScreen(id);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }

  function openModal(kind, preset = {}) {
    if (!canWrite(permissions, CREATE_MODULE[kind])) return;
    setForm({ ...emptyForm(kind), ...preset });
    setFormError(null);
    setModal(kind);
  }

  function openPayment(bill) {
    openModal("payment", {
      billId: bill.id,
      billLabel: `${bill.flat} · ${bill.period} · ${bill.remaining} due`,
      amount: String(bill.remainingAmount ?? ""),
    });
  }

  function printReceipt(societyName, receipt) {
    const win = window.open("", "_blank", "width=640,height=720");
    if (!win) {
      setToast("Allow pop-ups for this site to print the receipt.");
      return;
    }
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    win.document.write(`<!doctype html><html><head><title>${esc(receipt.receiptNo)}</title>
<style>body{font:15px/1.6 Georgia,serif;color:#2a2a28;padding:40px;max-width:520px;margin:auto}h1{font-size:22px;margin:0 0 4px}.muted{color:#6f6f68}.row{display:flex;justify-content:space-between;border-top:1px solid #e8e4d9;padding:10px 0}.total{font-weight:700;font-size:18px}</style>
</head><body>
<h1>${esc(societyName)}</h1><div class="muted">Maintenance receipt</div><br>
<div class="row"><span>Receipt no.</span><span>${esc(receipt.receiptNo)}</span></div>
<div class="row"><span>Date</span><span>${esc(receipt.paidOn)}</span></div>
<div class="row"><span>Flat</span><span>${esc(receipt.flat)}</span></div>
<div class="row"><span>Resident</span><span>${esc(receipt.resident)}</span></div>
<div class="row"><span>Billing period</span><span>${esc(receipt.period)}</span></div>
<div class="row"><span>Paid via</span><span>${esc(receipt.mode)}</span></div>
<div class="row total"><span>Amount paid</span><span>${esc(receipt.amount)}</span></div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  async function approveVoucher(voucher) {
    try {
      const updated = await approveVoucherRequest(voucher.id);
      setToast(`${updated.no} approved — ${updated.amount} now counts as spent.`);
      await load(true);
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        setSession(null);
        setAuthState("guest");
        return;
      }
      setToast(formatApiError(err));
    }
  }

  const closeModal = useCallback(() => {
    if (submitting) return;
    setModal(null);
    setForm({});
    setFormError(null);
  }, [submitting]);

  async function submitModal() {
    if (!modal || submitting) return;
    const missing = MODALS[modal].fields.filter((field) => field.required && !String(form[field.key] || "").trim());
    if (missing.length) {
      setFormError(`Please fill in ${missing.map((field) => field.label).join(", ")}.`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createRecord(modal, form);
      setToast(toastForCreate(modal, created));
      setModal(null);
      setForm({});
      await load(true);
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        setSession(null);
        setAuthState("guest");
        return;
      }
      setFormError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (authState === "guest") {
    return (
      <LoginScreen
        societyName={DEFAULT_SETTINGS.societyName}
        error={loginError}
        submitting={loginSubmitting}
        onSubmit={handleLogin}
      />
    );
  }

  if (authState === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ed", padding: 48, font: "400 16px Lato,sans-serif", color: "#5f5f57" }}>
        Checking your session…
      </div>
    );
  }

  const write = (moduleName) => canWrite(permissions, moduleName);
  const screens = {
    home: <HomeScreen view={view} />,
    blocks: <BlocksScreen view={view} onAdd={write("property") ? () => openModal("flat") : null} />,
    residents: <ResidentsScreen view={view} onAdd={write("residents") ? () => openModal("resident") : null} />,
    access: <AccessScreen view={view} onAdd={write("users") ? () => openModal("user") : null} />,
    bills: (
      <BillsScreen
        view={view}
        onGenerate={write("billing") ? () => openModal("billGenerate") : null}
        onPay={write("billing") ? openPayment : null}
        onReceipt={view.receiptPreview ? () => printReceipt(view.societyName, view.receiptPreview) : null}
      />
    ),
    accounts: (
      <AccountsScreen
        view={view}
        onAdd={write("finance") ? () => openModal("voucher") : null}
        onApprove={write("finance") ? approveVoucher : null}
      />
    ),
    helpdesk: <HelpdeskScreen view={view} onAdd={write("helpdesk") ? () => openModal("ticket") : null} />,
    security: <SecurityScreen view={view} />,
    staff: <StaffScreen view={view} onAttendance={write("staff") ? () => setToast("Attendance saved for 27 Aug — 12 present, 1 leave, 1 absent.") : null} />,
    roster: <RosterScreen view={view} onPublish={write("staff") ? () => setToast("Roster published for 24–30 Aug — 14 staff notified.") : null} />,
    vendors: <VendorsScreen view={view} onAdd={write("vendors") ? () => openModal("vendor") : null} />,
    assets: <AssetsScreen view={view} onAdd={write("vendors") ? () => openModal("asset") : null} />,
    ppm: <PpmScreen view={view} />,
    facility: <FacilityScreen view={view} onAdd={write("facility") ? () => openModal("booking") : null} />,
    reports: <ReportsScreen view={view} onExport={write("reports") ? () => setToast("Committee pack for Aug 2026 queued for export.") : null} />,
  };

  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        alignItems: "flex-start",
        minHeight: "100vh",
        background: "#f5f3ed",
        fontFamily: "Lato,'Helvetica Neue',sans-serif",
        color: "#2a2a28",
      }}
    >
      {menuOpen ? <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
      <div className="mobile-bar">
        <button type="button" className="menu-toggle" onClick={() => setMenuOpen(true)}>Menu</button>
        <span>{view.societyName}</span>
      </div>
      <Sidebar
        societyName={view.societyName}
        screen={screen}
        onGo={go}
        permissions={permissions}
        user={session.user}
        onLogout={handleLogout}
        open={menuOpen}
      />
      <main className="app-main" style={{ flex: 1, minWidth: 0, padding: "36px 44px 80px", maxWidth: 1560 }}>
        {loadState === "error" ? (
          <div style={{ background: "#fff", border: "1px solid #e8e4d9", borderRadius: 12, padding: "28px 30px", maxWidth: 640 }}>
            <h1 style={{ font: "700 24px/1.2 'Source Serif 4',Georgia,serif", margin: "0 0 10px" }}>Could not load society data</h1>
            <p style={{ font: "400 16px/1.5 Lato,sans-serif", color: "#5f5f57", margin: "0 0 18px" }}>{loadError}</p>
            <button
              type="button"
              onClick={() => load(false)}
              style={{
                border: 0,
                cursor: "pointer",
                background: "#1e6b52",
                color: "#fff",
                borderRadius: 9,
                padding: "12px 20px",
                font: "700 15px Lato,sans-serif",
              }}
            >
              Retry
            </button>
          </div>
        ) : loadState === "loading" && !catalog ? (
          <div style={{ font: "400 16px Lato,sans-serif", color: "#5f5f57" }}>Loading society records from the server…</div>
        ) : canOpenScreen(permissions, screen) ? (
          screens[screen]
        ) : (
          <div style={{ font: "400 16px Lato,sans-serif", color: "#5f5f57" }}>You do not have access to this module.</div>
        )}
      </main>
      <ModalForm
        cfg={modal ? MODALS[modal] : null}
        form={form}
        error={formError}
        submitting={submitting}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onClose={closeModal}
        onSubmit={submitModal}
      />
      <Toast message={toast} />
    </div>
  );
}
