import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { colors, type } from '../../theme';
import { CallButton, Empty, Item } from '../common';

export function VendorList({ vendors }) {
  if (!vendors.length) return <Empty>No vendors yet. Add them from the web app.</Empty>;
  return (
    <View style={{ gap: 10 }}>
      {vendors.map((v) => (
        <Card key={v.id} style={styles.vendor}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.heading}>{v.name}</Text>
            <Text style={type.small}>{v.service} · {v.value}{v.renewal !== '—' ? ` · renews ${v.renewal}` : ''}</Text>
            <Text style={[type.small, { color: String(v.pay).toLowerCase().includes('due') ? colors.rust : colors.faint }]}>{v.pay}</Text>
          </View>
          <CallButton phone={v.phone} name={v.name} />
        </Card>
      ))}
    </View>
  );
}

function conditionTone(condition) {
  if (condition === 'Good') return colors.green;
  if (condition === 'Out of service' || condition === 'Under repair') return colors.rust;
  return colors.amber;
}

export function AssetList({ assets }) {
  if (!assets.length) return <Empty>No assets registered. Add them from the web app.</Empty>;
  return (
    <View style={{ gap: 10 }}>
      {assets.map((a) => (
        <Item key={a.id} title={`${a.tag} · ${a.name}`} subtitle={`${a.category} · ${a.location}${a.amc && a.amc !== '—' ? ` · ${a.amc}` : ''}`} meta={a.condition} metaTone={conditionTone(a.condition)} />
      ))}
    </View>
  );
}

export function Reminders({ reminders }) {
  if (!reminders.length) return <Empty>Nothing due in the next 30 days.</Empty>;
  return (
    <View style={{ gap: 10 }}>
      {reminders.map((r, i) => (
        <Item key={`${r.date}-${i}`} title={r.what} subtitle={r.date} meta={r.when} metaTone={r.when.startsWith('Overdue') ? colors.rust : r.when === 'Today' || r.when === 'Tomorrow' ? colors.amber : colors.muted} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  vendor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
