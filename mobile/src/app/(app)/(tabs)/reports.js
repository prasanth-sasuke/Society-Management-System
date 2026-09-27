import { StyleSheet, Text, View } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { Empty } from '../../../components/common';
import { Card, Kpi, KpiGrid, Loading, Notice, Screen } from '../../../components/ui';
import { plural, rupees } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { colors, radius, type } from '../../../theme';

function Bar({ pct, color = colors.green }) {
  const width = `${Math.max(0, Math.min(100, parseFloat(pct) || 0))}%`;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

function BarRow({ label, value, pct, color }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.between}>
        <Text style={[type.body, { flex: 1 }]}>{label}</Text>
        <Text style={styles.figure}>{value}</Text>
      </View>
      <Bar pct={pct} color={color} />
    </View>
  );
}

export default function Reports() {
  const { data, error, loading, refreshing, refresh } = useApi(endpoints.dashboard);

  if (loading && !data) return <Screen><Loading label="Loading reports…" /></Screen>;
  const money = data?.money;
  const occupancy = data?.occupancy;
  const blocks = Object.entries(data?.blockMoney || {}).sort(([a], [b]) => a.localeCompare(b));
  const trend = data?.trend || [];
  const trendMax = Math.max(1, ...trend.map((t) => Math.max(t.income, t.expense)));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error ? <Notice>{error.message}</Notice> : null}
      <Text style={type.body}>Society-wide figures, updated live. Pull down to refresh.</Text>

      {money ? (
        <KpiGrid>
          <Kpi label="Collection" value={`${money.collectionPct}%`} note={`${rupees(money.collected)} of ${rupees(money.billed)}`} tone={colors.green} />
          <Kpi label="Outstanding dues" value={rupees(money.due)} note={plural(money.unpaidFlats, 'flat')} tone={money.due ? colors.rust : colors.text} />
          <Kpi label="Money spent" value={rupees(money.spent)} note={plural(money.vouchers, 'approved voucher')} />
          <Kpi label="Cash in bank" value={rupees(money.cash)} note={plural(money.banks, 'account')} />
          <Kpi label="Vendor dues" value={rupees(money.vendorDue)} note={plural(money.invoices, 'unpaid invoice')} tone={money.vendorDue ? colors.amber : colors.text} />
          <Kpi label="Monthly salaries" value={rupees(money.salary)} note={data.staffOnPayroll !== undefined ? plural(data.staffOnPayroll, 'staff member') : undefined} />
        </KpiGrid>
      ) : null}
      <KpiGrid>
        {occupancy ? <Kpi label="Flats occupied" value={`${occupancy.occupied} / ${occupancy.total}`} note={`${plural(occupancy.vacant, 'flat')} empty`} /> : null}
        {data?.openTickets !== undefined ? <Kpi label="Open complaints" value={String(data.openTickets)} /> : null}
        {data?.overdueBills !== undefined ? <Kpi label="Overdue bills" value={String(data.overdueBills)} tone={data.overdueBills ? colors.rust : colors.text} /> : null}
      </KpiGrid>

      {data?.ageing ? (
        <Card style={{ gap: 14 }}>
          <Text style={type.heading}>Outstanding dues — ageing</Text>
          {money?.due ? data.ageing.map((a) => <BarRow key={a.bucket} label={a.bucket} value={rupees(a.amount)} pct={a.pct} color={a.tone} />) : <Empty>No outstanding dues.</Empty>}
        </Card>
      ) : null}

      {data?.expenseSplit ? (
        <Card style={{ gap: 14 }}>
          <Text style={type.heading}>Expense split — approved vouchers</Text>
          {data.expenseSplit.length ? data.expenseSplit.map((e) => <BarRow key={e.head} label={e.head} value={rupees(e.amount)} pct={e.pct} />) : <Empty>No expenses recorded yet.</Empty>}
        </Card>
      ) : null}

      {data?.blockMoney ? (
        <Card style={{ gap: 14 }}>
          <Text style={type.heading}>Collection by block</Text>
          {blocks.length ? blocks.map(([code, b]) => {
            const pct = b.billed ? Math.round((b.collected / b.billed) * 100) : 0;
            return <BarRow key={code} label={`Block ${code} · ${pct}%`} value={`${rupees(b.collected)} / ${rupees(b.billed)}`} pct={pct} color={pct >= 90 ? colors.green : pct >= 70 ? colors.amber : colors.rust} />;
          }) : <Empty>No bills yet.</Empty>}
        </Card>
      ) : null}

      {trend.length ? (
        <Card style={{ gap: 14 }}>
          <Text style={type.heading}>Last 6 months</Text>
          <View style={[styles.between, { gap: 16, justifyContent: 'flex-start' }]}>
            <Legend color={colors.green} label="Collected" />
            <Legend color={colors.rust} label="Spent" />
          </View>
          {trend.map((t) => (
            <View key={t.month} style={{ gap: 4 }}>
              <View style={styles.between}>
                <Text style={type.body}>{t.month}</Text>
                <Text style={styles.small}>{rupees(t.income)} · {rupees(t.expense)}</Text>
              </View>
              <Bar pct={(t.income / trendMax) * 100} color={colors.green} />
              <Bar pct={(t.expense / trendMax) * 100} color={colors.rust} />
            </View>
          ))}
        </Card>
      ) : null}

      <Text style={[type.small, { textAlign: 'center' }]}>The printable committee pack is on the web app.</Text>
    </Screen>
  );
}

function Legend({ color, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.control, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.control },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  figure: { fontSize: 14, fontWeight: '600', color: colors.text },
  small: { fontSize: 12, color: colors.muted },
});
