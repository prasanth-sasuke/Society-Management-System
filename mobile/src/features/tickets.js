import { colors } from '../theme';

export const CATEGORIES = ['Plumbing', 'Electrical', 'Lift', 'Housekeeping', 'Security', 'Carpentry', 'Facility'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const STATUSES = ['Assigned', 'In progress', 'Awaiting vendor', 'Resolved'];
export const TICKET_FILTERS = ['Open', 'Resolved', 'All'];

// Residents don't know who handles what; the office reassigns from here.
export const DEFAULT_OWNER = 'Society office';

export const isResolved = (ticket) => ticket.status === 'Resolved';

export function priorityTone(priority) {
  if (priority === 'High') return colors.rust;
  if (priority === 'Medium') return colors.amber;
  return colors.faint;
}

export function statusTone(status) {
  if (status === 'Resolved') return colors.green;
  if (status === 'Awaiting vendor') return colors.amber;
  return colors.muted;
}

export function filterTickets(tickets, filter, query) {
  const q = query.trim().toLowerCase();
  return tickets.filter((t) => {
    if (filter === 'Open' && isResolved(t)) return false;
    if (filter === 'Resolved' && !isResolved(t)) return false;
    if (!q) return true;
    return [t.id, t.flat, t.text, t.owner, t.category].some((text) => String(text || '').toLowerCase().includes(q));
  });
}

// The update endpoint needs every field, so start from the ticket as it is.
export function updateBody(ticket, changes) {
  return {
    category: ticket.category,
    text: ticket.text,
    priority: ticket.priority,
    owner: ticket.owner,
    status: ticket.status,
    ...changes,
  };
}
