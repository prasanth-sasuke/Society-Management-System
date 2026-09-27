import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Empty, Item } from '../../../components/common';
import { BookingForm } from '../../../components/facility/BookingForm';
import { Chips } from '../../../components/fields';
import { Button, Card, Loading, Notice, Screen } from '../../../components/ui';
import { isoDay } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, type } from '../../../theme';

const FILTERS = ['Upcoming', 'Past', 'All'];

function payTone(pay) {
  if (pay === 'Paid') return colors.green;
  if (pay === 'Pending') return colors.amber;
  return colors.muted;
}

function stateTone(state) {
  if (state === 'Available') return colors.green;
  if (state === 'Maintenance') return colors.rust;
  return colors.amber;
}

export default function Facility() {
  const { session } = useSession();
  const scope = session.scope;
  const flatScoped = Boolean(scope && 'flat' in scope);
  const ownFlat = flatScoped ? scope.flat : null;
  const manage = canWrite(session.permissions, 'facility') && !(flatScoped && !ownFlat);
  const facilities = useApi(endpoints.facilities);
  const bookings = useApi(endpoints.bookings);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('Upcoming');
  const [message, setMessage] = useState(null);

  const today = isoDay();
  const shown = useMemo(() => {
    const rows = bookings.data || [];
    if (filter === 'Upcoming') return rows.filter((b) => b.dateIso >= today);
    if (filter === 'Past') return [...rows.filter((b) => b.dateIso < today)].reverse();
    return rows;
  }, [bookings.data, filter, today]);

  const refreshing = facilities.refreshing || bookings.refreshing;
  const refresh = () => Promise.all([facilities.refresh(), bookings.refresh()]);
  const onDone = async (text) => {
    setEditing(null);
    setMessage(text);
    await Promise.all([facilities.reload(), bookings.reload()]);
  };

  if (editing) {
    return (
      <Screen>
        <BookingForm booking={editing === 'new' ? null : editing} facilities={facilities.data || []} ownFlat={ownFlat} onClose={() => setEditing(null)} onDone={onDone} />
      </Screen>
    );
  }

  const error = bookings.error || facilities.error;
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {flatScoped && !ownFlat ? <Notice>{"Your login isn't linked to a flat yet, so you can't book facilities. Ask the society office to link it."}</Notice> : null}
      {message ? <Notice tone="green">{message}</Notice> : null}
      {error ? <Notice>{error.message}</Notice> : null}
      {manage ? <Button title="+ New booking" onPress={() => { setMessage(null); setEditing('new'); }} /> : null}

      {(facilities.data || []).length ? (
        <Card style={{ gap: 0 }}>
          <Text style={[type.heading, { marginBottom: 6 }]}>Facilities</Text>
          {facilities.data.map((f) => (
            <View key={f.id} style={styles.facility}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{f.name}</Text>
                <Text style={type.small}>{f.next} · {f.charge}</Text>
              </View>
              <Text style={[styles.state, { color: stateTone(f.state) }]}>{f.state}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      {bookings.loading && !bookings.data ? <Loading label="Loading bookings…" /> : null}
      {bookings.data && shown.length === 0 ? <Empty>{filter === 'Upcoming' ? 'No upcoming bookings.' : 'No bookings here.'}</Empty> : null}
      {shown.map((b) => (
        <Item
          key={b.id}
          title={`${b.facility} · ${b.date}`}
          subtitle={`${b.slot} · Flat ${b.flat}${b.charge !== '—' ? ` · ${b.charge}` : ''}${b.deposit !== '—' ? ` + ${b.deposit} deposit` : ''}`}
          meta={b.pay}
          metaTone={payTone(b.pay)}
          onPress={manage ? () => { setMessage(null); setEditing(b); } : undefined}
        />
      ))}
      {manage && shown.length ? <Text style={type.small}>Tap a booking to change or cancel it.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  facility: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  state: { fontSize: 13, fontWeight: '700' },
});
