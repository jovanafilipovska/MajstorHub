import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { LoadingView } from '../../components/LoadingView';
import { ThemeToggle } from '../../components/ThemeToggle';
import { RoleSwitcher } from '../../components/RoleSwitcher';
import { CraftsmanProfileEditor } from './CraftsmanProfileEditor';

function ClientAccountCard() {
  const { user, token, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await updateMe({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined }, token);
      await refreshUser();
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleMedium">My Account</Text>
      <TextInput label="Email" value={user?.email ?? ''} mode="outlined" disabled />
      <TextInput label="Full name" value={fullName} onChangeText={setFullName} mode="outlined" />
      <TextInput label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} mode="outlined" />
      {error && <HelperText type="error">{error}</HelperText>}
      {success && <HelperText type="info">{success}</HelperText>}
      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting}>
        Save Changes
      </Button>
    </ScrollView>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const { mode } = useWorkMode();

  if (!user) return <LoadingView />;

  return (
    <View style={styles.root}>
      <View style={styles.toggleContainer}>
        <RoleSwitcher />
        <ThemeToggle />
      </View>
      <View style={styles.content}>{mode === 'craftsman' ? <CraftsmanProfileEditor /> : <ClientAccountCard />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toggleContainer: {
    padding: 16,
    paddingBottom: 0,
    gap: 16,
  },
  content: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
  },
});
