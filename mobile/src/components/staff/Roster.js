import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { colors, type } from '../../theme';
import { Empty } from '../common';

export function Roster({ roster }) {
  const rows = roster?.rows || [];
  const days = roster?.days || [];
  const todayIndex = (new Date().getDay() + 6) % 7;

  if (!rows.length) return <Empty>No roster duties yet. Set up the roster on the web app.</Empty>;

  return (
    <View style={{ gap: 10 }}>
      <Card>
        <Text style={type.kicker}>Today · {days[todayIndex]}</Text>
        {rows.map((r) => (
          <View key={r.id} style={styles.line}>
            <Text style={[type.body, { flex: 1 }]}>{r.duty}</Text>
            <Text style={[styles.who, r.cells[todayIndex]?.isOff && { color: colors.faint }]}>{r.cells[todayIndex]?.who}</Text>
          </View>
        ))}
      </Card>
      {rows.map((r) => (
        <Card key={r.id} style={{ gap: 4 }}>
          <Text style={type.heading}>{r.duty}</Text>
          {r.cells.map((c, i) => (
            <View key={days[i]} style={styles.line}>
              <Text style={[type.small, { width: 40 }, i === todayIndex && { color: colors.green, fontWeight: '700' }]}>{days[i]}</Text>
              <Text style={[type.body, { flex: 1 }, c.isOff && { color: colors.faint }]}>{c.who}</Text>
            </View>
          ))}
        </Card>
      ))}
      <Text style={[type.small, { textAlign: 'center' }]}>Edit the roster on the web app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  who: { fontSize: 15, fontWeight: '600', color: colors.text },
});
