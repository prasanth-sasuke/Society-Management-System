import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ModalForm, { Toast } from "./components/Overlay.jsx";
import {
  approveVoucherRequest,
  createRecord,
  deleteRecord,
  fetchAttendance,
  fetchCatalog,
  fetchSession,
  formatApiError,
  loginRequest,
  logoutRequest,
  amcServicedRequest,
  moveOutResidentRequest,
  payInvoiceRequest,
  resetPatrolRequest,
  saveAttendance,
  toastForCreate,
} from "./api.js";
import { CREATE_MODULE, canOpenScreen, canWrite, clearToken, getToken, setToken } from "./auth.js";
import { DEFAULT_SETTINGS, emptyForm, MODALS, resolveModal } from "./data.js";
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
  VendorsScreen,
} from "./screens/OperationsScreens.jsx";
import { RosterScreen, SecurityScreen, StaffScreen } from "./screens/StaffSecurityScreens.jsx";

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
    setForm({ ...emptyForm(kind, view), ...preset });
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

  async function runAction(action, message) {
    try {
      const result = await action();
      setToast(typeof message === "function" ? message(result) : message);
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

  function approveVoucher(voucher) {
    runAction(() => approveVoucherRequest(voucher.id), (v) => `${v.no} approved — ${v.amount} now counts as spent.`);
  }

  const blankDash = (value) => (value && value !== "—" ? String(value) : "");

  function editFlat(row) {
    openModal("flatEdit", {
      id: row.id,
      flat: row.flat,
      type: row.type,
      carpet: blankDash(row.carpet),
      uds: blankDash(row.uds),
      parking: String(row.parking ?? 0),
      status: row.status,
    });
  }

  function deleteFlat(row) {
    if (!window.confirm(`Delete flat ${row.flat}? This can't be undone.`)) return;
    runAction(() => deleteRecord("flat", row.id), (r) => `Flat ${r.flat} deleted.`);
  }

  function editResident(row) {
    openModal("residentEdit", {
      id: row.id,
      name: row.name,
      flat: row.flat,
      type: row.type,
      family: String(parseInt(row.family, 10) || ""),
      phone: row.phone,
      emergency: blankDash(row.emergency),
      since: blankDash(row.since),
    });
  }

  function moveOutResident(row) {
    if (!window.confirm(`Mark ${row.name} as moved out of ${row.flat}?`)) return;
    runAction(() => moveOutResidentRequest(row.id), (r) => `${r.name} moved out of ${r.flat}.`);
  }

  function editBill(row) {
    openModal("billEdit", {
      id: row.id,
      flat: row.flat,
      period: row.period,
      amount: String(row.maintAmount ?? ""),
      special: row.specialAmount ? String(row.specialAmount) : "",
      dueOn: row.dueOn,
    });
  }

  function deleteBill(row) {
    if (!window.confirm(`Delete the ${row.period} bill for ${row.flat}?`)) return;
    runAction(() => deleteRecord("bill", row.id), (r) => `${r.flat} bill for ${r.period} deleted.`);
  }

  function editTicket(row) {
    openModal("ticketEdit", {
      id: row.dbId,
      ticketNo: row.id,
      flat: row.flat,
      category: row.category,
      text: row.text,
      priority: row.priority,
      owner: row.owner,
      status: row.status,
      note: "",
    });
  }

  function deleteTicket(row) {
    if (!window.confirm(`Delete ticket ${row.id} and its history?`)) return;
    runAction(() => deleteRecord("ticket", row.dbId), (r) => `Ticket ${r.id} deleted.`);
  }

  function editVendor(row) {
    openModal("vendorEdit", {
      id: row.id,
      name: row.name,
      service: row.service,
      phone: row.phone,
      value: row.value,
      renewal: blankDash(row.renewal),
      pay: row.pay,
    });
  }

  function deleteVendor(row) {
    if (!window.confirm(`Remove vendor ${row.name}?`)) return;
    runAction(() => deleteRecord("vendor", row.id), (r) => `${r.name} removed.`);
  }

  function editAsset(row) {
    openModal("assetEdit", {
      id: row.id,
      tag: row.tag,
      name: row.name,
      category: row.category,
      location: row.location,
      installed: blankDash(row.installed),
      amc: blankDash(row.amc),
      condition: row.condition,
    });
  }

  function deleteAsset(row) {
    if (!window.confirm(`Delete asset ${row.tag}?`)) return;
    runAction(() => deleteRecord("asset", row.id), (r) => `Asset ${r.tag} deleted.`);
  }

  function editBooking(row) {
    openModal("bookingEdit", {
      id: row.id,
      facility: row.facility,
      flat: blankDash(row.flat),
      date: row.dateIso,
      slot: row.slot,
      charge: blankDash(row.charge),
      deposit: blankDash(row.deposit),
      pay: row.pay,
    });
  }

  function cancelBooking(row) {
    if (!window.confirm(`Cancel the ${row.facility} booking for ${row.flat} on ${row.date}?`)) return;
    runAction(() => deleteRecord("booking", row.id), (r) => `${r.facility} booking for ${r.flat} on ${r.date} cancelled.`);
  }

  function editBank(row) {
    openModal("bankEdit", {
      id: row.id,
      name: row.name,
      meta: row.meta,
      balance: String(row.balanceValue ?? ""),
    });
  }

  function deleteBank(row) {
    if (!window.confirm(`Remove ${row.name} from bank & cash?`)) return;
    runAction(() => deleteRecord("bank", row.id), (r) => `${r.name} removed.`);
  }

  function removeRecord(kind, id, question, done) {
    if (!window.confirm(question)) return;
    runAction(() => deleteRecord(kind, id), done);
  }

  const staffActions = {
    add: () => openModal("staff"),
    edit: (row) => openModal("staffEdit", {
      id: row.id,
      name: row.name,
      role: row.role,
      area: blankDash(row.area),
      salary: String(row.salaryAmount ?? ""),
      workingDays: String(row.workingDays ?? 26),
      payout: row.payoutStatus,
      payoutNote: row.payoutNote,
    }),
    remove: (row) => removeRecord("staff", row.id, `Remove ${row.name} from the staff register? Their attendance history is deleted too.`, (r) => `${r.name} removed.`),
    loadAttendance: fetchAttendance,
    saveAttendance: async (date, entries) => {
      const result = await saveAttendance(date, entries);
      setToast(`Attendance saved for ${result.label} — ${result.present} present, ${result.halfDay} half day, ${result.leave} leave, ${result.absent} absent.`);
      await load(true);
      return result;
    },
  };

  const rosterActions = {
    addDuty: () => openModal("duty"),
    editDuty: (row) => {
      const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const preset = { id: row.id, duty: row.duty };
      keys.forEach((key, i) => {
        const cell = row.cells[i];
        preset[key] = cell && !cell.isOff ? cell.who : "";
      });
      openModal("dutyEdit", preset);
    },
    removeDuty: (row) => removeRecord("duty", row.id, `Remove the "${row.duty}" duty from the roster?`, (r) => `${r.duty} removed from the roster.`),
    addFollowUp: () => openModal("followUp"),
    editFollowUp: (row) => openModal("followUpEdit", {
      id: row.id,
      task: row.task,
      owner: row.owner,
      due: row.dueIso,
      verifier: blankDash(row.verifier),
      status: row.status,
    }),
    removeFollowUp: (row) => removeRecord("followUp", row.id, `Delete the follow-up "${row.task}"?`, (r) => `Follow-up deleted: ${r.task}.`),
  };

  const vendorExtras = {
    addQuote: () => openModal("quotation"),
    editQuote: (row) => openModal("quotationEdit", { id: row.id, work: row.work, vendors: blankDash(row.vendors), range: blankDash(row.range) }),
    removeQuote: (row) => removeRecord("quotation", row.id, `Delete the quotation for "${row.work}"?`, (r) => `Quotation deleted: ${r.work}.`),
    addInvoice: () => openModal("invoice"),
    editInvoice: (row) => openModal("invoiceEdit", {
      id: row.id,
      vendor: row.vendorId,
      no: row.no,
      description: row.description,
      amount: String(row.amountValue ?? ""),
      dueOn: row.dueIso,
    }),
    removeInvoice: (row) => removeRecord("invoice", row.id, `Delete invoice ${row.no}?`, (r) => `Invoice ${r.no} deleted.`),
    payInvoice: canWrite(permissions, "finance")
      ? (row) => {
        if (!window.confirm(`Mark invoice ${row.no} (${row.amount}) as paid today? An approved expense voucher is created for it.`)) return;
        runAction(() => payInvoiceRequest(row.id), (r) => `Invoice ${r.no} paid — voucher ${r.voucher} added (${r.amount}).`);
      }
      : null,
  };

  const maintenanceActions = {
    addAmc: () => openModal("amc"),
    editAmc: (row) => openModal("amcEdit", { id: row.id, equipment: row.equip, vendor: row.vendorId, frequency: row.freq, nextOn: row.nextIso }),
    removeAmc: (row) => removeRecord("amc", row.id, `Delete the AMC contract for ${row.equip}?`, (r) => `AMC contract for ${r.equip} deleted.`),
    serviced: (row) => {
      if (!window.confirm(`Mark ${row.equip} as serviced today? The next service moves ahead by one ${row.freq.toLowerCase()} cycle.`)) return;
      runAction(() => amcServicedRequest(row.id), (r) => `${r.equip} serviced — next service ${r.next}.`);
    },
    addBreakdown: () => openModal("breakdown"),
    editBreakdown: (row) => openModal("breakdownEdit", { id: row.id, asset: row.assetId, what: row.what, date: row.when, note: row.note }),
    removeBreakdown: (row) => removeRecord("breakdown", row.id, `Delete the breakdown "${row.what}"?`, (r) => `Breakdown deleted: ${r.what}.`),
  };

  const securityActions = {
    addShift: () => openModal("shift"),
    editShift: (row) => openModal("shiftEdit", { id: row.id, name: row.name, start: row.start, end: row.end, staff: blankDash(row.staff) }),
    removeShift: (row) => removeRecord("shift", row.id, `Delete the ${row.name} shift?`, (r) => `${r.name} shift deleted.`),
    addGuard: () => openModal("guard"),
    editGuard: (row) => openModal("guardEdit", {
      id: row.id,
      name: row.name,
      post: row.post,
      shift: row.shift,
      timeIn: row.timeIn,
      timeOut: row.timeOut,
      status: row.status,
    }),
    removeGuard: (row) => removeRecord("guard", row.id, `Delete today's attendance entry for ${row.name}?`, (r) => `Entry for ${r.name} deleted.`),
    addHandover: () => openModal("handover"),
    removeHandover: (row) => removeRecord("handover", row.id, "Delete this handover note?", "Handover note deleted."),
    addPatrol: () => openModal("patrolPoint"),
    editPatrol: (row) => openModal("patrolEdit", { id: row.id, point: row.point, state: row.state === "Pending" ? "Checked" : row.state, note: row.note }),
    removePatrol: (row) => removeRecord("patrol", row.id, `Delete the checkpoint "${row.point}"?`, (r) => `Checkpoint deleted: ${r.point}.`),
    resetPatrol: () => {
      if (!window.confirm("Start a new patrol round? Every checkpoint goes back to Pending.")) return;
      runAction(resetPatrolRequest, (r) => `New patrol round started — ${r.count} checkpoint${r.count === 1 ? "" : "s"} pending.`);
    },
    addIncident: () => openModal("incident"),
    editIncident: (row) => openModal("incidentEdit", { id: row.id, what: row.what, when: row.whenLocal, status: row.status }),
    removeIncident: (row) => removeRecord("incident", row.id, "Delete this incident from the register?", "Incident deleted."),
  };

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
    blocks: (
      <BlocksScreen
        view={view}
        onAdd={write("property") ? () => openModal("flat") : null}
        onEdit={write("property") ? editFlat : null}
        onDelete={write("property") ? deleteFlat : null}
      />
    ),
    residents: (
      <ResidentsScreen
        view={view}
        onAdd={write("residents") ? () => openModal("resident") : null}
        onEdit={write("residents") ? editResident : null}
        onMoveOut={write("residents") ? moveOutResident : null}
      />
    ),
    access: <AccessScreen view={view} onAdd={write("users") ? () => openModal("user") : null} />,
    bills: (
      <BillsScreen
        view={view}
        onGenerate={write("billing") ? () => openModal("billGenerate") : null}
        onPay={write("billing") ? openPayment : null}
        onEdit={write("billing") ? editBill : null}
        onDelete={write("billing") ? deleteBill : null}
        onReceipt={view.receiptPreview ? () => printReceipt(view.societyName, view.receiptPreview) : null}
      />
    ),
    accounts: (
      <AccountsScreen
        view={view}
        onAdd={write("finance") ? () => openModal("voucher") : null}
        onApprove={write("finance") ? approveVoucher : null}
        onAddBank={write("finance") ? () => openModal("bank") : null}
        onEditBank={write("finance") ? editBank : null}
        onDeleteBank={write("finance") ? deleteBank : null}
      />
    ),
    helpdesk: (
      <HelpdeskScreen
        view={view}
        onAdd={write("helpdesk") ? () => openModal("ticket") : null}
        onEdit={write("helpdesk") ? editTicket : null}
        onDelete={write("helpdesk") ? deleteTicket : null}
      />
    ),
    security: <SecurityScreen view={view} actions={write("security") ? securityActions : null} />,
    staff: <StaffScreen view={view} actions={write("staff") ? staffActions : null} />,
    roster: <RosterScreen view={view} actions={write("staff") ? rosterActions : null} />,
    vendors: (
      <VendorsScreen
        view={view}
        onAdd={write("vendors") ? () => openModal("vendor") : null}
        onEdit={write("vendors") ? editVendor : null}
        onDelete={write("vendors") ? deleteVendor : null}
        extras={write("vendors") ? vendorExtras : null}
      />
    ),
    assets: (
      <AssetsScreen
        view={view}
        onAdd={write("vendors") ? () => openModal("asset") : null}
        onEdit={write("vendors") ? editAsset : null}
        onDelete={write("vendors") ? deleteAsset : null}
      />
    ),
    ppm: <PpmScreen view={view} actions={write("vendors") ? maintenanceActions : null} />,
    facility: (
      <FacilityScreen
        view={view}
        onAdd={write("facility") ? () => openModal("booking") : null}
        onEdit={write("facility") ? editBooking : null}
        onDelete={write("facility") ? cancelBooking : null}
      />
    ),
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
        cfg={modal ? resolveModal(modal, view) : null}
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
