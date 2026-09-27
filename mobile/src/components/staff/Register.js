import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { colors, type } from '../../theme';
import { Empty, FieldLabel, Item, confirmDelete, useSubmit } from '../common';

const PAYOUTS = ['Pending', 'Processed', 'Hold'];

function payoutTone(status) {
  if (status === 'Processed') return colors.green;
  if (status === 'Hold') return colors.rust;
  return colors.amber;
}

export function Register({ staff, manage, onDone }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    return <StaffForm member={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={async (m) => { setEditing(null); await onDone(m); }} />;
  }

  return (
    <View style={{ gap: 10 }}>
      {manage ? <Button title="+ Add staff member" onPress={() => setEditing('new')} /> : null}
      {staff.length === 0 ? <Empty>No staff in the register yet.</Empty> : null}
      {staff.map((s) => (
        <Item
          key={s.id}
          title={`${s.name} · ${s.role}`}
          subtitle={`${s.area !== '—' ? `${s.area} · ` : ''}Present ${s.present} this month · ${s.salary}${s.today ? ` · Today: ${s.today}` : ''}`}
          meta={s.payout}
          metaTone={payoutTone(s.payoutStatus)}
          onPress={manage ? () => setEditing(s) : undefined}
        />
      ))}
    </View>
  );
}

function StaffForm({ member, onClose, onDone }) {
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [area, setArea] = useState(member && member.area !== '—' ? member.area : '');
  const [salary, setSalary] = useState(member ? String(member.salaryAmount) : '');
  const [workingDays, setWorkingDays] = useState(String(member?.workingDays ?? 26));
  const [payout, setPayout] = useState(member?.payoutStatus || 'Pending');
  const [payoutNote, setPayoutNote] = useState(member?.payoutNote || '');
  const { busy, error, setError, submit } = useSubmit(onDone);

  function save() {
    if (!name.trim() || !role.trim() || !salary.trim()) return setError('Enter the name, role and monthly salary.');
    const body = { name: name.trim(), role: role.trim(), area: area.trim(), salary: salary.trim(), workingDays: workingDays.trim(), payout, payoutNote: payout === 'Hold' ? payoutNote.trim() : '' };
    return member
      ? submit(endpoints.staffMember(member.id), 'PATCH', body, `${body.name} updated.`)
      : submit(endpoints.staff, 'POST', body, `${body.name} added to the staff register.`);
  }

  function remove() {
    confirmDelete(`Remove ${member.name}?`, 'Their attendance history is deleted too.', () => submit(endpoints.staffMember(member.id), 'DELETE', undefined, `${member.name} removed.`));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{member ? 'Edit staff member' : 'Add staff member'}</Text>
      <TextField label="Full name" value={name} onChangeText={setName} placeholder="Lakshmi" />
      <TextField label="Role" value={role} onChangeText={setRole} placeholder="Housekeeping" />
      <TextField label="Duty area (optional)" value={area} onChangeText={setArea} placeholder="Block A & B common areas" />
      <TextField label="Monthly salary (₹)" value={salary} onChangeText={setSalary} keyboardType="number-pad" placeholder="14000" />
      <TextField label="Working days per month" value={workingDays} onChangeText={setWorkingDays} keyboardType="number-pad" />
      <View style={{ gap: 6 }}>
        <FieldLabel>Salary this month</FieldLabel>
        <Chips options={PAYOUTS} value={payout} onChange={setPayout} />
      </View>
      {payout === 'Hold' ? <TextField label="Hold reason" value={payoutNote} onChangeText={setPayoutNote} placeholder="Bank details pending" maxLength={120} /> : null}
      {error ? <Notice>{error}</Notice> : null}
      <Button title="Save" onPress={save} busy={busy} />
      {member ? <Button title="Remove from register" variant="danger" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
