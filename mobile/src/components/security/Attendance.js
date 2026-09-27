import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, TextField, TimeField, nowHhmm } from '../fields';
import { Button, Card, Notice } from '../ui';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from './common';

const STATUSES = ['Present', 'Late', 'On duty', 'Absent'];

function statusTone(status) {
  if (status === 'Absent') return colors.rust;
  if (status === 'Late') return colors.amber;
  return colors.green;
}

export function Attendance({ data, manage, onDone }) {
  const [editing, setEditing] = useState(null);
  const guards = data.guards || [];

  if (editing) {
    return <GuardForm entry={editing === 'new' ? null : editing} shifts={data.shifts || []} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Mark guard attendance" onPress={() => setEditing('new')} /> : null}
      {guards.length === 0 ? <Empty>No attendance marked today.</Empty> : null}
      {guards.map((g) => (
        <Item
          key={g.id}
          title={`${g.name} · ${g.post}`}
          subtitle={`${g.shift} shift · In ${g.timeIn || '—'} · Out ${g.timeOut || '—'}`}
          meta={g.status}
          metaTone={statusTone(g.status)}
          onPress={manage ? () => setEditing(g) : undefined}
        />
      ))}
      {manage && guards.length ? <Text style={type.small}>Tap an entry to add the out time or change it.</Text> : null}
    </View>
  );
}

function GuardForm({ entry, shifts, onClose, onDone }) {
  const [name, setName] = useState(entry?.name || '');
  const [post, setPost] = useState(entry?.post || '');
  const [shift, setShift] = useState(entry?.shift || shifts.find((s) => s.state === 'On duty')?.name || '');
  const [timeIn, setTimeIn] = useState(entry ? entry.timeIn : nowHhmm());
  const [timeOut, setTimeOut] = useState(entry?.timeOut || '');
  const [status, setStatus] = useState(STATUSES.includes(entry?.status) ? entry.status : 'Present');
  const { busy, error, setError, submit } = useSubmit(onDone);
  const shiftNames = shifts.map((s) => s.name);

  function save() {
    if (!name.trim() || !post.trim() || !shift.trim()) return setError('Enter the guard name, post and shift.');
    const body = { name: name.trim(), post: post.trim(), shift: shift.trim(), timeIn, timeOut, status };
    return entry
      ? submit(endpoints.guard(entry.id), 'PATCH', body, `Attendance updated for ${body.name}.`)
      : submit(endpoints.guards, 'POST', body, `Attendance marked for ${body.name}.`);
  }

  function remove() {
    confirmDelete('Delete this entry?', `Remove today's attendance entry for ${entry.name}.`, () => submit(endpoints.guard(entry.id), 'DELETE', undefined, `Entry for ${entry.name} deleted.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{entry ? 'Edit attendance' : 'Mark attendance (today)'}</Text>
      <TextField label="Guard name" value={name} onChangeText={setName} placeholder="Raju" />
      <TextField label="Post" value={post} onChangeText={setPost} placeholder="Main gate" />
      {shiftNames.length ? (
        <View style={{ gap: 6 }}>
          <FieldLabel>Shift</FieldLabel>
          <Chips options={shiftNames} value={shift} onChange={setShift} />
        </View>
      ) : (
        <TextField label="Shift" value={shift} onChangeText={setShift} placeholder="Morning" />
      )}
      <TimeField label="In time" value={timeIn} onChange={setTimeIn} optional />
      <TimeField label="Out time" value={timeOut} onChange={setTimeOut} optional />
      <View style={{ gap: 6 }}>
        <FieldLabel>Status</FieldLabel>
        <Chips options={STATUSES} value={status} onChange={setStatus} />
      </View>
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} />
      {entry ? <Button title="Delete entry" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
