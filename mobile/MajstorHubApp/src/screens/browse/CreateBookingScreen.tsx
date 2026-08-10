import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBooking } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { BrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CreateBooking'>;

export function CreateBookingScreen({ route, navigation }: Props) {
  const { craftsmanUserId, craftsmanName, serviceCategoryId } = route.params;
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = description.trim().length > 0 && address.trim().length > 0 && !submitting;

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await createBooking(
        {
          craftsmanProfileId: craftsmanUserId,
          serviceCategoryId,
          description: description.trim(),
          address: address.trim(),
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        },
        token,
      );
      navigation.popToTop();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleMedium">Book {craftsmanName}</Text>

      <TextInput
        label="What do you need done?"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" />

      <Button mode="outlined" onPress={() => setShowPicker(true)}>
        {scheduledAt ? scheduledAt.toLocaleString() : 'Pick a preferred date/time (optional)'}
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

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={!canSubmit}>
        Request Booking
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});
