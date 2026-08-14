import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useAutoDismiss(error, setError);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(apiErrorMessage(err, t, t.common.genericError));
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
        label={t.auth.login.emailLabel}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
      />
      <TextInput
        label={t.auth.login.passwordLabel}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!passwordVisible}
        right={
          <TextInput.Icon
            icon={passwordVisible ? 'eye-off' : 'eye'}
            onPress={() => setPasswordVisible((visible) => !visible)}
          />
        }
        mode="outlined"
      />

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={!canSubmit}>
        {t.auth.login.submit}
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Register')}>
        {t.auth.login.noAccount}
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
