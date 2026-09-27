export function canRead(permissions, moduleName) {
  return permissions?.[moduleName] === 'read' || permissions?.[moduleName] === 'full';
}

export function canWrite(permissions, moduleName) {
  return permissions?.[moduleName] === 'full';
}

// Each entry is a tab route in src/app/(app)/(tabs); `module` is the server permission it needs.
export const MODULE_TABS = {
  bills: { title: 'Bills', module: 'billing', glyph: '₹' },
  helpdesk: { title: 'Helpdesk', module: 'helpdesk', glyph: '!' },
  security: { title: 'Security', module: 'security', glyph: 'S' },
  staff: { title: 'Staff', module: 'staff', glyph: 'P' },
  facility: { title: 'Facility', module: 'facility', glyph: 'F' },
  vendors: { title: 'Vendors', module: 'vendors', glyph: 'V' },
};

const TAB_ORDER = {
  RESIDENT: ['bills', 'helpdesk', 'facility'],
  SECURITY: ['security', 'helpdesk', 'staff'],
  VENDOR: ['helpdesk', 'vendors'],
  MANAGER: ['helpdesk', 'staff', 'bills'],
  ACCOUNTANT: ['bills', 'vendors', 'helpdesk'],
};
const DEFAULT_ORDER = ['bills', 'helpdesk', 'security', 'staff', 'facility', 'vendors'];
const MAX_TABS = 3;

export function readableModules(permissions) {
  return Object.keys(MODULE_TABS).filter((key) => canRead(permissions, MODULE_TABS[key].module));
}

export function tabsFor(session) {
  const readable = readableModules(session?.permissions);
  const preferred = [...(TAB_ORDER[session?.user?.role] || []), ...DEFAULT_ORDER];
  const tabs = [...new Set(preferred)].filter((key) => readable.includes(key)).slice(0, MAX_TABS);
  return { tabs, more: readable.filter((key) => !tabs.includes(key)) };
}
