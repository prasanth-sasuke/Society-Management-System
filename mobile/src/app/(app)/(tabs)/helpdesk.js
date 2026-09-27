import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips, TextField } from '../../../components/fields';
import { Button, Loading, Notice } from '../../../components/ui';
import { TICKET_FILTERS, filterTickets, priorityTone, statusTone } from '../../../features/tickets';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, layout, radius, type } from '../../../theme';

export default function Helpdesk() {
  const { session } = useSession();
  const scope = session.scope;
  const flatScoped = Boolean(scope && 'flat' in scope);
  const vendorScoped = Boolean(scope && 'vendor' in scope);
  const canRaise = canWrite(session.permissions, 'helpdesk') && !(flatScoped && !scope.flat);
  const { data, error, loading, refreshing, refresh, reload } = useApi(endpoints.tickets);
  const [filter, setFilter] = useState('Open');
  const [query, setQuery] = useState('');

  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (seen.current) reload();
    seen.current = true;
  }, [reload]));

  const tickets = useMemo(() => data || [], [data]);
  const shown = useMemo(() => filterTickets(tickets, filter, query), [tickets, filter, query]);
  const openCount = tickets.filter((t) => t.status !== 'Resolved').length;

  const header = (
    <View style={{ gap: 14, marginBottom: 4 }}>
      {error ? <Notice>{error.message}</Notice> : null}
      {flatScoped && !scope.flat ? <Notice>{"Your login isn't linked to a flat yet, so you can't raise complaints. Ask the society office to link it."}</Notice> : null}
      {canRaise ? <Button title="+ New complaint" onPress={() => router.push('/ticket/new')} /> : null}
      {data ? (
        <Text style={type.body}>
          {openCount ? `${openCount} open` : 'Nothing open'}{vendorScoped ? ' · tickets assigned to you' : flatScoped ? ' · your flat' : ''}
        </Text>
      ) : null}
      {!flatScoped && tickets.length ? (
        <TextField value={query} onChangeText={setQuery} placeholder="Search ticket, flat, issue or assignee" autoCorrect={false} />
      ) : null}
      {tickets.length ? <Chips options={TICKET_FILTERS} value={filter} onChange={setFilter} /> : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[{ padding: 16, gap: 10, paddingBottom: 32 }, layout.content]}
      keyboardShouldPersistTaps="handled"
      data={shown}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.green]} />}
      ListEmptyComponent={loading ? <Loading label="Loading complaints…" /> : (
        <Text style={[type.body, { textAlign: 'center', paddingVertical: 24 }]}>
          {tickets.length ? 'No complaints match this filter.' : 'No complaints yet.'}
        </Text>
      )}
      renderItem={({ item }) => <TicketCard ticket={item} />}
    />
  );
}

function TicketCard({ ticket }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/ticket/[no]', params: { no: ticket.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.between}>
        <Text style={type.heading}>{ticket.id} · {ticket.category}</Text>
        <Text style={[styles.tag, { color: priorityTone(ticket.priority) }]}>{ticket.priority}</Text>
      </View>
      <Text style={type.body} numberOfLines={2}>{ticket.text}</Text>
      <View style={styles.between}>
        <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>{ticket.flat} · {ticket.owner}</Text>
        <Text style={[styles.tag, { color: statusTone(ticket.status) }]}>{ticket.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 6 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  tag: { fontSize: 13, fontWeight: '700' },
});
