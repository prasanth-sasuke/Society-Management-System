import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay } from '../../format';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

const STATUSES = ['Scheduled', 'In progress', 'Verified', 'Escalated'];

function tone(f) {
  if (f.status === 'Verified') return colors.green;
  if (f.overdue || f.status === 'Escalated') return colors.rust;
  return colors.amber;
}

export function FollowUps({ followUps, manage, onDone }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <FollowUpForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Add follow-up" onPress={() => setEditing('new')} /> : null}
      {followUps.length === 0 ? <Empty>No follow-ups yet.</Empty> : null}
      {followUps.map((f) => (
        <Item
          key={f.id}
          title={f.task}
          subtitle={`${f.owner} · due ${f.due}${f.overdue ? ' (overdue)' : ''}${f.verifier !== '—' ? ` · verify: ${f.verifier}` : ''}`}
          meta={f.status}
          metaTone={tone(f)}
          onPress={manage ? () => setEditing(f) : undefined}
        />
      ))}
    </View>
  );
}

function FollowUpForm({ item, onClose, onDone }) {
  const [task, setTask] = useState(item?.task || '');
  const [owner, setOwner] = useState(item?.owner || '');
  const [due, setDue] = useState(item?.dueIso || isoDay());
  const [verifier, setVerifier] = useState(item && item.verifier !== '—' ? item.verifier : '');
  const [status, setStatus] = useState(item?.status || 'Scheduled');
  const { busy, error, setError, submit } = useSubmit(onDone);

  function save() {
    if (!task.trim() || !owner.trim()) return setError('Enter the task and who owns it.');
    const body = { task: task.trim(), owner: owner.trim(), due, verifier: verifier.trim(), status };
    return item
      ? submit(endpoints.followUp(item.id), 'PATCH', body, (r) => `${r.task}: ${r.status}.`)
      : submit(endpoints.followUps, 'POST', body, `Follow-up added: ${body.task}.`);
  }

  function remove() {
    confirmDelete('Delete this follow-up?', item.task, () => submit(endpoints.followUp(item.id), 'DELETE', undefined, `Follow-up deleted: ${item.task}.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{item ? 'Update follow-up' : 'Add follow-up'}</Text>
      <TextField label="Task" value={task} onChangeText={setTask} placeholder="Clean terrace drains" maxLength={160} />
      <TextField label="Owner" value={owner} onChangeText={setOwner} placeholder="Murugan" maxLength={80} />
      <DateField label="Due" value={due} onChange={setDue} />
      <TextField label="Verified by (optional)" value={verifier} onChangeText={setVerifier} placeholder="Facility manager" maxLength={80} />
      <View style={{ gap: 6 }}>
        <FieldLabel>Status</FieldLabel>
        <Chips options={STATUSES} value={status} onChange={setStatus} />
      </View>
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} />
      {item ? <Button title="Delete follow-up" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
