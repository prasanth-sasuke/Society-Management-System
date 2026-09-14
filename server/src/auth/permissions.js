export const ROLE_LABELS = {
  ADMIN: "Admin",
  EC: "EC member",
  MANAGER: "Manager",
  ACCOUNTANT: "Accountant",
  SECURITY: "Security",
  RESIDENT: "Resident",
  VENDOR: "Vendor",
};

export const ROLE_SCOPES = {
  ADMIN: "Everything, including masters and audit trail",
  EC: "Read all, approve vouchers above ₹25,000",
  MANAGER: "Day-to-day operations, billing, staff, vendors",
  ACCOUNTANT: "Bills, accounts, vendor invoices, and reports",
  SECURITY: "Gate register, visitors, incidents only",
  RESIDENT: "Own bills, helpdesk, and facility booking",
  VENDOR: "Assigned tickets and own contract records",
};

export const MODULES = [
  "property",
  "residents",
  "billing",
  "finance",
  "helpdesk",
  "security",
  "staff",
  "vendors",
  "facility",
  "reports",
  "users",
];

const FULL = "full";
const READ = "read";

const MATRIX = {
  ADMIN: {
    property: FULL, residents: FULL, billing: FULL, finance: FULL, helpdesk: FULL,
    security: FULL, staff: FULL, vendors: FULL, facility: FULL, reports: FULL, users: FULL,
  },
  EC: {
    property: READ, residents: READ, billing: READ, finance: READ, helpdesk: READ,
    security: READ, staff: READ, vendors: READ, facility: READ, reports: FULL,
  },
  MANAGER: {
    property: FULL, residents: FULL, billing: FULL, finance: READ, helpdesk: FULL,
    security: FULL, staff: FULL, vendors: FULL, facility: FULL, reports: FULL,
  },
  ACCOUNTANT: {
    billing: FULL, finance: FULL, vendors: READ, reports: FULL,
  },
  SECURITY: {
    residents: READ, helpdesk: READ, security: FULL, staff: READ, facility: READ,
  },
  RESIDENT: {
    residents: READ, billing: READ, helpdesk: FULL, facility: FULL, reports: READ,
  },
  VENDOR: {
    helpdesk: READ, vendors: READ,
  },
};

export function permissionsFor(role) {
  const granted = MATRIX[role] || {};
  const permissions = {};
  for (const moduleName of MODULES) {
    permissions[moduleName] = granted[moduleName] || null;
  }
  return permissions;
}

export function canRead(permissions, moduleName) {
  return permissions?.[moduleName] === "read" || permissions?.[moduleName] === "full";
}

export function canWrite(permissions, moduleName) {
  return permissions?.[moduleName] === "full";
}

export function permissionMatrixView() {
  const roles = ["ADMIN", "EC", "MANAGER", "ACCOUNTANT", "SECURITY", "RESIDENT", "VENDOR"];
  const rows = [
    ["property", "Property master"],
    ["residents", "Residents"],
    ["billing", "Maintenance billing"],
    ["finance", "Accounting & finance"],
    ["helpdesk", "Helpdesk"],
    ["security", "Security & incidents"],
    ["staff", "Staff & roster"],
    ["vendors", "Vendors & AMC"],
    ["facility", "Facility booking"],
    ["reports", "Reports"],
    ["users", "Users & access"],
  ];
  return {
    permRoles: roles.map((role) => (role === "EC" ? "EC" : ROLE_LABELS[role])),
    permRows: rows.map(([moduleName, label]) => ({
      module: label,
      marks: roles.map((role) => {
        const level = MATRIX[role]?.[moduleName];
        if (level === "full") return "●";
        if (level === "read") return "◐";
        return "—";
      }),
    })),
  };
}
