import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay, rupees } from '../../format';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

const dueTone = (due) => (due.startsWith('Overdue') ? colors.rust : due === 'Due today' ? colors.amber : colors.muted);

export function Invoices({ invoices, vendors, manage, canPay, onDone }) {
  const [editing, setEditing] = useState(null);
  const total = invoices.reduce((s, i) => s + Number(i.amountValue || 0), 0);

  if (editing) {
    return <InvoiceForm invoice={editing === 'new' ? null : editing} vendors={vendors} canPay={canPay} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Add invoice" onPress={() => setEditing('new')} /> : null}
      {invoices.length ? <Text style={type.body}>{invoices.length} unpaid · {rupees(total)}</Text> : null}
      {invoices.length === 0 ? <Empty>No unpaid invoices.</Empty> : null}
      {invoices.map((i) => (
        <Item key={i.id} title={`${i.no} · ${i.amount}`} subtitle={i.who} meta={i.due} metaTone={dueTone(i.due)} onPress={manage ? () => setEditing(i) : undefined} />
      ))}
    </View>
  );
}

function InvoiceForm({ invoice, vendors, canPay, onClose, onDone }) {
  const [vendor, setVendor] = useState(invoice?.vendorId || '');
  const [no, setNo] = useState(invoice?.no || '');
  const [description, setDescription] = useState(invoice?.description || '');
  const [amount, setAmount] = useState(invoice ? String(invoice.amountValue) : '');
  const [hasDue, setHasDue] = useState(Boolean(invoice?.dueIso) || !invoice);
  const [dueOn, setDueOn] = useState(() => invoice?.dueIso || isoDay(new Date(Date.now() + 15 * 86400000)));
  const { busy, error, setError, submit } = useSubmit(onDone);
  const vendorOptions = [{ value: '', label: 'No vendor' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))];

  function save() {
    if (!no.trim() || !description.trim() || !amount.trim()) return setError('Enter the invoice number, what it is for and the amount.');
    const body = { vendor, no: no.trim(), description: description.trim(), amount: amount.trim(), dueOn: hasDue ? dueOn : '' };
    return invoice
      ? submit(endpoints.invoice(invoice.id), 'PATCH', body, (r) => `Invoice ${r.no} updated.`)
      : submit(endpoints.invoices, 'POST', body, (r) => `Invoice ${r.no} for ${r.amount} added.`);
  }

  function pay() {
    Alert.alert(`Mark ${invoice.no} as paid?`, `This records an approved expense voucher for ${invoice.amount}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark paid', onPress: () => submit(endpoints.invoicePay(invoice.id), 'POST', undefined, (r) => `Invoice ${r.no} paid — voucher ${r.voucher} recorded.`) },
    ]);
  }

  function remove() {
    confirmDelete(`Delete invoice ${invoice.no}?`, 'Only delete invoices entered by mistake.', () => submit(endpoints.invoice(invoice.id), 'DELETE', undefined, `Invoice ${invoice.no} deleted.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{invoice ? `Invoice ${invoice.no}` : 'Add invoice'}</Text>
      {invoice && canPay ? <Button title={`Mark paid (${invoice.amount})`} onPress={pay} disabled={busy} /> : null}
      <View style={{ gap: 6 }}>
        <FieldLabel>Vendor</FieldLabel>
        <Chips options={vendorOptions} value={vendor} onChange={setVendor} />
      </View>
      <TextField label="Invoice no." value={no} onChangeText={setNo} placeholder="INV-2291" maxLength={40} />
      <TextField label="For" value={description} onChangeText={setDescription} placeholder="Lift AMC — Q3" maxLength={200} />
      <TextField label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="18000" />
      <View style={{ gap: 6 }}>
        <FieldLabel>Due date</FieldLabel>
        <Chips options={['Has due date', 'No due date']} value={hasDue ? 'Has due date' : 'No due date'} onChange={(v) => setHasDue(v === 'Has due date')} />
      </View>
      {hasDue ? <DateField value={dueOn} onChange={setDueOn} /> : null}
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" variant={invoice && canPay ? 'outline' : 'primary'} onPress={save} busy={busy} />
      {invoice ? <Button title="Delete invoice" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Back" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
