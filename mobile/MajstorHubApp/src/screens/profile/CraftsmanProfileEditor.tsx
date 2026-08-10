import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, HelperText, Switch, Text, TextInput } from 'react-native-paper';
import { createMyProfile, getCraftsmanProfile, updateMyProfile } from '../../api/craftsmen';
import { listServiceCategories } from '../../api/serviceCategories';
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [addressText, setAddressText] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    setError(null);
    Promise.all([listServiceCategories(), getCraftsmanProfile(user.id).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    })])
      .then(([categoriesResult, profile]: [ServiceCategoryResponse[], CraftsmanProfileResponse | null]) => {
        setCategories(categoriesResult);
        if (profile) {
          setMode('edit');
          setCategoryId(profile.serviceCategoryId);
          setBio(profile.bio ?? '');
          setHourlyRate(String(profile.hourlyRate));
          setYearsOfExperience(profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : '');
          setLatitude(profile.latitude != null ? String(profile.latitude) : '');
          setLongitude(profile.longitude != null ? String(profile.longitude) : '');
          setAddressText(profile.addressText ?? '');
          setIsAvailable(profile.isAvailable);
        } else {
          setMode('create');
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load profile.'));
  }, [user]);

  useFocusEffect(load);

  if (!user || mode === null) return <LoadingView />;

  const parsedRate = Number(hourlyRate);
  const parsedYears = yearsOfExperience.trim() ? Number(yearsOfExperience) : undefined;
  const parsedLat = latitude.trim() ? Number(latitude) : undefined;
  const parsedLng = longitude.trim() ? Number(longitude) : undefined;

  const validationError = (): string | null => {
    if (categoryId === null) return 'Select a service category.';
    if (hourlyRate.trim() === '' || Number.isNaN(parsedRate) || parsedRate < 0) return 'Enter a valid hourly rate.';
    if (yearsOfExperience.trim() && Number.isNaN(parsedYears)) return 'Years of experience must be a number.';
    if (latitude.trim() && Number.isNaN(parsedLat)) return 'Latitude must be a number.';
    if (longitude.trim() && Number.isNaN(parsedLng)) return 'Longitude must be a number.';
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
        latitude: parsedLat,
        longitude: parsedLng,
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
      <TextInput
        label="Latitude (optional)"
        value={latitude}
        onChangeText={setLatitude}
        mode="outlined"
        keyboardType="numbers-and-punctuation"
      />
      <TextInput
        label="Longitude (optional)"
        value={longitude}
        onChangeText={setLongitude}
        mode="outlined"
        keyboardType="numbers-and-punctuation"
      />

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
});
