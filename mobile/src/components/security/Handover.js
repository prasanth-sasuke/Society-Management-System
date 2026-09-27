import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { colors, type } from '../../theme';
import { Empty, useSubmit } from './common';

export function Handover({ data, manage, onDone }) {
  const [writing, setWriting] = useState(false);
  const notes = data.handover || [];

  if (writing) {
    return <HandoverForm onClose={() => setWriting(false)} onDone={async (m) => { setWriting(false); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Write handover note" onPress={() => setWriting(true)} /> : null}
      {notes.length === 0 ? <Empty>No handover notes yet.</Empty> : null}
      {notes.map((n) => (
        <Card key={n.id} style={{ gap: 4 }}>
          <Text style={type.small}>{n.when}</Text>
          <Text style={[type.body, { color: colors.text }]}>{n.note}</Text>
        </Card>
      ))}
    </View>
  );
}

function HandoverForm({ onClose, onDone }) {
  const [handover, setHandover] = useState('');
  const [note, setNote] = useState('');
  const { busy, error, setError, submit } = useSubmit(onDone);
  const save = () => {
    if (!note.trim()) return setError('Write the handover note.');
    return submit(endpoints.handover, 'POST', { handover: handover.trim(), note: note.trim() }, 'Handover note saved.');
  };
  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>Handover note</Text>
      <TextField label="Handing over (optional)" value={handover} onChangeText={setHandover} placeholder="Morning → Evening" maxLength={60} />
      <TextField label="Note" value={note} onChangeText={setNote} placeholder="Visitor parking full; lift 2 alarm tested" multiline maxLength={500} style={{ minHeight: 100, textAlignVertical: 'top' }} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save note" onPress={save} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
