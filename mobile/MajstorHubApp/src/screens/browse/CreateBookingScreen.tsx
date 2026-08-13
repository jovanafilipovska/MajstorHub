import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { createBooking, uploadBookingPhotos } from '../../api/bookings';
import { useAuth } from '../../contexts/AuthContext';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { Translations } from '../../i18n';
import type { BrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CreateBooking'>;

const MAX_PHOTOS = 6;

function atTime(daysFromNow: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function timePresets(t: Translations): { label: string; getDate: () => Date }[] {
  return [
    { label: t.createBooking.timePresets.todayAfternoon, getDate: () => atTime(0, 14) },
    { label: t.createBooking.timePresets.todayEvening, getDate: () => atTime(0, 18) },
    { label: t.createBooking.timePresets.tomorrowMorning, getDate: () => atTime(1, 9) },
    { label: t.createBooking.timePresets.tomorrowAfternoon, getDate: () => atTime(1, 14) },
  ];
}

export function CreateBookingScreen({ route, navigation }: Props) {
  const { craftsmanUserId, craftsmanName, serviceCategoryId } = route.params;
  const { token } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const TIME_PRESETS = timePresets(t);

  const [step, setStep] = useState(0);

  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const captureLocation = useCallback(async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(t.createBooking.errors.locationPermission);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (place && !address.trim()) {
        setAddress([place.street, place.streetNumber, place.city].filter(Boolean).join(' '));
      }
    } catch {
      setLocationError(t.createBooking.errors.locationFailed);
    } finally {
      setLocating(false);
    }
  }, [address, t]);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t.createBooking.errors.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photos.length),
      quality: 0.7,
    });
    if (result.canceled) return;
    setPhotos((prev) => [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const goToDetails = () => {
    if (address.trim().length === 0) {
      setError(t.createBooking.errors.addressRequired);
      return;
    }
    setError(null);
    setStep(1);
  };

  const onBack = () => {
    if (step === 1) {
      setStep(0);
      setError(null);
      return;
    }
    navigation.goBack();
  };

  const canSubmit = description.trim().length > 0 && !submitting;

  const onSubmit = async () => {
    if (!token) return;
    if (description.trim().length === 0) {
      setError(t.createBooking.errors.describeRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createBooking(
        {
          craftsmanProfileId: craftsmanUserId,
          serviceCategoryId,
          description: description.trim(),
          address: address.trim(),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        },
        token,
      );
      if (photos.length > 0) {
        await uploadBookingPhotos(created.id, photos, token);
      }
      navigation.popToTop();
    } catch (err) {
      setError(apiErrorMessage(err, t, t.createBooking.errors.createFailed));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          mode="contained-tonal"
          onPress={onBack}
          containerColor={theme.colors.surfaceVariant}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {t.createBooking.headerTitle}
        </Text>
      </View>

      <View style={styles.progressRow}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              { backgroundColor: index <= step ? theme.colors.primary : theme.colors.surfaceVariant },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? (
          <>
            <Text variant="titleMedium">{t.createBooking.whereIsTheJob}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t.createBooking.bookingWith(craftsmanName)}
            </Text>

            <TextInput label={t.createBooking.addressLabel} value={address} onChangeText={setAddress} mode="outlined" multiline />

            <Button mode="outlined" onPress={captureLocation} loading={locating} disabled={locating} icon="crosshairs-gps">
              {latitude != null ? t.createBooking.refreshLocation : t.createBooking.pinLocation}
            </Button>
            {locationError && <HelperText type="error">{locationError}</HelperText>}

            {latitude != null && longitude != null && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t.createBooking.locationPinned(latitude.toFixed(5), longitude.toFixed(5))}
              </Text>
            )}

            {error && <HelperText type="error">{error}</HelperText>}

            <Button mode="contained" style={styles.continueButton} onPress={goToDetails}>
              {t.createBooking.continueButton}
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleMedium">{t.createBooking.describeProblem}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder={t.createBooking.descriptionPlaceholder}
            />

            <Text variant="titleMedium" style={styles.sectionSpacing}>
              {t.createBooking.photos}
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoTile}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <IconButton
                    icon="close"
                    size={14}
                    mode="contained"
                    style={styles.photoRemove}
                    onPress={() => removePhoto(uri)}
                  />
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <View style={[styles.photoTile, styles.addPhotoTile, { borderColor: theme.colors.outline }]}>
                  <IconButton icon="plus" onPress={pickPhotos} />
                </View>
              )}
            </View>

            <Text variant="titleMedium" style={styles.sectionSpacing}>
              {t.createBooking.preferredTime}
            </Text>
            <View style={styles.timeGrid}>
              {TIME_PRESETS.map((preset) => {
                const presetDate = preset.getDate();
                const selected = scheduledAt?.getTime() === presetDate.getTime();
                return (
                  <Button
                    key={preset.label}
                    mode={selected ? 'contained' : 'outlined'}
                    style={styles.timeChip}
                    onPress={() => setScheduledAt(presetDate)}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </View>
            <Button compact onPress={() => setShowPicker(true)}>
              {scheduledAt && !TIME_PRESETS.some((p) => p.getDate().getTime() === scheduledAt.getTime())
                ? scheduledAt.toLocaleString()
                : t.createBooking.chooseDateTime}
            </Button>
            {showPicker && (
              <DateTimePicker
                value={scheduledAt ?? new Date()}
                mode="datetime"
                onChange={(_, date) => {
                  setShowPicker(false);
                  if (date) setScheduledAt(date);
                }}
              />
            )}

            {error && <HelperText type="error">{error}</HelperText>}

            <Button
              mode="contained"
              style={styles.continueButton}
              contentStyle={styles.confirmContent}
              onPress={onSubmit}
              loading={submitting}
              disabled={!canSubmit}
            >
              {t.createBooking.confirmBooking}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  headerTitle: {
    fontWeight: '800',
    flexShrink: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  continueButton: {
    marginTop: 12,
    borderRadius: 28,
  },
  confirmContent: {
    paddingVertical: 6,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    margin: 0,
  },
  addPhotoTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    borderRadius: 20,
  },
});