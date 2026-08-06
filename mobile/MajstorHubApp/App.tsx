import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type PingState =
  | { status: 'loading' }
  | { status: 'success'; body: string }
  | { status: 'error'; message: string };

export default function App() {
  const [ping, setPing] = useState<PingState>({ status: 'loading' });

  const checkPing = useCallback(() => {
    if (!API_URL) {
      setPing({
        status: 'error',
        message: 'EXPO_PUBLIC_API_URL is not set. Check mobile/MajstorHubApp/.env',
      });
      return;
    }

    setPing({ status: 'loading' });
    fetch(`${API_URL}/ping`)
      .then(async (res) => {
        const body = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`);
        setPing({ status: 'success', body });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setPing({ status: 'error', message });
      });
  }, []);

  useEffect(() => {
    checkPing();
  }, [checkPing]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MajstorHub</Text>
      <Text style={styles.subtitle}>API: {API_URL ?? '(not set)'}</Text>

      {ping.status === 'loading' && <ActivityIndicator size="large" />}
      {ping.status === 'success' && (
        <Text style={styles.success}>Connected: {ping.body}</Text>
      )}
      {ping.status === 'error' && (
        <Text style={styles.error}>Failed: {ping.message}</Text>
      )}

      <Button title="Retry" onPress={checkPing} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  success: {
    color: 'green',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});
