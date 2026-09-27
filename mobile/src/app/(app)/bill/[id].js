import { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { apiRequest } from '../../../api/client';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips, DateField, TextField } from '../../../components/fields';
import { Button, Card, Loading, Notice, Screen } from '../../../components/ui';
import { billTone, isPaid, receiptText } from '../../../features/bills';
import { isoDay, rupees } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, type } from '../../../theme';

const MODES = ['UPI', 'Cash', 'Cheque', 'Bank transfer'];

export default function BillDetail() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const bills = useApi(endpoints.bills);
  const society = useApi(endpoints.society);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState(null);

  const bill = (bills.data || []).find((b) => b.id === id);
  const manage = canWrite(session.permissions, 'billing');
  const title = bill ? `${bill.flat} · ${bill.period}` : 'Bill';

  if (!bill) {
    return (
      <Screen refreshing={bills.refreshing} onRefresh={bills.refresh}>
        <Stack.Screen options={{ title }} />
        {bills.loading ? <Loading label="Loading bill…" /> : <Notice>{bills.error?.message || 'This bill no longer exists.'}</Notice>}
      </Screen>
    );
  }

  const remaining = Number(bill.remainingAmount || 0);
  const penalty = Number(bill.penaltyAmount || 0);

  function waive() {
    Alert.alert('Waive late fee?', `Remove the ${bill.penalty} late fee from this bill. Any part already paid is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Waive',
        style: 'destructive',
        onPress: async () => {
          try {
            const r = await apiRequest(endpoints.billWaivePenalty(bill.id), { method: 'POST' });
            setMessage({ tone: 'green', text: r.cleared ? `Late fee of ${r.waived} waived — the bill is now fully paid.` : `Late fee of ${r.waived} waived.` });
            await bills.reload();
          } catch (err) {
            setMessage({ tone: 'rust', text: err.message });
          }
        },
      },
    ]);
  }

  function shareReceipt() {
    Share.share({ message: receiptText(society.data?.name, bill) }).catch(() => {});
  }

  return (
    <Screen refreshing={bills.refreshing} onRefresh={bills.refresh}>
      <Stack.Screen options={{ title }} />
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <Card>
        <View style={styles.between}>
          <Text style={type.heading}>{bill.resident}</Text>
          <Text style={[styles.status, { color: billTone(bill) }]}>{bill.status}</Text>
        </View>
        <Text style={type.small}>Due by {bill.dueOn}</Text>
        <View style={styles.lines}>
          <Line label="Maintenance" value={bill.maint} />
          <Line label="Special contribution" value={bill.special} />
          <Line label="Previous due" value={bill.prev} />
          <Line label="Late fee" value={bill.penalty} tone={penalty ? colors.rust : undefined} />
          <Line label="Total" value={bill.total} strong />
          <Line label="Paid so far" value={rupees(bill.paidAmount)} tone={colors.green} />
          <Line label="Still due" value={bill.remaining} strong tone={remaining ? colors.rust : colors.green} />
        </View>
      </Card>

      {bill.lastPayment ? (
        <Card>
          <Text style={type.kicker}>Last payment</Text>
          <Text style={type.body}>{bill.lastPayment.amount} via {bill.lastPayment.mode} on {bill.lastPayment.paidOn}</Text>
          <Text style={type.small}>Receipt {bill.lastPayment.receiptNo}</Text>
          <Button title="Share receipt" variant="outline" onPress={shareReceipt} />
        </Card>
      ) : null}

      {manage && !isPaid(bill) && remaining > 0 ? (
        paying ? (
          <PaymentForm
            bill={bill}
            onCancel={() => setPaying(false)}
            onSaved={async (r) => {
              setPaying(false);
              setMessage({ tone: 'green', text: r.fullyPaid ? `Receipt ${r.receiptNo}: ${r.amount} received. The bill is fully paid.` : `Receipt ${r.receiptNo}: ${r.amount} received. ${r.remaining} still due.` });
              await bills.reload();
            }}
          />
        ) : (
          <Button title="Record payment" onPress={() => { setMessage(null); setPaying(true); }} />
        )
      ) : null}

      {manage && !isPaid(bill) && penalty > 0 && !paying ? (
        <Button title={`Waive late fee (${bill.penalty})`} variant="outline" onPress={waive} />
      ) : null}

      {!manage && remaining > 0 ? (
        <Text style={[type.small, { textAlign: 'center' }]}>Pay at the society office or as instructed by your committee. Late fees are added daily after the due date.</Text>
      ) : null}
    </Screen>
  );
}

function Line({ label, value, strong, tone }) {
  return (
    <View style={styles.between}>
      <Text style={[type.body, strong && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <Text style={[type.body, { color: tone || colors.text }, strong && { fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

function PaymentForm({ bill, onCancel, onSaved }) {
  const [amount, setAmount] = useState(String(Number(bill.remainingAmount)));
  const [mode, setMode] = useState(MODES[0]);
  const [paidOn, setPaidOn] = useState(isoDay());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiRequest(endpoints.billPayments(bill.id), { method: 'POST', body: { amount: amount.trim(), mode, paidOn } });
      await onSaved(r);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>Record payment</Text>
      <TextField label={`Amount received (₹) — up to ${bill.remaining}`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>Paid via</Text>
        <Chips options={MODES} value={mode} onChange={setMode} />
      </View>
      <DateField label="Paid on" value={paidOn} onChange={setPaidOn} maximumDate={new Date()} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save payment" onPress={save} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onCancel} disabled={busy} />
    </Card>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  status: { fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  lines: { gap: 6, marginTop: 6 },
});
