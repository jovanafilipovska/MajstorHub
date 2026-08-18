import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Dialog, HelperText, Icon, Portal, Text, useTheme } from 'react-native-paper';
import { getBooking, updateBookingStatus } from '../../api/bookings';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { StatusBadge } from '../../components/StatusBadge';
import { openDirections } from '../../utils/directions';
import { apiErrorMessage, useTranslation } from '../../i18n';
import { localizedText } from '../../utils/categoryName';
import type { Translations } from '../../i18n';
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
  t: Translations,
  status: BookingStatus,
  isCraftsmanOnBooking: boolean,
  isClientOnBooking: boolean,
): { label: string; nextStatus: BookingStatus; primary: boolean }[] {
  if (status === 'Pending' && isCraftsmanOnBooking) {
    return [
      { label: t.bookingDetail.reject, nextStatus: 'Rejected', primary: false },
      { label: t.bookingDetail.accept, nextStatus: 'Accepted', primary: true },
    ];
  }
  if (status === 'Accepted' && isCraftsmanOnBooking) {
    return [
      { label: t.bookingDetail.cancel, nextStatus: 'Cancelled', primary: false },
      { label: t.bookingDetail.complete, nextStatus: 'Completed', primary: true },
    ];
  }
  if (status === 'Accepted' && isClientOnBooking) {
    return [{ label: t.bookingDetail.cancelBooking, nextStatus: 'Cancelled', primary: false }];
  }
  return [];
}

const CONFIRM_STATUSES: BookingStatus[] = ['Rejected', 'Cancelled'];

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function shortBookingId(id: string): string {
  return `#MH-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.detailRow, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.detailLabel}>
        <Icon source={icon} size={18} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ label: string; nextStatus: BookingStatus } | null>(null);

  useAutoDismiss(actionError, setActionError);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getBooking(bookingId, token, controller.signal)
      .then(setBooking)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(apiErrorMessage(err, t, t.bookingDetail.failedToLoad));
      });
    return () => controller.abort();
  }, [bookingId, token, t]);

  useFocusEffect(load);

  const applyStatus = async (nextStatus: BookingStatus) => {
    if (!token) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const updated = await updateBookingStatus(bookingId, nextStatus, token);
      setBooking(updated);
    } catch (err) {
      setActionError(apiErrorMessage(err, t, t.bookingDetail.failedToUpdate));
    } finally {
      setSubmitting(false);
      setPendingAction(null);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!booking) return <LoadingView />;

  const isCraftsmanOnBooking = booking.craftsmanProfileId === user?.id;
  const isClientOnBooking = booking.clientId === user?.id;
  const actions = getAvailableActions(t, booking.status, isCraftsmanOnBooking, isClientOnBooking);
  const canReview = isClientOnBooking && booking.status === 'Completed' && !booking.hasReview;
  const showReviewedNotice = isClientOnBooking && booking.status === 'Completed' && booking.hasReview;
  const otherPartyName = isClientOnBooking ? booking.craftsmanName : booking.clientName;
  const otherPartyImageUrl = isClientOnBooking ? booking.craftsmanProfileImageUrl : booking.clientProfileImageUrl;
  // A Message button is always shown to either participant, so the footer is never empty.
  const hasFooterActions = true;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBadge status={booking.status} />

        <View style={[styles.partyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          {otherPartyImageUrl ? (
            <Avatar.Image size={48} source={{ uri: resolveMediaUrl(otherPartyImageUrl) }} />
          ) : (
            <Avatar.Text
              size={48}
              label={initialsOf(otherPartyName)}
              style={{ backgroundColor: theme.colors.primary }}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
          )}
          <View style={styles.partyText}>
            <Text variant="titleMedium">{otherPartyName}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {localizedText(booking.serviceCategoryNameEn, booking.serviceCategoryNameMk, booking.serviceCategoryNameSq, language)}
            </Text>
          </View>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t.bookingDetail.schedule}
        </Text>
        <View style={styles.rowGroup}>
          {booking.scheduledAt && (
            <DetailRow
              icon="calendar-blank-outline"
              label={t.bookingDetail.dateTime}
              value={formatDateTime(booking.scheduledAt)}
            />
          )}
          <DetailRow icon="map-marker-outline" label={t.bookingDetail.address} value={booking.address} />
          <DetailRow icon="pound" label={t.bookingDetail.bookingId} value={shortBookingId(booking.id)} />
        </View>

        {isCraftsmanOnBooking && booking.latitude != null && booking.longitude != null && (
          <Button
            mode="outlined"
            icon="directions"
            onPress={() => openDirections(booking.latitude, booking.longitude, booking.address)}
          >
            {t.bookingDetail.getDirections}
          </Button>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t.bookingDetail.job}
        </Text>
        <View style={[styles.jobCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="bodyMedium">{booking.description}</Text>
        </View>

        {booking.photoUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {booking.photoUrls.map((url) => (
              <Image key={url} source={{ uri: resolveMediaUrl(url) }} style={styles.photoThumb} />
            ))}
          </ScrollView>
        )}

        {booking.priceQuote != null && (
          <View style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {t.bookingDetail.total}
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
              ${booking.priceQuote.toFixed(2)}
            </Text>
          </View>
        )}

        {showReviewedNotice && (
          <View style={[styles.reviewedNotice, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Icon source="check-circle-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t.bookingDetail.reviewSubmitted}
            </Text>
          </View>
        )}

        {actionError && <HelperText type="error">{actionError}</HelperText>}

        {hasFooterActions && <View style={styles.footerSpacer} />}
      </ScrollView>

      {hasFooterActions && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.outlineVariant,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Button
            mode="outlined"
            icon="message-text-outline"
            style={styles.footerButton}
            contentStyle={styles.footerButtonContent}
            onPress={() => navigation.navigate('Chat', { bookingId: booking.id, otherPartyName })}
          >
            {t.bookingDetail.messageButton}
          </Button>

          {actions.map((action) => (
            <Button
              key={action.nextStatus}
              mode={action.primary ? 'contained' : 'outlined'}
              style={styles.footerButton}
              contentStyle={styles.footerButtonContent}
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
              style={styles.footerButton}
              contentStyle={styles.footerButtonContent}
              onPress={() =>
                navigation.navigate('LeaveReview', { bookingId: booking.id, craftsmanName: booking.craftsmanName })
              }
            >
              {t.bookingDetail.leaveReviewButton}
            </Button>
          )}
        </View>
      )}

      <Portal>
        <Dialog visible={pendingAction !== null} onDismiss={() => setPendingAction(null)}>
          <Dialog.Title>{pendingAction && t.bookingDetail.questionSuffix(pendingAction.label)}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t.bookingDetail.cannotBeUndone}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingAction(null)}>{t.common.back}</Button>
            <Button onPress={() => pendingAction && applyStatus(pendingAction.nextStatus)}>{t.common.confirm}</Button>
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
    gap: 12,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  partyText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 8,
  },
  rowGroup: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontWeight: '700',
  },
  jobCard: {
    borderRadius: 12,
    padding: 16,
  },
  photoRow: {
    marginTop: -4,
  },
  photoThumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    marginRight: 10,
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerSpacer: {
    height: 88,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
    borderRadius: 28,
  },
  footerButtonContent: {
    paddingVertical: 6,
  },
});