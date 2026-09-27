import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/AuthContext';
import { Button, Card, Notice } from '../components/ui';
import { colors, radius, type } from '../theme';

export default function SignIn() {
  const { signIn, notice } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [server, setServer] = useState({ state: 'waking', name: null });

  // Wake the free server while the user types, and show the society's name once it answers.
  useEffect(() => {
    let cancelled = false;
    apiRequest(endpoints.publicSociety, { auth: false })
      .then((data) => !cancelled && setServer({ state: 'ready', name: data?.name || null }))
      .catch(() => !cancelled && setServer({ state: 'unreachable', name: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const status = {
    waking: { text: 'Connecting to the server… the first visit can take up to a minute.', color: colors.faint },
    ready: { text: 'Server is ready.', color: colors.green },
    unreachable: { text: "Couldn't reach the server yet. You can still try signing in.", color: colors.rust },
  }[server.state];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Text style={type.kicker}>Society Operations Suite</Text>
            <Text style={type.title}>{server.name || 'Welcome back'}</Text>
            <Text style={type.body}>Sign in with the login your society office gave you.</Text>
          </View>

          <Card style={{ gap: 14 }}>
            {notice ? <Notice>{notice}</Notice> : null}
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
                placeholder="you@example.com"
                placeholderTextColor={colors.faint}
                returnKeyType="next"
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                placeholder="Password"
                placeholderTextColor={colors.faint}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </View>
            {error ? <Notice>{error}</Notice> : null}
            <Button title="Sign in" onPress={submit} busy={busy} />
          </Card>

          <Text style={[type.small, { color: status.color, textAlign: 'center' }]}>{status.text}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 },
  label: { fontSize: 13, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
