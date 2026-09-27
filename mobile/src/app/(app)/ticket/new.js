import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { apiRequest } from '../../../api/client';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips, TextField } from '../../../components/fields';
import { Button, Card, Notice, Screen } from '../../../components/ui';
import { CATEGORIES, DEFAULT_OWNER, PRIORITIES } from '../../../features/tickets';
import { colors, type } from '../../../theme';

export default function NewTicket() {
  const { session } = useSession();
  const ownFlat = session.scope && 'flat' in session.scope ? session.scope.flat : null;
  const [flat, setFlat] = useState(ownFlat || '');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [owner, setOwner] = useState(ownFlat ? DEFAULT_OWNER : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!flat.trim() || !text.trim() || !owner.trim()) {
      setError(ownFlat ? 'Describe the issue.' : 'Fill in the flat or location, the issue and who it is assigned to.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest(endpoints.tickets, {
        method: 'POST',
        body: { flat: flat.trim(), category, text: text.trim(), priority, owner: owner.trim() },
      });
      router.replace({ pathname: '/ticket/[no]', params: { no: created.id, fresh: '1' } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'New complaint' }} />
      <Card style={{ gap: 14 }}>
        {ownFlat ? (
          <Text style={type.body}>For flat <Text style={{ fontWeight: '700', color: colors.text }}>{ownFlat}</Text>. The society office will assign it.</Text>
        ) : (
          <TextField label="Flat / location" value={flat} onChangeText={setFlat} placeholder="C-2A or Clubhouse" autoCapitalize="characters" />
        )}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>Category</Text>
          <Chips options={CATEGORIES} value={category} onChange={setCategory} />
        </View>
        <TextField label="What's the problem?" value={text} onChangeText={setText} placeholder="Describe the issue" multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>Priority</Text>
          <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
        </View>
        {!ownFlat ? <TextField label="Assign to" value={owner} onChangeText={setOwner} placeholder="Suresh (electrician) or a vendor name" /> : null}
        {error ? <Notice>{error}</Notice> : null}
        <Button title="Raise complaint" onPress={submit} busy={busy} />
      </Card>
    </Screen>
  );
}
