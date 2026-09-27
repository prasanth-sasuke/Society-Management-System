import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { CallButton } from '../../../components/common';
import { TextField } from '../../../components/fields';
import { Loading, Notice } from '../../../components/ui';
import { plural } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { colors, radius, type } from '../../../theme';

function matches(resident, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [resident.name, resident.flat, resident.phone, resident.type].some((v) => String(v || '').toLowerCase().includes(q));
}

export default function Directory() {
  const { data, error, loading, refreshing, refresh } = useApi(endpoints.residents);
  const [query, setQuery] = useState('');
  const residents = useMemo(() => data || [], [data]);
  const shown = useMemo(() => residents.filter((r) => matches(r, query)), [residents, query]);

  const header = (
    <View style={{ gap: 12, marginBottom: 4 }}>
      {error ? <Notice>{error.message}</Notice> : null}
      {residents.length ? (
        <>
          <TextField value={query} onChangeText={setQuery} placeholder="Search name, flat or phone" autoCorrect={false} />
          <Text style={type.small}>{plural(residents.length, 'current resident')}{query ? ` · ${shown.length} shown` : ''}</Text>
        </>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
      data={shown}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.green]} />}
      ListEmptyComponent={loading ? <Loading label="Loading residents…" /> : (
        <Text style={[type.body, { textAlign: 'center', paddingVertical: 24 }]}>
          {residents.length ? 'Nobody matches that search.' : 'No residents yet. Add them from the web app.'}
        </Text>
      )}
      renderItem={({ item }) => <ResidentCard resident={item} />}
    />
  );
}

function ResidentCard({ resident }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.heading}>{resident.name}</Text>
        <Text style={type.small}>{resident.flat} · {resident.type} · {resident.family}</Text>
        <Text style={type.small}>{resident.phone}{resident.emergency !== '—' ? ` · Emergency: ${resident.emergency}` : ''}</Text>
      </View>
      <CallButton phone={resident.phone} name={resident.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.card, padding: 14 },
});
