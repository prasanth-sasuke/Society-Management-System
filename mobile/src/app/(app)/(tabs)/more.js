import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { apiRequest } from '../../../api/client';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Button, Card, Row, Screen } from '../../../components/ui';
import { API_URL } from '../../../config';
import { MODULE_TABS, tabsFor } from '../../../modules';
import { type } from '../../../theme';

export default function More() {
  const { session, signOut } = useSession();
  const { user, scope } = session;
  const { more } = tabsFor(session);
  const [busy, setBusy] = useState(false);

  const linked = scope && 'flat' in scope ? `Flat ${scope.flat || '— not linked yet'}` : scope && 'vendor' in scope ? `Vendor: ${scope.vendor || 'not linked yet'}` : null;

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You will need your email and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await apiRequest(endpoints.logout, { method: 'POST' }).catch(() => {});
          await signOut();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card>
        <Text style={type.kicker}>Signed in</Text>
        <Text style={type.heading}>{user.fullName}</Text>
        <Text style={type.body}>{user.email}</Text>
        <Text style={type.body}>{user.roleLabel}{linked ? ` · ${linked}` : ''}</Text>
      </Card>

      {more.length ? (
        <Card style={{ gap: 0 }}>
          <Text style={[type.heading, { marginBottom: 4 }]}>Other modules</Text>
          {more.map((key) => (
            <Row key={key} title={MODULE_TABS[key].title} onPress={() => router.push(`/${key}`)} />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={type.kicker}>Server</Text>
        <Text style={type.small}>{API_URL}</Text>
        <Text style={type.small}>Creating logins, generating bills, billing rules and the committee pack stay on the web app.</Text>
      </Card>

      <Button title="Sign out" variant="danger" onPress={confirmSignOut} busy={busy} />
    </Screen>
  );
}
