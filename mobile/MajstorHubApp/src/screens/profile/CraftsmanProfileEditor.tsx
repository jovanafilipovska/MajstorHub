import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Button, Chip, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { createMyProfile, getCraftsmanProfile, updateMyProfile } from '../../api/craftsmen';
import { listServiceCategories, suggestServiceCategory } from '../../api/serviceCategories';
import { removeMyPhoto, uploadMyPhoto } from '../../api/users';
import { ApiError, resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { LoadingView } from '../../components/LoadingView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

export function CraftsmanProfileEditor() {
  const { user, token, refreshUser } = useAuth();
  const { refreshHasCraftsmanProfile } = useWorkMode();
  const theme = useTheme();
  const t = useTranslation();
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

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [suggestVisible, setSuggestVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const captureLocation = useCallback(async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t.craftsmanProfileEditor.errors.locationPermission);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToUpdatePhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!token) return;
    setError(null);
    setUploadingPhoto(true);
    try {
      await removeMyPhoto(token);
      await refreshUser();
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanProfileEditor.errors.failedToRemovePhoto));
    } finally {
      setUploadingPhoto(false);
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

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="titleLarge" style={styles.title}>
        {mode === 'create' ? t.craftsmanProfileEditor.titleCreate : t.craftsmanProfileEditor.titleEdit}
      </Text>

      <Pressable onPress={choosePhoto} disabled={uploadingPhoto}>
        <View style={[styles.photoTile, { borderColor: theme.colors.outline }]}>
          {user.profileImageUrl ? (
            <Image source={{ uri: resolveMediaUrl(user.profileImageUrl) }} style={styles.photoImage} />
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t.craftsmanProfileEditor.addPhoto}
            </Text>
          )}
        </View>
      </Pressable>
      {user.profileImageUrl && (
        <Button compact onPress={removePhoto} disabled={uploadingPhoto}>
          {t.craftsmanProfileEditor.removePhoto}
        </Button>
      )}

      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t.craftsmanProfileEditor.businessName}
      </Text>
      <TextInput
        value={businessName}
        onChangeText={setBusinessName}
        mode="outlined"
        placeholder={user.fullName}
      />

      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t.craftsmanProfileEditor.serviceCategory}
      </Text>
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
      <Button compact onPress={openSuggest}>
        {t.craftsmanProfileEditor.addCategoryPrompt}
      </Button>

      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t.craftsmanProfileEditor.hourlyRate}
      </Text>
      <TextInput value={hourlyRate} onChangeText={setHourlyRate} mode="outlined" keyboardType="decimal-pad" />

      <TextInput label={t.craftsmanProfileEditor.bioLabel} value={bio} onChangeText={setBio} mode="outlined" multiline numberOfLines={3} />
      <TextInput
        label={t.craftsmanProfileEditor.yearsOfExperienceLabel}
        value={yearsOfExperience}
        onChangeText={setYearsOfExperience}
        mode="outlined"
        keyboardType="number-pad"
      />
      <TextInput label={t.craftsmanProfileEditor.addressLabel} value={addressText} onChangeText={setAddressText} mode="outlined" />

      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t.craftsmanProfileEditor.serviceArea}
      </Text>
      <View style={[styles.areaPlaceholder, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {latitude != null && longitude != null
            ? t.craftsmanProfileEditor.pinnedAt(latitude.toFixed(3), longitude.toFixed(3))
            : t.craftsmanProfileEditor.locationNotPinned}
        </Text>
      </View>
      <Button mode="outlined" onPress={captureLocation} loading={locating} disabled={locating}>
        {latitude != null ? t.craftsmanProfileEditor.refreshLocation : t.craftsmanProfileEditor.useCurrentLocation}
      </Button>
      {locationError && <HelperText type="error">{locationError}</HelperText>}

      {error && <HelperText type="error">{error}</HelperText>}
      {success && <HelperText type="info">{success}</HelperText>}

      <Button mode="contained" style={styles.saveButton} onPress={onSubmit} loading={submitting} disabled={submitting}>
        {mode === 'create' ? t.craftsmanProfileEditor.saveAndPublish : t.craftsmanProfileEditor.saveChanges}
      </Button>

      <Portal>
        <Dialog visible={suggestVisible} onDismiss={() => setSuggestVisible(false)}>
          <Dialog.Title>{t.craftsmanProfileEditor.suggestDialog.title}</Dialog.Title>
          <Dialog.Content style={styles.suggestContent}>
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
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
  photoTile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  fieldLabel: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaPlaceholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 28,
  },
  suggestContent: {
    gap: 12,
  },
});