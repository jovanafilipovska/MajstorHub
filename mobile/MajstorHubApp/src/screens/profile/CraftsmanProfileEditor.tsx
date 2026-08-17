import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  HelperText,
  Icon,
  List,
  Menu,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { createMyProfile, getCraftsmanProfile, updateMyProfile } from '../../api/craftsmen';
import { listServiceCategories, suggestServiceCategory } from '../../api/serviceCategories';
import { changeMyPassword, deleteMe, removeMyPhoto, uploadMyPhoto } from '../../api/users';
import { ApiError, resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { LoadingView } from '../../components/LoadingView';
import { RoleSwitcher } from '../../components/RoleSwitcher';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export function CraftsmanProfileEditor() {
  const { user, token, refreshUser, logout } = useAuth();
  const { refreshHasCraftsmanProfile } = useWorkMode();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addressText, setAddressText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // The backend always saves the avatar to the same deterministic filename
  // (userId + extension), so the URL never changes between uploads and the
  // Image component's cache would otherwise keep showing the old bytes -
  // this nonce busts that cache after every upload/remove.
  const [photoVersion, setPhotoVersion] = useState(0);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestVisible, setSuggestVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

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

  useAutoDismiss(locationError, setLocationError);
  useAutoDismiss(error, setError);
  useAutoDismiss(success, setSuccess);
  useAutoDismiss(suggestError, setSuggestError);
  useAutoDismiss(passwordError, setPasswordError);
  useAutoDismiss(passwordSuccess, setPasswordSuccess);
  useAutoDismiss(deleteError, setDeleteError);

  const captureLocation = useCallback(async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t.craftsmanProfileEditor.errors.locationPermission);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch {
      setLocationError(t.craftsmanProfileEditor.errors.locationFailed);
    } finally {
      setLocating(false);
    }
  }, [t]);

  const load = useCallback(() => {
    if (!user) return;
    setError(null);
    Promise.all([listServiceCategories(), getCraftsmanProfile(user.id).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    })])
      .then(([categoriesResult, profile]: [ServiceCategoryResponse[], CraftsmanProfileResponse | null]) => {
        if (profile && !categoriesResult.some((c) => c.id === profile.serviceCategoryId)) {
          // Own category is still pending admin approval, so it won't be in the public list yet.
          categoriesResult = [
            ...categoriesResult,
            { id: profile.serviceCategoryId, name: profile.serviceCategoryName, isApproved: false },
          ];
        }
        setCategories(categoriesResult);
        if (profile) {
          setMode('edit');
          setBusinessName(profile.businessName ?? '');
          setCategoryId(profile.serviceCategoryId);
          setBio(profile.bio ?? '');
          setHourlyRate(String(profile.hourlyRate));
          setYearsOfExperience(profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : '');
          setLatitude(profile.latitude ?? null);
          setLongitude(profile.longitude ?? null);
          setAddressText(profile.addressText ?? '');
        } else {
          setMode('create');
          captureLocation();
        }
      })
      .catch((err) => setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToLoadProfile)));
  }, [user, captureLocation, t]);

  useFocusEffect(load);

  const openSuggest = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setSuggestError(null);
    setSuggestVisible(true);
  };

  const submitSuggest = async () => {
    if (!token) return;
    if (newCategoryName.trim().length === 0) {
      setSuggestError(t.craftsmanProfileEditor.errors.categoryNameRequired);
      return;
    }
    setSuggestError(null);
    setSuggesting(true);
    try {
      const created = await suggestServiceCategory(
        { name: newCategoryName.trim(), description: newCategoryDescription.trim() || undefined },
        token,
      );
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id);
      setSuggestVisible(false);
      setSuccess(t.craftsmanProfileEditor.suggestDialog.successMessage);
    } catch (err) {
      setSuggestError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToAddCategory));
    } finally {
      setSuggesting(false);
    }
  };

  const choosePhoto = async () => {
    setPhotoMenuVisible(false);
    if (!token) return;
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t.craftsmanProfileEditor.errors.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingPhoto(true);
    try {
      await uploadMyPhoto(result.assets[0].uri, token);
      await refreshUser();
      setPhotoVersion((v) => v + 1);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToUpdatePhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setPhotoMenuVisible(false);
    if (!token) return;
    setError(null);
    setUploadingPhoto(true);
    try {
      await removeMyPhoto(token);
      await refreshUser();
      setPhotoVersion((v) => v + 1);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToRemovePhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onPhotoPress = () => {
    if (user?.profileImageUrl) {
      setPhotoMenuVisible(true);
    } else {
      choosePhoto();
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

  if (!user || mode === null) return <LoadingView />;

  const parsedRate = Number(hourlyRate);
  const parsedYears = yearsOfExperience.trim() ? Number(yearsOfExperience) : undefined;

  const validationError = (): string | null => {
    if (categoryId === null) return t.craftsmanProfileEditor.errors.categoryRequired;
    if (hourlyRate.trim() === '' || Number.isNaN(parsedRate) || parsedRate < 0)
      return t.craftsmanProfileEditor.errors.invalidHourlyRate;
    if (yearsOfExperience.trim() && Number.isNaN(parsedYears)) return t.craftsmanProfileEditor.errors.yearsNotNumber;
    if (latitude == null || longitude == null) return t.craftsmanProfileEditor.errors.locationRequired;
    return null;
  };

  const onSubmit = async () => {
    if (!token) return;
    const localError = validationError();
    if (localError) {
      setError(localError);
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload = {
        serviceCategoryId: categoryId as number,
        businessName: businessName.trim() || undefined,
        bio: bio.trim() || undefined,
        hourlyRate: parsedRate,
        yearsOfExperience: parsedYears,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        addressText: addressText.trim() || undefined,
      };
      if (mode === 'create') {
        await createMyProfile(payload, token);
        setMode('edit');
        await refreshHasCraftsmanProfile();
      } else {
        await updateMyProfile(payload, token);
      }
      setSuccess(t.craftsmanProfileEditor.profileSaved);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToSaveProfile));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Menu
              visible={photoMenuVisible}
              onDismiss={() => setPhotoMenuVisible(false)}
              anchor={
                <TouchableRipple
                  onPress={onPhotoPress}
                  disabled={uploadingPhoto}
                  borderless
                  style={styles.avatarTouchable}
                >
                  {user.profileImageUrl ? (
                    <Avatar.Image
                      size={88}
                      source={{
                        uri: `${resolveMediaUrl(user.profileImageUrl)}${photoVersion ? `?v=${photoVersion}` : ''}`,
                      }}
                    />
                  ) : (
                    <Avatar.Text
                      size={88}
                      label={initialsOf(user.fullName)}
                      style={{ backgroundColor: theme.colors.primary }}
                      labelStyle={{ color: theme.colors.onPrimary }}
                    />
                  )}
                </TouchableRipple>
              }
            >
              <Menu.Item
                onPress={choosePhoto}
                title={t.craftsmanProfileEditor.changePhoto}
                leadingIcon="image-edit-outline"
              />
              <Menu.Item onPress={removePhoto} title={t.craftsmanProfileEditor.removePhoto} leadingIcon="delete-outline" />
            </Menu>
            <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}>
              <Icon source="camera" size={14} color={theme.colors.onPrimary} />
            </View>
          </View>

          <Text variant="titleLarge" style={styles.name}>
            {businessName.trim() || user.fullName}
          </Text>
          {selectedCategoryName && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {selectedCategoryName}
            </Text>
          )}

          <View style={styles.roleSwitcherWrap}>
            <RoleSwitcher />
          </View>

          {mode === 'create' && (
            <Text variant="bodySmall" style={[styles.createHint, { color: theme.colors.onSurfaceVariant }]}>
              {t.craftsmanProfileEditor.titleCreate}
            </Text>
          )}
        </View>

        <Text variant="labelLarge" style={styles.groupLabel}>
          {t.craftsmanProfileEditor.businessInfoTitle}
        </Text>
        <Card style={styles.groupCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            <TextInput
              label={t.craftsmanProfileEditor.businessName}
              value={businessName}
              onChangeText={setBusinessName}
              mode="outlined"
              placeholder={user.fullName}
            />
            <Text variant="labelLarge">{t.craftsmanProfileEditor.serviceCategory}</Text>
            <View style={styles.chipRow}>
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <Chip
                    key={category.id}
                    selected={selected}
                    showSelectedCheck={false}
                    onPress={() => setCategoryId(category.id)}
                    style={{
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant,
                      borderColor: selected ? theme.colors.primary : theme.colors.outline,
                    }}
                    textStyle={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}
                  >
                    {category.name}
                  </Chip>
                );
              })}
            </View>
            <Button compact onPress={openSuggest} style={styles.compactButton}>
              {t.craftsmanProfileEditor.addCategoryPrompt}
            </Button>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.groupLabel}>
          {t.craftsmanProfileEditor.pricingTitle}
        </Text>
        <Card style={styles.groupCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            <TextInput
              label={t.craftsmanProfileEditor.hourlyRate}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              mode="outlined"
              keyboardType="decimal-pad"
            />
            <TextInput
              label={t.craftsmanProfileEditor.yearsOfExperienceLabel}
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
              mode="outlined"
              keyboardType="number-pad"
            />
          </Card.Content>
        </Card>

        <Card style={styles.groupCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            <TextInput
              label={t.craftsmanProfileEditor.bioLabel}
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.groupLabel}>
          {t.craftsmanProfileEditor.serviceArea}
        </Text>
        <Card style={styles.groupCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            <TextInput
              label={t.craftsmanProfileEditor.addressLabel}
              value={addressText}
              onChangeText={setAddressText}
              mode="outlined"
            />
            <View style={[styles.locationRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon source="map-marker" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.locationText}>
                {latitude != null && longitude != null
                  ? t.craftsmanProfileEditor.pinnedAt(latitude.toFixed(3), longitude.toFixed(3))
                  : t.craftsmanProfileEditor.locationNotPinned}
              </Text>
            </View>
            <Button mode="outlined" onPress={captureLocation} loading={locating} disabled={locating}>
              {latitude != null ? t.craftsmanProfileEditor.refreshLocation : t.craftsmanProfileEditor.useCurrentLocation}
            </Button>
            {locationError && <HelperText type="error">{locationError}</HelperText>}
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.groupLabel}>
          {t.settings.account}
        </Text>
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
        </Card>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            borderTopColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {error && <HelperText type="error">{error}</HelperText>}
        {success && <HelperText type="info">{success}</HelperText>}
        <Button mode="contained" style={styles.saveButton} onPress={onSubmit} loading={submitting} disabled={submitting}>
          {mode === 'create' ? t.craftsmanProfileEditor.saveAndPublish : t.craftsmanProfileEditor.saveChanges}
        </Button>
      </View>

      <Portal>
        <Dialog visible={suggestVisible} onDismiss={() => setSuggestVisible(false)}>
          <Dialog.Title>{t.craftsmanProfileEditor.suggestDialog.title}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodySmall">{t.craftsmanProfileEditor.suggestDialog.body}</Text>
            <TextInput
              label={t.craftsmanProfileEditor.suggestDialog.nameLabel}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              mode="outlined"
            />
            <TextInput
              label={t.craftsmanProfileEditor.suggestDialog.descriptionLabel}
              value={newCategoryDescription}
              onChangeText={setNewCategoryDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            {suggestError && <HelperText type="error">{suggestError}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSuggestVisible(false)} disabled={suggesting}>
              {t.common.cancel}
            </Button>
            <Button onPress={submitSuggest} loading={suggesting} disabled={suggesting}>
              {t.craftsmanProfileEditor.suggestDialog.add}
            </Button>
          </Dialog.Actions>
        </Dialog>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 8,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  roleSwitcherWrap: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  avatarTouchable: {
    borderRadius: 44,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
    marginTop: 8,
  },
  createHint: {
    marginTop: 4,
    textAlign: 'center',
  },
  groupLabel: {
    marginTop: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 12,
  },
  compactButton: {
    alignSelf: 'flex-start',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  saveButton: {
    borderRadius: 28,
  },
  dialogContent: {
    gap: 12,
  },
});