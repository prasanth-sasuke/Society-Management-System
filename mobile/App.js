import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://society-operations-suite.onrender.com').replace(/\/$/, '');

export default function App() {
  const [state, setState] = useState({ status: 'idle', message: 'Not checked yet' });

  async function checkServer() {
    setState({ status: 'loading', message: 'Contacting the server… (a sleeping free server can take up to a minute)' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState({ status: 'ok', message: `API is up · database ${data.db}` });
      } else {
        setState({ status: 'error', message: `Server answered with HTTP ${res.status}` });
      }
    } catch (err) {
      setState({ status: 'error', message: err.name === 'AbortError' ? 'Timed out after 90 seconds' : `Could not reach the server: ${err.message}` });
    } finally {
      clearTimeout(timer);
    }
  }

  const tone = state.status === 'ok' ? '#1e6b52' : state.status === 'error' ? '#b0491a' : '#5f5f57';

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Society Operations Suite</Text>
        <Text style={styles.title}>Mobile test app</Text>
        <Text style={styles.body}>Phase 10 check: this screen is running on your Android phone through Expo Go.</Text>

        <Text style={styles.label}>API</Text>
        <Text style={styles.mono}>{API_URL}</Text>

        <Pressable
          onPress={checkServer}
          disabled={state.status === 'loading'}
          style={({ pressed }) => [styles.button, (pressed || state.status === 'loading') && styles.buttonDim]}
        >
          <Text style={styles.buttonText}>Check server connection</Text>
        </Pressable>

        <View style={styles.result}>
          {state.status === 'loading' ? <ActivityIndicator color="#1e6b52" /> : null}
          <Text style={[styles.resultText, { color: tone }]}>{state.message}</Text>
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f3ed',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e8e4d9',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#8a8a80',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2a2a28',
    marginTop: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f5f57',
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8a8a80',
    marginTop: 22,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#2a2a28',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1e6b52',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonDim: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    minHeight: 24,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
