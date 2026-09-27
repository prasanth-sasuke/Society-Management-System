import { colors } from '../theme';

export const BILL_FILTERS = ['All', 'Unpaid', 'Overdue', 'Paid'];

export const isPaid = (bill) => bill.statusCode === 'PAID';
export const isOverdue = (bill) => String(bill.status).startsWith('Overdue');

export function billTone(bill) {
  if (isPaid(bill)) return colors.green;
  if (isOverdue(bill)) return colors.rust;
  return colors.amber;
}

export function filterBills(bills, filter, query) {
  const q = query.trim().toLowerCase();
  return bills.filter((bill) => {
    if (filter === 'Paid' && !isPaid(bill)) return false;
    if (filter === 'Unpaid' && isPaid(bill)) return false;
    if (filter === 'Overdue' && !isOverdue(bill)) return false;
    if (!q) return true;
    return [bill.flat, bill.resident, bill.period].some((text) => String(text || '').toLowerCase().includes(q));
  });
}

export function receiptText(societyName, bill) {
  const p = bill.lastPayment;
  return [
    societyName || 'Society',
    'Maintenance receipt',
    '',
    `Receipt no.: ${p.receiptNo}`,
    `Date: ${p.paidOn}`,
    `Flat: ${bill.flat}`,
    `Resident: ${bill.resident}`,
    `Billing period: ${bill.period}`,
    `Paid via: ${p.mode}`,
    `Amount paid: ${p.amount}`,
    `Still due on this bill: ${bill.remaining}`,
  ].join('\n');
}
