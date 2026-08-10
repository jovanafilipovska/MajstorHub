import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        MajstorHub
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
      />

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={!canSubmit}>
        Log In
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
});
