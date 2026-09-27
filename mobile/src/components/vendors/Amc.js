import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay } from '../../format';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly'];

function tone(status) {
  if (status === 'Overdue') return colors.rust;
  if (status === 'Active') return colors.green;
  return colors.amber;
}

export function Amc({ amc, vendors, manage, onDone }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <AmcForm item={editing === 'new' ? null : editing} vendors={vendors} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Add AMC contract" onPress={() => setEditing('new')} /> : null}
      {amc.length === 0 ? <Empty>No AMC contracts yet.</Empty> : null}
      {amc.map((a) => (
        <Item key={a.id} title={a.equip} subtitle={`${a.vendor} · ${a.freq} · next ${a.next}`} meta={a.status} metaTone={tone(a.status)} onPress={manage ? () => setEditing(a) : undefined} />
      ))}
      {manage && amc.length ? <Text style={type.small}>Tap a contract to mark it serviced or change it.</Text> : null}
    </View>
  );
}

function AmcForm({ item, vendors, onClose, onDone }) {
  const [equipment, setEquipment] = useState(item?.equip || '');
  const [vendor, setVendor] = useState(item?.vendorId || '');
  const [frequency, setFrequency] = useState(item?.freq || 'Quarterly');
  const [nextOn, setNextOn] = useState(item?.nextIso || isoDay());
  const { busy, error, setError, submit } = useSubmit(onDone);
  const vendorOptions = [{ value: '', label: 'In-house' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))];

  function save() {
    if (!equipment.trim()) return setError('Enter the equipment.');
    const body = { equipment: equipment.trim(), vendor, frequency, nextOn };
    return item
      ? submit(endpoints.amcItem(item.id), 'PATCH', body, (r) => `${r.equip} updated — next service ${r.next}.`)
      : submit(endpoints.amc, 'POST', body, (r) => `${r.equip} added — next service ${r.next}.`);
  }

  function serviced() {
    Alert.alert(`Mark ${item.equip} serviced today?`, `The next service moves ${frequency.toLowerCase()} ahead from today.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Serviced', onPress: () => submit(endpoints.amcServiced(item.id), 'POST', undefined, (r) => `${r.equip} serviced — next service ${r.next}.`) },
    ]);
  }

  function remove() {
    confirmDelete(`Delete the AMC for ${item.equip}?`, 'This removes the contract and its reminders.', () => submit(endpoints.amcItem(item.id), 'DELETE', undefined, `AMC for ${item.equip} deleted.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{item ? item.equip : 'Add AMC contract'}</Text>
      {item ? <Button title="Mark serviced today" onPress={serviced} disabled={busy} /> : null}
      <TextField label="Equipment" value={equipment} onChangeText={setEquipment} placeholder="Lift 1 (Block A)" maxLength={120} />
      <View style={{ gap: 6 }}>
        <FieldLabel>Vendor</FieldLabel>
        <Chips options={vendorOptions} value={vendor} onChange={setVendor} />
      </View>
      <View style={{ gap: 6 }}>
        <FieldLabel>Service every</FieldLabel>
        <Chips options={FREQUENCIES} value={frequency} onChange={setFrequency} />
      </View>
      <DateField label="Next service" value={nextOn} onChange={setNextOn} />
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" variant={item ? 'outline' : 'primary'} onPress={save} busy={busy} />
      {item ? <Button title="Delete contract" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Back" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
