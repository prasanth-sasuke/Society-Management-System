import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { apiRequest } from '../../../api/client';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips, TextField } from '../../../components/fields';
import { Button, Card, Loading, Notice, Screen } from '../../../components/ui';
import { CATEGORIES, PRIORITIES, STATUSES, isResolved, priorityTone, statusTone, updateBody } from '../../../features/tickets';
import { when } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, type } from '../../../theme';

export default function TicketDetail() {
  const { no, fresh } = useLocalSearchParams();
  const { session } = useSession();
  const { data: ticket, error, loading, refreshing, refresh, reload } = useApi(endpoints.ticket(no));
  const [mode, setMode] = useState(null);
  const [message, setMessage] = useState(fresh ? { tone: 'green', text: `Complaint ${no} raised.` } : null);

  const writable = canWrite(session.permissions, 'helpdesk');
  const flatScoped = Boolean(session.scope && 'flat' in session.scope);

  if (!ticket) {
    return (
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <Stack.Screen options={{ title: String(no) }} />
        {loading ? <Loading label="Loading complaint…" /> : <Notice>{error?.message || 'Complaint not found.'}</Notice>}
      </Screen>
    );
  }

  async function save(changes, done) {
    const r = await apiRequest(endpoints.ticketUpdate(ticket.dbId), { method: 'PATCH', body: updateBody(ticket, changes) });
    setMode(null);
    setMessage({ tone: 'green', text: done || `${r.id} updated — ${r.status}.` });
    await reload();
  }

  function markResolved() {
    Alert.alert('Mark as resolved?', 'Only do this once the problem is fixed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolved', onPress: () => save({ status: 'Resolved', note: 'Resident confirmed it is fixed' }, 'Marked resolved. Thank you!').catch((err) => setMessage({ tone: 'rust', text: err.message })) },
    ]);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: ticket.id }} />
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <Card>
        <View style={styles.between}>
          <Text style={type.heading}>{ticket.category}</Text>
          <Text style={[styles.tag, { color: priorityTone(ticket.priority) }]}>{ticket.priority} priority</Text>
        </View>
        <Text style={[type.body, { color: colors.text }]}>{ticket.text}</Text>
        <Text style={type.small}>{ticket.flat} · Assigned to {ticket.owner}</Text>
        <Text style={[styles.tag, { color: statusTone(ticket.status) }]}>{ticket.status}</Text>
      </Card>

      <Card>
        <Text style={type.heading}>History</Text>
        {(ticket.events || []).length === 0 ? <Text style={type.body}>No updates yet.</Text> : null}
        {[...(ticket.events || [])].reverse().map((e, i) => (
          <View key={`${e.when}-${i}`} style={styles.event}>
            <View style={[styles.dot, i === 0 && { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { color: colors.text }]}>{e.what}</Text>
              <Text style={type.small}>{when(e.when)}</Text>
            </View>
          </View>
        ))}
      </Card>

      {writable && mode === 'update' && !flatScoped ? (
        <UpdateForm ticket={ticket} onCancel={() => setMode(null)} onSave={save} />
      ) : null}
      {writable && mode === 'note' ? (
        <NoteForm onCancel={() => setMode(null)} onSave={(note) => save({ note }, 'Note added.')} />
      ) : null}

      {writable && !mode ? (
        <View style={{ gap: 10 }}>
          {!flatScoped ? <Button title="Update ticket" onPress={() => { setMessage(null); setMode('update'); }} /> : null}
          <Button title="Add a note" variant="outline" onPress={() => { setMessage(null); setMode('note'); }} />
          {flatScoped && !isResolved(ticket) ? <Button title="It's fixed — mark resolved" variant="outline" onPress={markResolved} /> : null}
        </View>
      ) : null}
    </Screen>
  );
}

function NoteForm({ onCancel, onSave }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!note.trim()) return setError('Write a note first.');
    setBusy(true);
    setError(null);
    try {
      await onSave(note.trim().slice(0, 300));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: 14 }}>
      <TextField label="Note" value={note} onChangeText={setNote} placeholder="e.g. Still leaking after the visit" multiline maxLength={300} style={{ minHeight: 80, textAlignVertical: 'top' }} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Add note" onPress={submit} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onCancel} disabled={busy} />
    </Card>
  );
}

function UpdateForm({ ticket, onCancel, onSave }) {
  const [status, setStatus] = useState(ticket.status);
  const [owner, setOwner] = useState(ticket.owner);
  const [priority, setPriority] = useState(ticket.priority);
  const [category, setCategory] = useState(ticket.category);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!owner.trim()) return setError('Enter who it is assigned to.');
    setBusy(true);
    setError(null);
    try {
      await onSave({ status, owner: owner.trim(), priority, category, ...(note.trim() ? { note: note.trim().slice(0, 300) } : {}) });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const label = (text) => <Text style={{ fontSize: 13, color: colors.muted }}>{text}</Text>;
  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>Update ticket</Text>
      <View style={{ gap: 6 }}>{label('Status')}<Chips options={STATUSES} value={status} onChange={setStatus} /></View>
      <TextField label="Assigned to" value={owner} onChangeText={setOwner} />
      <View style={{ gap: 6 }}>{label('Priority')}<Chips options={PRIORITIES} value={priority} onChange={setPriority} /></View>
      <View style={{ gap: 6 }}>{label('Category')}<Chips options={CATEGORIES} value={category} onChange={setCategory} /></View>
      <TextField label="Update note (optional)" value={note} onChangeText={setNote} placeholder="Replaced the tap washer" maxLength={300} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save update" onPress={submit} busy={busy} />
      <Button title="Cancel" variant="outline" onPress={onCancel} disabled={busy} />
    </Card>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  tag: { fontSize: 13, fontWeight: '700' },
  event: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.inputBorder, marginTop: 6 },
});
