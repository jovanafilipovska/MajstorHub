import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Button, Dialog, HelperText, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { createMyProfile, getCraftsmanProfile, updateMyProfile } from '../../api/craftsmen';
import { listServiceCategories, suggestServiceCategory } from '../../api/serviceCategories';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { LoadingView } from '../../components/LoadingView';
import { CategoryPickerField } from '../../components/CategoryPickerField';
import type { CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

export function CraftsmanProfileEditor() {
  const { user, token } = useAuth();
  const { refreshHasCraftsmanProfile } = useWorkMode();
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addressText, setAddressText] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

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
        setLocationError('Location permission is required so clients can find you nearby.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch {
      setLocationError('Failed to get your location. Check your device location settings and try again.');
    } finally {
      setLocating(false);
    }
  }, []);

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
          setCategoryId(profile.serviceCategoryId);
          setBio(profile.bio ?? '');
          setHourlyRate(String(profile.hourlyRate));
          setYearsOfExperience(profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : '');
          setLatitude(profile.latitude ?? null);
          setLongitude(profile.longitude ?? null);
          setAddressText(profile.addressText ?? '');
          setIsAvailable(profile.isAvailable);
        } else {
          setMode('create');
          captureLocation();
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load profile.'));
  }, [user, captureLocation]);

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
      setSuggestError('Category name is required.');
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
      setSuccess('Category submitted for admin approval — you can use it now, and it will be visible to others once approved.');
    } catch (err) {
      setSuggestError(err instanceof ApiError ? err.message : 'Failed to add category.');
    } finally {
      setSuggesting(false);
    }
  };

  if (!user || mode === null) return <LoadingView />;

  const parsedRate = Number(hourlyRate);
  const parsedYears = yearsOfExperience.trim() ? Number(yearsOfExperience) : undefined;

  const validationError = (): string | null => {
    if (categoryId === null) return 'Select a service category.';
    if (hourlyRate.trim() === '' || Number.isNaN(parsedRate) || parsedRate < 0) return 'Enter a valid hourly rate.';
    if (yearsOfExperience.trim() && Number.isNaN(parsedYears)) return 'Years of experience must be a number.';
    if (latitude == null || longitude == null) return 'We need your location. Enable location access and try again.';
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
        await updateMyProfile({ ...payload, isAvailable }, token);
      }
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleMedium">{mode === 'create' ? 'Create Your Craftsman Profile' : 'Edit Your Profile'}</Text>

      <CategoryPickerField categories={categories} selectedCategoryId={categoryId} onSelect={setCategoryId} />
      <Button compact onPress={openSuggest}>
        Can&apos;t find your trade? Add a new category
      </Button>
      <TextInput label="Bio" value={bio} onChangeText={setBio} mode="outlined" multiline numberOfLines={3} />
      <TextInput
        label="Hourly rate ($)"
        value={hourlyRate}
        onChangeText={setHourlyRate}
        mode="outlined"
        keyboardType="decimal-pad"
      />
      <TextInput
        label="Years of experience (optional)"
        value={yearsOfExperience}
        onChangeText={setYearsOfExperience}
        mode="outlined"
        keyboardType="number-pad"
      />
      <TextInput label="Address (optional)" value={addressText} onChangeText={setAddressText} mode="outlined" />

      <View style={styles.locationBlock}>
        <Text variant="bodyMedium">Location</Text>
        <Text variant="bodySmall">
          {latitude != null && longitude != null
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Not captured yet.'}
        </Text>
        <Button mode="outlined" onPress={captureLocation} loading={locating} disabled={locating}>
          {latitude != null ? 'Refresh my location' : 'Use my current location'}
        </Button>
        {locationError && <HelperText type="error">{locationError}</HelperText>}
      </View>

      {mode === 'edit' && (
        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Available for bookings</Text>
          <Switch value={isAvailable} onValueChange={setIsAvailable} />
        </View>
      )}

      {error && <HelperText type="error">{error}</HelperText>}
      {success && <HelperText type="info">{success}</HelperText>}

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting}>
        {mode === 'create' ? 'Create Profile' : 'Save Changes'}
      </Button>

      <Portal>
        <Dialog visible={suggestVisible} onDismiss={() => setSuggestVisible(false)}>
          <Dialog.Title>Add a new category</Dialog.Title>
          <Dialog.Content style={styles.suggestContent}>
            <Text variant="bodySmall">
              An admin will review this before it appears in the list for other users. You can use it for your own
              profile right away.
            </Text>
            <TextInput label="Name" value={newCategoryName} onChangeText={setNewCategoryName} mode="outlined" />
            <TextInput
              label="Description (optional)"
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
              Cancel
            </Button>
            <Button onPress={submitSuggest} loading={suggesting} disabled={suggesting}>
              Add
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBlock: {
    gap: 4,
  },
  suggestContent: {
    gap: 12,
  },
});
