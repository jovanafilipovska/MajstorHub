import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Dialog, HelperText, Portal, Text } from 'react-native-paper';
import { getBooking, updateBookingStatus } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { StatusBadge } from '../../components/StatusBadge';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingResponse, BookingStatus } from '../../types/api';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookingDetail'>;

// Mirrors BookingService.UpdateStatusAsync exactly:
//   Pending  -> Accepted | Rejected   (craftsman side of this booking only)
//   Accepted -> Completed             (craftsman side of this booking only)
//   Accepted -> Cancelled             (either party)
// A user can be the client on one booking and the craftsman on another, so this
// is decided per-booking (booking.clientId/craftsmanProfileId vs. the viewer),
// not from the viewer's account-level role.
function getAvailableActions(
  status: BookingStatus,
  isCraftsmanOnBooking: boolean,
  isClientOnBooking: boolean,
): { label: string; nextStatus: BookingStatus }[] {
  if (status === 'Pending' && isCraftsmanOnBooking) {
    return [
      { label: 'Accept', nextStatus: 'Accepted' },
      { label: 'Reject', nextStatus: 'Rejected' },
    ];
  }
  if (status === 'Accepted' && isCraftsmanOnBooking) {
    return [
      { label: 'Complete', nextStatus: 'Completed' },
      { label: 'Cancel', nextStatus: 'Cancelled' },
    ];
  }
  if (status === 'Accepted' && isClientOnBooking) {
    return [{ label: 'Cancel', nextStatus: 'Cancelled' }];
  }
  return [];
}

const CONFIRM_STATUSES: BookingStatus[] = ['Rejected', 'Cancelled'];

export function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { user, token } = useAuth();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ label: string; nextStatus: BookingStatus } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getBooking(bookingId, token, controller.signal)
      .then(setBooking)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
      });
    return () => controller.abort();
  }, [bookingId, token]);

  useFocusEffect(load);

  const applyStatus = async (nextStatus: BookingStatus) => {
    if (!token) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const updated = await updateBookingStatus(bookingId, nextStatus, token);
      setBooking(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update booking.');
    } finally {
      setSubmitting(false);
      setPendingAction(null);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!booking) return <LoadingView />;

  const isCraftsmanOnBooking = booking.craftsmanProfileId === user?.id;
  const isClientOnBooking = booking.clientId === user?.id;
  const actions = getAvailableActions(booking.status, isCraftsmanOnBooking, isClientOnBooking);
  const canReview = isClientOnBooking && booking.status === 'Completed';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{booking.serviceCategoryName}</Text>
      <StatusBadge status={booking.status} />

      <Text variant="bodyMedium" style={styles.field}>
        Client: {booking.clientName}
      </Text>
      <Text variant="bodyMedium">Craftsman: {booking.craftsmanName}</Text>
      <Text variant="bodyMedium" style={styles.field}>
        {booking.description}
      </Text>
      <Text variant="bodyMedium">Address: {booking.address}</Text>
      {booking.scheduledAt && (
        <Text variant="bodyMedium">Scheduled: {new Date(booking.scheduledAt).toLocaleString()}</Text>
      )}
      {booking.priceQuote != null && <Text variant="bodyMedium">Quote: ${booking.priceQuote.toFixed(2)}</Text>}

      {actionError && <HelperText type="error">{actionError}</HelperText>}

      {actions.map((action) => (
        <Button
          key={action.nextStatus}
          mode={action.nextStatus === 'Rejected' || action.nextStatus === 'Cancelled' ? 'outlined' : 'contained'}
          style={styles.actionButton}
          loading={submitting}
          disabled={submitting}
          onPress={() => {
            if (CONFIRM_STATUSES.includes(action.nextStatus)) {
              setPendingAction(action);
            } else {
              applyStatus(action.nextStatus);
            }
          }}
        >
          {action.label}
        </Button>
      ))}

      {canReview && (
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() => navigation.navigate('LeaveReview', { bookingId: booking.id, craftsmanName: booking.craftsmanName })}
        >
          Leave a Review
        </Button>
      )}

      <Portal>
        <Dialog visible={pendingAction !== null} onDismiss={() => setPendingAction(null)}>
          <Dialog.Title>{pendingAction?.label} booking?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingAction(null)}>Back</Button>
            <Button onPress={() => pendingAction && applyStatus(pendingAction.nextStatus)}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 6,
  },
  field: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 12,
  },
});
