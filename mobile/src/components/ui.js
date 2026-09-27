import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, type } from '../theme';

export function Screen({ children, refreshing = false, onRefresh }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Kpi({ label, value, note, tone = colors.text }) {
  return (
    <View style={styles.kpi}>
      <Text style={type.small}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {note ? <Text style={type.small}>{note}</Text> : null}
    </View>
  );
}

export function KpiGrid({ children }) {
  return <View style={styles.grid}>{children}</View>;
}

export function Button({ title, onPress, disabled, busy, variant = 'primary' }) {
  const danger = variant === 'danger';
  const outline = variant === 'outline' || danger;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        outline ? { backgroundColor: colors.card, borderWidth: 1, borderColor: danger ? colors.rust : colors.inputBorder } : null,
        (pressed || disabled || busy) && { opacity: 0.7 },
      ]}
    >
      {busy ? <ActivityIndicator color={outline ? colors.green : '#fff'} /> : (
        <Text style={[styles.buttonText, outline ? { color: danger ? colors.rust : colors.text } : null]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Notice({ tone = 'rust', children }) {
  const soft = tone === 'green' ? colors.greenSoft : colors.rustSoft;
  const fg = tone === 'green' ? colors.green : colors.rust;
  return (
    <View style={[styles.notice, { backgroundColor: soft }]}>
      <Text style={{ color: fg, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.green} />
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

export function Row({ title, subtitle, onPress, right }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={type.small}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export function TabGlyph({ glyph, color, focused }) {
  return (
    <View style={[styles.glyph, { borderColor: color, backgroundColor: focused ? color : 'transparent' }]}>
      <Text style={[styles.glyphText, { color: focused ? '#fff' : color }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.card, padding: 16, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
    gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: '700' },
  button: { backgroundColor: colors.green, borderRadius: radius.control, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notice: { borderRadius: radius.control, padding: 12 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  rowTitle: { fontSize: 15, color: colors.text, fontWeight: '600' },
  chevron: { fontSize: 24, color: colors.faint },
  glyph: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontSize: 13, fontWeight: '700' },
});
