import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { changeMyPassword, deleteMe, updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

export function SettingsScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const theme = useTheme();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [addressText, setAddressText] = useState(user?.addressText ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await updateMe({ fullName: fullName.trim(), addressText: addressText.trim() || undefined }, token);
      await refreshUser();
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const openPasswordDialog = () => {
    setCurrentPassword('');
    setNewPassword('');
    setPasswordError(null);
    setPasswordVisible(true);
  };

  const submitPasswordChange = async () => {
    if (!token) return;
    if (currentPassword.length === 0 || newPassword.length < 8) {
      setPasswordError('Enter your current password and a new password of at least 8 characters.');
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changeMyPassword({ currentPassword, newPassword }, token);
      setPasswordVisible(false);
      setSuccess('Password changed.');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError(null);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!token) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteMe(token);
      await logout();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium">Edit Profile</Text>
        <TextInput label="Full name" value={fullName} onChangeText={setFullName} mode="outlined" />
        <TextInput label="Address (optional)" value={addressText} onChangeText={setAddressText} mode="outlined" />
        {error && <HelperText type="error">{error}</HelperText>}
        {success && <HelperText type="info">{success}</HelperText>}
        <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting}>
          Save Changes
        </Button>
      </View>

      <View style={styles.section}>
        <ThemeToggle />
      </View>

      <View style={styles.section}>
        <Button mode="outlined" icon="lock-outline" onPress={openPasswordDialog}>
          Change Password
        </Button>
        <Button
          mode="outlined"
          icon="delete-outline"
          onPress={openDeleteDialog}
          textColor={theme.colors.error}
          style={{ borderColor: theme.colors.error }}
        >
          Delete Account
        </Button>
      </View>

      <Portal>
        <Dialog visible={passwordVisible} onDismiss={() => setPasswordVisible(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry
            />
            <TextInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
            />
            {passwordError && <HelperText type="error">{passwordError}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordVisible(false)} disabled={changingPassword}>
              Cancel
            </Button>
            <Button onPress={submitPasswordChange} loading={changingPassword} disabled={changingPassword}>
              Change
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>Delete account?</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodyMedium">
              This permanently deletes your account and cannot be undone. If you have existing bookings or reviews,
              deletion may be blocked until those are resolved.
            </Text>
            {deleteError && <HelperText type="error">{deleteError}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onPress={confirmDelete} loading={deleting} disabled={deleting} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  dialogContent: {
    gap: 12,
  },
});