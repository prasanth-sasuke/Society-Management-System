import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips, TextField } from '../../../components/fields';
import { Kpi, KpiGrid, Loading, Notice } from '../../../components/ui';
import { BILL_FILTERS, billTone, filterBills } from '../../../features/bills';
import { plural, rupees } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { colors, radius, type } from '../../../theme';

export default function Bills() {
  const { session } = useSession();
  const flatScoped = Boolean(session.scope && 'flat' in session.scope);
  const { data, error, loading, refreshing, refresh, reload } = useApi(endpoints.bills);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  // Pick up payments recorded on the detail screen when coming back to the list.
  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (seen.current) reload();
    seen.current = true;
  }, [reload]));

  const bills = useMemo(() => data || [], [data]);
  const shown = useMemo(() => filterBills(bills, filter, query), [bills, filter, query]);
  const totals = useMemo(() => ({
    billed: bills.reduce((s, b) => s + Number(b.totalAmount || 0), 0),
    collected: bills.reduce((s, b) => s + Number(b.paidAmount || 0), 0),
    pending: bills.reduce((s, b) => s + Number(b.remainingAmount || 0), 0),
    unpaid: bills.filter((b) => Number(b.remainingAmount) > 0).length,
  }), [bills]);

  const header = (
    <View style={{ gap: 14, marginBottom: 4 }}>
      {error ? <Notice>{error.message}</Notice> : null}
      {data ? (
        <KpiGrid>
          <Kpi label={flatScoped ? 'You still owe' : 'Still pending'} value={rupees(totals.pending)} note={totals.unpaid ? `${plural(totals.unpaid, 'bill')} unpaid` : 'Nothing due'} tone={totals.pending ? colors.rust : colors.green} />
          <Kpi label={flatScoped ? 'You have paid' : 'Collected'} value={rupees(totals.collected)} note={`of ${rupees(totals.billed)} billed`} tone={colors.green} />
        </KpiGrid>
      ) : null}
      {!flatScoped && bills.length ? (
        <TextField value={query} onChangeText={setQuery} placeholder="Search flat, resident or period" autoCorrect={false} />
      ) : null}
      {bills.length ? <Chips options={BILL_FILTERS} value={filter} onChange={setFilter} /> : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
      data={shown}
      keyExtractor={(bill) => bill.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.green]} />}
      ListEmptyComponent={loading ? <Loading label="Loading bills…" /> : (
        <Text style={[type.body, { textAlign: 'center', paddingVertical: 24 }]}>
          {bills.length ? 'No bills match this filter.' : flatScoped ? 'No bills for your flat yet.' : 'No bills yet. Generate them from the web app.'}
        </Text>
      )}
      renderItem={({ item }) => <BillCard bill={item} />}
    />
  );
}

function BillCard({ bill }) {
  const tone = billTone(bill);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/bill/[id]', params: { id: bill.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.rowBetween}>
        <Text style={type.heading}>{bill.flat} · {bill.period}</Text>
        <Text style={styles.total}>{bill.total}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>{bill.resident}</Text>
        <Text style={[styles.status, { color: tone }]}>{bill.status}</Text>
      </View>
      {Number(bill.remainingAmount) > 0 && Number(bill.paidAmount) > 0 ? (
        <Text style={type.small}>Still due: {bill.remaining}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  total: { fontSize: 16, fontWeight: '700', color: colors.text },
  status: { fontSize: 13, fontWeight: '700' },
});
