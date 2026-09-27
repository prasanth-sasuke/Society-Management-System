import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { isoDay } from '../format';
import { colors, radius } from '../theme';

export function TextField({ label, style, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.faint} {...props} />
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function fromIso(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  return y ? new Date(y, m - 1, d) : new Date();
}

// Value is a YYYY-MM-DD string, the same format the API expects.
export function DateField({ label, value, onChange, maximumDate }) {
  const [iosOpen, setIosOpen] = useState(false);
  const pick = (event, date) => {
    if (Platform.OS !== 'android') setIosOpen(false);
    if (event.type === 'set' && date) onChange(isoDay(date));
  };
  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: fromIso(value), mode: 'date', maximumDate, onChange: pick });
    } else {
      setIosOpen(true);
    }
  };
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={open} style={styles.input}>
        <Text style={{ fontSize: 16, color: colors.text }}>{value}</Text>
      </Pressable>
      {iosOpen ? <DateTimePicker value={fromIso(value)} mode="date" display="inline" maximumDate={maximumDate} onChange={pick} /> : null}
    </View>
  );
}

function fromHhmm(value) {
  const d = new Date();
  const [h, m] = String(value || '').split(':').map(Number);
  if (Number.isFinite(h) && Number.isFinite(m)) d.setHours(h, m, 0, 0);
  return d;
}

export function nowHhmm(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Value is "HH:MM" or "" when optional and not set.
export function TimeField({ label, value, onChange, optional }) {
  const [iosOpen, setIosOpen] = useState(false);
  const pick = (event, date) => {
    if (Platform.OS !== 'android') setIosOpen(false);
    if (event.type === 'set' && date) onChange(nowHhmm(date));
  };
  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: fromHhmm(value), mode: 'time', is24Hour: true, onChange: pick });
    } else {
      setIosOpen(true);
    }
  };
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={open} style={[styles.input, { flex: 1 }]}>
          <Text style={{ fontSize: 16, color: value ? colors.text : colors.faint }}>{value || 'Not set'}</Text>
        </Pressable>
        <Pressable onPress={() => onChange(nowHhmm())} style={styles.smallButton}>
          <Text style={styles.chipText}>Now</Text>
        </Pressable>
        {optional && value ? (
          <Pressable onPress={() => onChange('')} style={styles.smallButton}>
            <Text style={styles.chipText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      {iosOpen ? <DateTimePicker value={fromHhmm(value)} mode="time" display="spinner" onChange={pick} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  smallButton: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  label: { fontSize: 13, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
