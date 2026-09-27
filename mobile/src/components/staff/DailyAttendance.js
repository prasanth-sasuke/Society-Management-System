import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { DateField } from '../fields';
import { Button, Card, Loading, Notice } from '../ui';
import { colors, radius, type } from '../../theme';
import { Empty, useSubmit } from '../common';

const MARKS = [
  { status: 'Present', short: 'P', tone: colors.green },
  { status: 'Half day', short: '½', tone: colors.amber },
  { status: 'Leave', short: 'L', tone: colors.muted },
  { status: 'Absent', short: 'A', tone: colors.rust },
];

function marksFrom(sheet) {
  return Object.fromEntries((sheet?.rows || []).map((r) => [r.staffId, r.status]));
}

export function DailyAttendance({ date, onDate, sheet, loading, manage, onDone }) {
  const [marks, setMarks] = useState(() => marksFrom(sheet));
  const [loadedSheet, setLoadedSheet] = useState(sheet);
  const { busy, error, submit } = useSubmit(onDone);

  // A fresh sheet from the server (new date, save or refresh) replaces unsaved taps.
  if (sheet !== loadedSheet) {
    setLoadedSheet(sheet);
    setMarks(marksFrom(sheet));
  }

  const rows = sheet?.date === date ? sheet.rows : [];
  const set = (id, status) => setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? '' : status }));
  const allPresent = () => setMarks(Object.fromEntries(rows.map((r) => [r.staffId, 'Present'])));
  const save = () => submit(
    endpoints.staffAttendance,
    'PUT',
    { date, entries: rows.map((r) => ({ staffId: r.staffId, status: marks[r.staffId] || '' })) },
    (r) => `Saved for ${r.label}: ${r.present} present, ${r.halfDay} half day, ${r.leave} on leave, ${r.absent} absent.`,
  );
  const unmarked = rows.filter((r) => !marks[r.staffId]).length;

  return (
    <View style={{ gap: 10 }}>
      <DateField label="Attendance for" value={date} onChange={onDate} maximumDate={new Date()} />
      {loading && sheet?.date !== date ? <Loading label="Loading attendance…" /> : null}
      {!loading && rows.length === 0 ? <Empty>No staff in the register yet. Add them under Staff.</Empty> : null}
      {rows.length ? (
        <>
          {manage ? <Button title="Mark everyone present" variant="outline" onPress={allPresent} /> : null}
          {rows.map((r) => (
            <Card key={r.staffId} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={type.small}>{r.role}</Text>
              </View>
              <View style={styles.marks}>
                {MARKS.map((m) => {
                  const active = marks[r.staffId] === m.status;
                  return (
                    <Pressable
                      key={m.status}
                      disabled={!manage}
                      onPress={() => set(r.staffId, m.status)}
                      accessibilityLabel={`${r.name}: ${m.status}`}
                      style={[styles.mark, { borderColor: m.tone }, active && { backgroundColor: m.tone }]}
                    >
                      <Text style={[styles.markText, { color: active ? '#fff' : m.tone }]}>{m.short}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
          <Text style={type.small}>P present · ½ half day · L leave · A absent. Tap again to clear.{unmarked ? ` ${unmarked} not marked.` : ''}</Text>
          {error ? <Notice>{error}</Notice> : null}
          {manage ? <Button title="Save attendance" onPress={save} busy={busy} /> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  marks: { flexDirection: 'row', gap: 6 },
  mark: { width: 36, height: 36, borderRadius: radius.control, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 15, fontWeight: '700' },
});
