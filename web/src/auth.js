const TOKEN_KEY = "society.token";

export const SCREEN_MODULE = {
  home: null,
  blocks: "property",
  residents: "residents",
  access: "users",
  bills: "billing",
  accounts: "finance",
  helpdesk: "helpdesk",
  security: "security",
  staff: "staff",
  roster: "staff",
  vendors: "vendors",
  assets: "vendors",
  ppm: "vendors",
  facility: "facility",
  reports: "reports",
};

export const CATALOG_MODULE = {
  society: null,
  dashboard: null,
  access: "users",
  blocks: "property",
  flats: "property",
  residents: "residents",
  moveEvents: "residents",
  bills: "billing",
  finance: "finance",
  tickets: "helpdesk",
  staff: "staff",
  roster: "staff",
  followUps: "staff",
  vendors: "vendors",
  quotations: "vendors",
  invoices: "vendors",
  assets: "vendors",
  amc: "vendors",
  reminders: "vendors",
  breakdowns: "vendors",
  facilities: "facility",
  bookings: "facility",
  security: "security",
};

export const CREATE_MODULE = {
  flat: "property",
  resident: "residents",
  ticket: "helpdesk",
  vendor: "vendors",
  asset: "vendors",
  booking: "facility",
  user: "users",
  billGenerate: "billing",
  payment: "billing",
  voucher: "finance",
  flatEdit: "property",
  residentEdit: "residents",
  billEdit: "billing",
  ticketEdit: "helpdesk",
  vendorEdit: "vendors",
  assetEdit: "vendors",
  bookingEdit: "facility",
  bank: "finance",
  bankEdit: "finance",
  staff: "staff",
  staffEdit: "staff",
  duty: "staff",
  dutyEdit: "staff",
  followUp: "staff",
  followUpEdit: "staff",
  shift: "security",
  shiftEdit: "security",
  guard: "security",
  guardEdit: "security",
  handover: "security",
  patrolPoint: "security",
  patrolEdit: "security",
  incident: "security",
  incidentEdit: "security",
  quotation: "vendors",
  quotationEdit: "vendors",
  invoice: "vendors",
  invoiceEdit: "vendors",
  amc: "vendors",
  amcEdit: "vendors",
  breakdown: "vendors",
  breakdownEdit: "vendors",
  userEdit: "users",
  superadminEdit: "users",
  billingRules: "billing",
  societyName: "property",
};

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function canRead(permissions, moduleName) {
  if (!moduleName) return true;
  return permissions?.[moduleName] === "read" || permissions?.[moduleName] === "full";
}

export function canWrite(permissions, moduleName) {
  if (!moduleName) return false;
  return permissions?.[moduleName] === "full";
}

export function canOpenScreen(permissions, screen) {
  return canRead(permissions, SCREEN_MODULE[screen]);
}
