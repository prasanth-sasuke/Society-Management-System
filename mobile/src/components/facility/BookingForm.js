import { useState } from 'react';
import { Text, View } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Chips, DateField, TextField } from '../fields';
import { Button, Card, Notice } from '../ui';
import { isoDay } from '../../format';
import { colors, type } from '../../theme';
import { FieldLabel, confirmDelete, useSubmit } from '../common';

const DEFAULT_FACILITIES = ['Community hall', 'Party area', 'Gym', 'Swimming pool', 'Sports room', 'Guest suite'];
const PAY = ['Pending', 'Paid', 'Awaiting approval'];

const blankDash = (v) => (v && v !== '—' ? v : '');

// ownFlat is set for resident logins: flat is fixed, and payment details are left to the office.
export function BookingForm({ booking, facilities, ownFlat, onClose, onDone }) {
  const names = [...new Set([...facilities.map((f) => f.name), ...DEFAULT_FACILITIES])];
  const [facility, setFacility] = useState(booking?.facility || names[0]);
  const [flat, setFlat] = useState(ownFlat || booking?.flat || '');
  const [date, setDate] = useState(booking?.dateIso || isoDay());
  const [slot, setSlot] = useState(booking?.slot || '');
  const [charge, setCharge] = useState(blankDash(booking?.charge));
  const [deposit, setDeposit] = useState(blankDash(booking?.deposit));
  const [pay, setPay] = useState(PAY.includes(booking?.pay) ? booking.pay : 'Pending');
  const { busy, error, setError, submit } = useSubmit(onDone);

  function save() {
    if (!flat.trim() || !slot.trim()) return setError(ownFlat ? 'Enter the time slot.' : 'Enter the flat and the time slot.');
    const body = { facility, flat: flat.trim(), date, slot: slot.trim(), charge: charge.trim(), deposit: deposit.trim(), pay };
    return booking
      ? submit(endpoints.booking(booking.id), 'PATCH', body, (r) => `Booking updated: ${r.facility} on ${r.date}.`)
      : submit(endpoints.bookings, 'POST', body, (r) => `${r.facility} booked for ${r.flat} on ${r.date}.`);
  }

  function cancelBooking() {
    confirmDelete('Cancel this booking?', `${booking.facility} on ${booking.date} for ${booking.flat}.`, () => submit(endpoints.booking(booking.id), 'DELETE', undefined, 'Booking cancelled.'));
  }

  return (
    <Card style={{ gap: 14 }}>
      <Text style={type.heading}>{booking ? 'Change booking' : 'New booking'}</Text>
      <View style={{ gap: 6 }}>
        <FieldLabel>Facility</FieldLabel>
        <Chips options={names} value={facility} onChange={setFacility} />
      </View>
      {ownFlat ? (
        <Text style={type.body}>For flat <Text style={{ fontWeight: '700', color: colors.text }}>{ownFlat}</Text></Text>
      ) : (
        <TextField label="Flat" value={flat} onChangeText={setFlat} placeholder="B-2B" autoCapitalize="characters" />
      )}
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Time slot" value={slot} onChangeText={setSlot} placeholder="6–10 pm" maxLength={60} />
      {!ownFlat ? (
        <>
          <TextField label="Charge (optional)" value={charge} onChangeText={setCharge} placeholder="₹3,000" />
          <TextField label="Refundable deposit (optional)" value={deposit} onChangeText={setDeposit} placeholder="₹5,000" />
          <View style={{ gap: 6 }}>
            <FieldLabel>Payment</FieldLabel>
            <Chips options={PAY} value={pay} onChange={setPay} />
          </View>
        </>
      ) : (
        <Text style={type.small}>The society office will confirm the charge and payment.</Text>
      )}
      {error ? <Notice>{error}</Notice> : null}
      <Button title={booking ? 'Save changes' : 'Confirm booking'} onPress={save} busy={busy} />
      {booking ? <Button title="Cancel booking" variant="danger" onPress={cancelBooking} disabled={busy} /> : null}
      <Button title="Back" variant="outline" onPress={onClose} disabled={busy} />
    </Card>
  );
}
