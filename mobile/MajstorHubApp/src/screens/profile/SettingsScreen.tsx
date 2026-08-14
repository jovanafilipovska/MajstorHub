import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, HelperText, List, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { changeMyPassword, deleteMe, updateMe } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { apiErrorMessage, useTranslation } from '../../i18n';

export function SettingsScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const { mode } = useWorkMode();
  const theme = useTheme();
  const t = useTranslation();
  const isClient = mode === 'client';

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

  useAutoDismiss(error, setError);
  useAutoDismiss(success, setSuccess);
  useAutoDismiss(passwordError, setPasswordError);
  useAutoDismiss(passwordSuccess, setPasswordSuccess);
  useAutoDismiss(deleteError, setDeleteError);

  const onSubmit = async () => {
    if (!token) return;
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      setError(t.settings.errors.firstLastRequired);
      return;
    }
    if (!email.includes('@')) {
      setError(t.settings.errors.invalidEmail);
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
      setSuccess(t.settings.profileSaved);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.settings.errors.failedToSaveProfile));
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
      setPasswordError(t.settings.errors.currentPasswordRequired);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t.settings.errors.newPasswordTooShort);
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(t.settings.errors.newPasswordSameAsCurrent);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t.settings.errors.passwordsDontMatch);
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changeMyPassword({ currentPassword, newPassword }, token);
      setPasswordVisible(false);
      setPasswordSuccess(t.settings.changePasswordDialog.success);
    } catch (err) {
      setPasswordError(apiErrorMessage(err, t, t.settings.errors.failedToChangePassword));
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
      setDeleteError(apiErrorMessage(err, t, t.settings.errors.failedToDeleteAccount));
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isClient && (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium">{t.settings.personalInfo}</Text>
            <TextInput label={t.settings.firstNameLabel} value={firstName} onChangeText={setFirstName} mode="outlined" />
            <TextInput label={t.settings.lastNameLabel} value={lastName} onChangeText={setLastName} mode="outlined" />
            <TextInput
              label={t.settings.phoneLabel}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              mode="outlined"
            />
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium">{t.settings.account}</Text>
            <TextInput
              label={t.settings.emailLabel}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
            />
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium">{t.settings.address}</Text>
            <TextInput label={t.settings.streetLabel} value={street} onChangeText={setStreet} mode="outlined" />
            <TextInput label={t.settings.numberLabel} value={houseNumber} onChangeText={setHouseNumber} mode="outlined" />
            <TextInput label={t.settings.cityLabel} value={city} onChangeText={setCity} mode="outlined" />
            <TextInput label={t.settings.countryLabel} value={country} onChangeText={setCountry} mode="outlined" />
          </View>

          <View style={styles.section}>
            {error && <HelperText type="error">{error}</HelperText>}
            {success && <HelperText type="info">{success}</HelperText>}
            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting}>
              {t.settings.saveChanges}
            </Button>
          </View>
        </>
      )}

      <View style={styles.section}>
        <ThemeToggle />
      </View>

      <View style={styles.section}>
        <LanguageSwitcher />
      </View>

      {isClient ? (
        <View style={styles.section}>
          <Button mode="outlined" icon="lock-outline" onPress={openPasswordDialog}>
            {t.settings.changePassword}
          </Button>
          {passwordSuccess && <HelperText type="info">{passwordSuccess}</HelperText>}
          <Button
            mode="outlined"
            icon="delete-outline"
            onPress={openDeleteDialog}
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
          >
            {t.settings.deleteAccount}
          </Button>
        </View>
      ) : (
        <View style={styles.section}>
          {passwordSuccess && <HelperText type="info">{passwordSuccess}</HelperText>}
          <Card style={styles.groupCard} mode="contained">
            <List.Item
              title={t.settings.changePassword}
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              onPress={openPasswordDialog}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title={t.settings.deleteAccount}
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="delete-outline" color={theme.colors.error} />}
              onPress={openDeleteDialog}
            />
            <Divider />
            <List.Item
              title={t.common.logOut}
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={() => logout()}
            />
          </Card>
        </View>
      )}

      <Portal>
        <Dialog visible={passwordVisible} onDismiss={() => setPasswordVisible(false)}>
          <Dialog.Title>{t.settings.changePasswordDialog.title}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t.settings.changePasswordDialog.currentPasswordLabel}
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
              label={t.settings.changePasswordDialog.newPasswordLabel}
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
              label={t.settings.changePasswordDialog.confirmPasswordLabel}
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
              {t.common.cancel}
            </Button>
            <Button onPress={submitPasswordChange} loading={changingPassword} disabled={changingPassword}>
              {t.settings.changePasswordDialog.change}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>{t.settings.deleteDialog.title}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodyMedium">{t.settings.deleteDialog.body}</Text>
            {deleteError && <HelperText type="error">{deleteError}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button onPress={confirmDelete} loading={deleting} disabled={deleting} textColor={theme.colors.error}>
              {t.common.delete}
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
  groupCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dialogContent: {
    gap: 12,
  },
});