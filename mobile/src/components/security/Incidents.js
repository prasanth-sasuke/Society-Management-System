import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField, TimeField, nowHhmm } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay } from '../../format';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

const STATUSES = ['Under review', 'Closed', 'Closed with warning'];

function tone(status) {
  if (status === 'Under review') return colors.amber;
  if (status === 'Closed with warning') return colors.rust;
  return colors.green;
}

export function Incidents({ data, manage, onDone }) {
  const [editing, setEditing] = useState(null);
  const incidents = data.incidents || [];

  if (editing) {
    return <IncidentForm incident={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Log incident" onPress={() => setEditing('new')} /> : null}
      {incidents.length === 0 ? <Empty>No incidents logged.</Empty> : null}
      {incidents.map((i) => (
        <Item key={i.id} title={i.what} subtitle={i.whenLocal.replace('T', ' ')} meta={i.status} metaTone={tone(i.status)} onPress={manage ? () => setEditing(i) : undefined} />
      ))}
    </View>
  );
}

function IncidentForm({ incident, onClose, onDone }) {
  const [what, setWhat] = useState(incident?.what || '');
  const [date, setDate] = useState(incident ? incident.whenLocal.slice(0, 10) : isoDay());
  const [time, setTime] = useState(incident ? incident.whenLocal.slice(11, 16) : nowHhmm());
  const [status, setStatus] = useState(incident?.status || 'Under review');
  const { busy, error, setError, submit } = useSubmit(onDone);

  function save() {
    if (!what.trim()) return setError('Describe what happened.');
    if (!time) return setError('Pick the time.');
    const body = { what: what.trim(), when: `${date}T${time}`, status };
    return incident
      ? submit(endpoints.incident(incident.id), 'PATCH', body, 'Incident updated.')
      : submit(endpoints.incidents, 'POST', body, 'Incident logged.');
  }

  function remove() {
    confirmDelete('Delete this incident?', 'It will be removed from the register.', () => submit(endpoints.incident(incident.id), 'DELETE', undefined, 'Incident deleted.'));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{incident ? 'Update incident' : 'Log incident'}</Text>
      <TextField label="What happened?" value={what} onChangeText={setWhat} placeholder="Unknown visitor tried to enter B block" multiline maxLength={300} style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <DateField label="Date" value={date} onChange={setDate} maximumDate={new Date()} />
      <TimeField label="Time" value={time} onChange={setTime} />
      <View style={{ gap: 6 }}>
        <FieldLabel>Status</FieldLabel>
        <Chips options={STATUSES} value={status} onChange={setStatus} />
      </View>
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} />
      {incident ? <Button title="Delete incident" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
