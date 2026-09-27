import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay } from '../../format';
import { type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

export function Breakdowns({ breakdowns, assets, manage, onDone }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <BreakdownForm item={editing === 'new' ? null : editing} assets={assets} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Log breakdown" onPress={() => setEditing('new')} /> : null}
      {breakdowns.length === 0 ? <Empty>No breakdowns logged.</Empty> : null}
      {breakdowns.map((b) => (
        <Item key={b.id} title={b.what} subtitle={[b.asset, b.note].filter(Boolean).join(' · ') || undefined} meta={b.whenLabel} onPress={manage ? () => setEditing(b) : undefined} />
      ))}
    </View>
  );
}

function BreakdownForm({ item, assets, onClose, onDone }) {
  const [asset, setAsset] = useState(item?.assetId || '');
  const [what, setWhat] = useState(item?.what || '');
  const [date, setDate] = useState(item?.when || isoDay());
  const [note, setNote] = useState(item?.note || '');
  const { busy, error, setError, submit } = useSubmit(onDone);
  const assetOptions = [{ value: '', label: 'No asset' }, ...assets.map((a) => ({ value: a.id, label: `${a.tag} — ${a.name}` }))];

  function save() {
    if (!what.trim()) return setError('Describe what broke.');
    const body = { asset, what: what.trim(), date, note: note.trim() };
    return item
      ? submit(endpoints.breakdown(item.id), 'PATCH', body, (r) => `Breakdown updated: ${r.what}.`)
      : submit(endpoints.breakdowns, 'POST', body, (r) => `Breakdown logged: ${r.what}.`);
  }

  function remove() {
    confirmDelete('Delete this breakdown?', item.what, () => submit(endpoints.breakdown(item.id), 'DELETE', undefined, `Breakdown deleted: ${item.what}.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{item ? 'Update breakdown' : 'Log breakdown'}</Text>
      {assets.length ? (
        <View style={{ gap: 6 }}>
          <FieldLabel>Asset</FieldLabel>
          <Chips options={assetOptions} value={asset} onChange={setAsset} />
        </View>
      ) : null}
      <TextField label="What broke?" value={what} onChangeText={setWhat} placeholder="Borewell pump tripped" maxLength={200} />
      <DateField label="When" value={date} onChange={setDate} maximumDate={new Date()} />
      <TextField label="Notes (optional)" value={note} onChangeText={setNote} placeholder="Electrician called; capacitor replaced" multiline maxLength={500} style={{ minHeight: 80, textAlignVertical: 'top' }} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} />
      {item ? <Button title="Delete breakdown" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Back" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
