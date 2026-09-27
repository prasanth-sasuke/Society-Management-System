export function canRead(permissions, moduleName) {
  return permissions?.[moduleName] === 'read' || permissions?.[moduleName] === 'full';
}

export function canWrite(permissions, moduleName) {
  return permissions?.[moduleName] === 'full';
}

// Each entry is a tab route in src/app/(app)/(tabs); `module` is the server permission it needs.
// `officeOnly` tabs are hidden from logins scoped to a flat or vendor.
export const MODULE_TABS = {
  bills: { title: 'Bills', module: 'billing', glyph: '₹' },
  helpdesk: { title: 'Helpdesk', module: 'helpdesk', glyph: '!' },
  security: { title: 'Security', module: 'security', glyph: 'S' },
  staff: { title: 'Staff', module: 'staff', glyph: 'P' },
  facility: { title: 'Facility', module: 'facility', glyph: 'F' },
  vendors: { title: 'Vendors', module: 'vendors', glyph: 'V' },
  directory: { title: 'Directory', module: 'residents', glyph: 'D', officeOnly: true },
  accounts: { title: 'Accounts', module: 'finance', glyph: 'A' },
  reports: { title: 'Reports', module: 'reports', glyph: 'R' },
};

const TAB_ORDER = {
  RESIDENT: ['bills', 'helpdesk', 'facility'],
  SECURITY: ['security', 'helpdesk', 'staff'],
  VENDOR: ['helpdesk', 'vendors'],
  MANAGER: ['helpdesk', 'staff', 'bills'],
  ACCOUNTANT: ['bills', 'accounts', 'vendors'],
  EC: ['reports', 'accounts', 'helpdesk'],
};
const DEFAULT_ORDER = ['bills', 'helpdesk', 'security', 'staff', 'facility', 'vendors', 'directory', 'accounts', 'reports'];
const MAX_TABS = 3;

export function readableModules(session) {
  const scoped = Boolean(session?.scope);
  return Object.keys(MODULE_TABS).filter((key) => {
    const tab = MODULE_TABS[key];
    return canRead(session?.permissions, tab.module) && !(tab.officeOnly && scoped);
  });
}

export function tabsFor(session) {
  const readable = readableModules(session);
  const preferred = [...(TAB_ORDER[session?.user?.role] || []), ...DEFAULT_ORDER];
  const tabs = [...new Set(preferred)].filter((key) => readable.includes(key)).slice(0, MAX_TABS);
  return { tabs, more: readable.filter((key) => !tabs.includes(key)) };
}
