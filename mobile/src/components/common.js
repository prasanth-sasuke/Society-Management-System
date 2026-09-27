import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api/client';
import { colors, radius, type } from '../theme';

// Runs a request for a form: tracks busy/error and hands the result to onDone.
export function useSubmit(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function submit(path, method, body, message) {
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest(path, { method, body });
      setBusy(false);
      await onDone(typeof message === 'function' ? message(result) : message);
      return true;
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return false;
    }
  }
  return { busy, error, setError, submit };
}

export function confirmDelete(title, body, run) {
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: run },
  ]);
}

export function Item({ title, subtitle, meta, metaTone, onPress }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={type.small}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={[styles.meta, { color: metaTone || colors.muted }]}>{meta}</Text> : null}
    </Pressable>
  );
}

export function Empty({ children }) {
  return <Text style={[type.body, { textAlign: 'center', paddingVertical: 16 }]}>{children}</Text>;
}

export function FieldLabel({ children }) {
  return <Text style={{ fontSize: 13, color: colors.muted }}>{children}</Text>;
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
  },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, fontWeight: '700', maxWidth: '45%', textAlign: 'right' },
});
