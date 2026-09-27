import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { apiRequest } from '../../../api/client';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Empty, Item } from '../../../components/common';
import { Button, Card, Kpi, KpiGrid, Loading, Notice, Screen } from '../../../components/ui';
import { plural, rupees } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, type } from '../../../theme';

const RECENT = 15;

export default function Accounts() {
  const { session } = useSession();
  const canApprove = canWrite(session.permissions, 'finance');
  const { data, error, loading, refreshing, refresh, reload } = useApi(endpoints.finance);
  const [message, setMessage] = useState(null);
  const [failure, setFailure] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const vouchers = data?.vouchers || [];
  const pending = vouchers.filter((v) => v.state !== 'Approved');
  const approved = vouchers.filter((v) => v.state === 'Approved').slice(-RECENT).reverse();
  const banks = data?.banks || [];
  const cash = banks.reduce((s, b) => s + Number(b.balanceValue || 0), 0);

  function approve(voucher) {
    Alert.alert(`Approve ${voucher.no}?`, `${voucher.party} · ${voucher.head} · ${voucher.amount}\n\nApproved vouchers count as money spent in reports.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setBusyId(voucher.id);
          setFailure(null);
          setMessage(null);
          try {
            const result = await apiRequest(endpoints.voucherApprove(voucher.id), { method: 'POST' });
            setMessage(`${result.no} approved.`);
            await reload();
          } catch (err) {
            setFailure(err.message);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  if (loading && !data) return <Screen><Loading label="Loading accounts…" /></Screen>;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error ? <Notice>{error.message}</Notice> : null}
      {message ? <Notice tone="green">{message}</Notice> : null}
      {failure ? <Notice>{failure}</Notice> : null}

      <KpiGrid>
        <Kpi label="Cash in bank" value={rupees(cash)} note={banks.length ? plural(banks.length, 'account') : 'No accounts yet'} tone={colors.green} />
        <Kpi label="Awaiting approval" value={String(pending.length)} tone={pending.length ? colors.amber : colors.text} />
      </KpiGrid>

      <Card style={{ gap: 10 }}>
        <Text style={type.heading}>Vouchers awaiting approval</Text>
        {pending.length === 0 ? <Empty>Nothing waiting for approval.</Empty> : null}
        {pending.map((v) => (
          <View key={v.id} style={{ gap: 8 }}>
            <Item title={`${v.no} · ${v.amount}`} subtitle={`${v.party} · ${v.head}`} meta={v.state} metaTone={colors.amber} />
            {canApprove ? <Button title={`Approve ${v.no}`} variant="outline" onPress={() => approve(v)} busy={busyId === v.id} disabled={Boolean(busyId)} /> : null}
          </View>
        ))}
        {!canApprove && pending.length ? <Text style={type.small}>Only logins with full finance access can approve.</Text> : null}
      </Card>

      {banks.length ? (
        <Card style={{ gap: 10 }}>
          <Text style={type.heading}>Bank accounts</Text>
          {banks.map((b) => <Item key={b.id} title={b.name} subtitle={b.meta} meta={b.balance} metaTone={colors.text} />)}
        </Card>
      ) : null}

      {data?.budget?.length ? (
        <Card style={{ gap: 10 }}>
          <Text style={type.heading}>Budget</Text>
          {data.budget.map((b) => (
            <Item key={b.id} title={b.head} subtitle={b.figures} meta={b.pct} metaTone={parseInt(b.pct, 10) > 100 ? colors.rust : colors.green} />
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <Text style={type.heading}>Recently approved</Text>
        {approved.length === 0 ? <Empty>No approved vouchers yet.</Empty> : null}
        {approved.map((v) => <Item key={v.id} title={`${v.no} · ${v.amount}`} subtitle={`${v.party} · ${v.head}`} meta="Approved" metaTone={colors.green} />)}
      </Card>

      <Text style={[type.small, { textAlign: 'center' }]}>Create vouchers and manage bank accounts on the web app.</Text>
    </Screen>
  );
}
