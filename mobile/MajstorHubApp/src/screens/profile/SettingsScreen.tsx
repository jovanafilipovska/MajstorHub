import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { changeMyPassword, deleteMe, updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

export function SettingsScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const theme = useTheme();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [street, setStreet] = useState(user?.street ?? '');
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!passwordSuccess) return;
    const timeout = setTimeout(() => setPasswordSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [passwordSuccess]);

  const onSubmit = async () => {
    if (!token) return;
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      setError('First and last name are required.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await updateMe(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          email: email.trim(),
          street: street.trim() || undefined,
          houseNumber: houseNumber.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
        },
        token,
      );
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
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordVisible(true);
  };

  const submitPasswordChange = async () => {
    if (!token) return;
    if (currentPassword.length === 0) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from the current password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changeMyPassword({ currentPassword, newPassword }, token);
      setPasswordVisible(false);
      setPasswordSuccess('Password changed successfully.');
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
        <Text variant="titleMedium">Personal Info</Text>
        <TextInput label="First name" value={firstName} onChangeText={setFirstName} mode="outlined" />
        <TextInput label="Last name" value={lastName} onChangeText={setLastName} mode="outlined" />
        <TextInput
          label="Mobile phone (optional)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          mode="outlined"
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">Account</Text>
        <TextInput
          label="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium">Address</Text>
        <TextInput label="Street (optional)" value={street} onChangeText={setStreet} mode="outlined" />
        <TextInput label="Number (optional)" value={houseNumber} onChangeText={setHouseNumber} mode="outlined" />
        <TextInput label="City (optional)" value={city} onChangeText={setCity} mode="outlined" />
        <TextInput label="Country (optional)" value={country} onChangeText={setCountry} mode="outlined" />
      </View>

      <View style={styles.section}>
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
        {passwordSuccess && <HelperText type="info">{passwordSuccess}</HelperText>}
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
              secureTextEntry={!showCurrentPassword}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowCurrentPassword((visible) => !visible)}
                />
              }
            />
            <TextInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPassword((visible) => !visible)}
                />
              }
            />
            <TextInput
              label="Confirm new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              mode="outlined"
              secureTextEntry={!showConfirmNewPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmNewPassword((visible) => !visible)}
                />
              }
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