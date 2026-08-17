import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const t = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'Client' | 'Craftsman'>('Client');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useAutoDismiss(error, setError);

  const validationError = (): string | null => {
    if (firstName.trim().length === 0) return t.auth.register.errors.firstNameRequired;
    if (lastName.trim().length === 0) return t.auth.register.errors.lastNameRequired;
    if (!email.includes('@')) return t.auth.register.errors.invalidEmail;
    if (password.length < 8) return t.auth.register.errors.passwordTooShort;
    return null;
  };

  const onSubmit = async () => {
    const localError = validationError();
    if (localError) {
      setError(localError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        role,
      });
    } catch (err) {
      setError(apiErrorMessage(err, t, t.common.genericError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../../assets/majstorhub_logo.png')} style={styles.logo} resizeMode="contain" />
      <Text variant="headlineMedium" style={styles.title}>
        {t.auth.register.title}
      </Text>

      <View style={styles.form}>
        <TextInput label={t.auth.register.firstNameLabel} value={firstName} onChangeText={setFirstName} mode="outlined" />
        <TextInput label={t.auth.register.lastNameLabel} value={lastName} onChangeText={setLastName} mode="outlined" />
        <TextInput
          label={t.auth.register.emailLabel}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
        />
        <TextInput
          label={t.auth.register.passwordLabel}
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
        <TextInput
          label={t.auth.register.phoneLabel}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          mode="outlined"
        />

        <SegmentedButtons
          value={role}
          onValueChange={(value) => setRole(value as 'Client' | 'Craftsman')}
          buttons={[
            { value: 'Client', label: t.auth.register.roleClient },
            { value: 'Craftsman', label: t.auth.register.roleCraftsman },
          ]}
        />

        {error && <HelperText type="error">{error}</HelperText>}

        <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting}>
          {t.auth.register.submit}
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Login')}>
          {t.auth.register.haveAccount}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 140,
    height: 101,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
});
