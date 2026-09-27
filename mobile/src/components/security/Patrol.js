import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { colors, type } from '../../theme';
import { Empty, Item, useSubmit } from '../common';

function markTone(state) {
  if (state === 'Checked') return colors.green;
  if (state === 'Issue found') return colors.rust;
  return colors.faint;
}

export function Patrol({ data, manage, onDone }) {
  const [issueFor, setIssueFor] = useState(null);
  const [adding, setAdding] = useState(false);
  const points = data.patrol || [];
  const done = points.filter((p) => p.state !== 'Pending').length;
  const { submit, error } = useSubmit(onDone);

  const mark = (p, state, note = '') => submit(endpoints.patrolPoint(p.id), 'PATCH', { point: p.point, state, note }, `${p.point}: ${state}.`);

  function choose(p) {
    Alert.alert(p.point, p.mark, [
      { text: 'Checked — all OK', onPress: () => mark(p, 'Checked') },
      { text: 'Issue found…', onPress: () => setIssueFor(p) },
      { text: 'Back to pending', onPress: () => mark(p, 'Pending') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function reset() {
    Alert.alert('Start a new round?', 'Every checkpoint goes back to Pending.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start round', onPress: () => submit(endpoints.patrolReset, 'POST', undefined, 'New patrol round started.') },
    ]);
  }

  if (issueFor) {
    return <IssueForm point={issueFor} onClose={() => setIssueFor(null)} onDone={async (m) => { setIssueFor(null); await onDone(m); }} />;
  }
  if (adding) {
    return <AddPoint onClose={() => setAdding(false)} onDone={async (m) => { setAdding(false); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {points.length ? <Text style={type.body}>{done} of {points.length} checkpoints done this round.</Text> : null}
      {error ? <Notice>{error}</Notice> : null}
      {points.length === 0 ? <Empty>No patrol checkpoints yet.</Empty> : null}
      {points.map((p) => (
        <Item key={p.id} title={p.point} subtitle={p.state === 'Issue found' ? p.note : undefined} meta={p.state === 'Checked' ? p.mark : p.state} metaTone={markTone(p.state)} onPress={manage ? () => choose(p) : undefined} />
      ))}
      {manage ? (
        <>
          {points.length ? <Text style={type.small}>Tap a checkpoint as you pass it.</Text> : null}
          {points.length ? <Button title="Start a new round" variant="outline" onPress={reset} /> : null}
          <Button title="+ Add checkpoint" variant="outline" onPress={() => setAdding(true)} />
        </>
      ) : null}
    </View>
  );
}

function IssueForm({ point, onClose, onDone }) {
  const [note, setNote] = useState(point.state === 'Issue found' ? point.note : '');
  const { busy, error, setError, submit } = useSubmit(onDone);
  const save = () => {
    if (!note.trim()) return setError('Describe the issue.');
    return submit(endpoints.patrolPoint(point.id), 'PATCH', { point: point.point, state: 'Issue found', note: note.trim() }, `${point.point}: issue reported.`);
  };
  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>Issue at {point.point}</Text>
      <TextField label="What's wrong?" value={note} onChangeText={setNote} placeholder="Gate lock broken" maxLength={200} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Report issue" onPress={save} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}

function AddPoint({ onClose, onDone }) {
  const [point, setPoint] = useState('');
  const { busy, error, setError, submit } = useSubmit(onDone);
  const save = () => {
    if (!point.trim()) return setError('Enter the checkpoint name.');
    return submit(endpoints.patrol, 'POST', { point: point.trim() }, `Checkpoint added: ${point.trim()}.`);
  };
  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>Add checkpoint</Text>
      <TextField label="Checkpoint" value={point} onChangeText={setPoint} placeholder="Basement gate" maxLength={120} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Add" onPress={save} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
