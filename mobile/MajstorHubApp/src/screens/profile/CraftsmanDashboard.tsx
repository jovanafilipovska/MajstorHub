import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, HelperText, Switch, Text, useTheme } from 'react-native-paper';
import { updateBookingStatus } from '../../api/bookings';
import { updateMyProfile } from '../../api/craftsmen';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { BookingResponse, CraftsmanProfileResponse } from '../../types/api';

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function withinLastDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

function StatTile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="titleLarge" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

interface Props {
  profile: CraftsmanProfileResponse;
  bookings: BookingResponse[];
  onProfileChange: (profile: CraftsmanProfileResponse) => void;
  onBookingsChange: Dispatch<SetStateAction<BookingResponse[]>>;
  onViewReviews: () => void;
}

export function CraftsmanDashboard({ profile, bookings, onProfileChange, onBookingsChange, onViewReviews }: Props) {
  const { user, token } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const [toggling, setToggling] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useAutoDismiss(error, setError);

  const myBookings = bookings.filter((b) => b.craftsmanProfileId === profile.userId);
  const incoming = myBookings.filter((b) => b.status === 'Pending');
  const todayCount = myBookings.filter(
    (b) => b.status === 'Accepted' && b.scheduledAt && isToday(b.scheduledAt),
  ).length;
  const weeklyEarnings = myBookings
    .filter((b) => b.status === 'Completed' && withinLastDays(b.updatedAt, 7))
    .reduce((sum, b) => sum + (b.priceQuote ?? 0), 0);

  const toggleAvailable = async () => {
    if (!token) return;
    setError(null);
    setToggling(true);
    try {
      const updated = await updateMyProfile({ isAvailable: !profile.isAvailable }, token);
      onProfileChange(updated);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanDashboard.failedToUpdateAvailability));
    } finally {
      setToggling(false);
    }
  };

  const act = async (bookingId: string, status: 'Accepted' | 'Rejected') => {
    if (!token) return;
    setError(null);
    setActioningId(bookingId);
    try {
      const updated = await updateBookingStatus(bookingId, status, token);
      onBookingsChange((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setError(apiErrorMessage(err, t, t.craftsmanDashboard.failedToUpdateBooking));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.welcomeRow}>
        {user?.profileImageUrl ? (
          <Avatar.Image size={48} source={{ uri: resolveMediaUrl(user.profileImageUrl) }} />
        ) : (
          <Avatar.Text
            size={48}
            label={initialsOf(user?.fullName ?? '?')}
            style={{ backgroundColor: theme.colors.primary }}
            labelStyle={{ color: theme.colors.onPrimary }}
          />
        )}
        <View style={styles.welcomeText}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t.craftsmanDashboard.welcome}
          </Text>
          <Text variant="titleLarge">{profile.businessName || user?.fullName}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile label={t.craftsmanDashboard.todayStat} value={String(todayCount)} />
        <StatTile
          label={t.craftsmanDashboard.ratingStat}
          value={profile.averageRating ? profile.averageRating.toFixed(1) : '—'}
        />
        <StatTile label={t.craftsmanDashboard.thisWeekStat} value={`$${weeklyEarnings.toFixed(0)}`} />
      </View>

      <Button mode="outlined" icon="star-outline" onPress={onViewReviews}>
        {t.craftsmanDashboard.viewAllReviews}
      </Button>

      <View style={[styles.availableRow, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text variant="bodyMedium">{t.craftsmanDashboard.availableNow}</Text>
        <Switch value={profile.isAvailable} onValueChange={toggleAvailable} disabled={toggling} />
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t.craftsmanDashboard.incomingRequests}
      </Text>
      {incoming.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t.craftsmanDashboard.noNewRequests}
        </Text>
      ) : (
        incoming.map((booking) => (
          <View key={booking.id} style={[styles.requestCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.requestHeader}>
              <Text variant="titleSmall">{booking.clientName}</Text>
              {booking.scheduledAt && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {new Date(booking.scheduledAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </Text>
              )}
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {booking.description}
            </Text>
            <View style={styles.requestActions}>
              <Button
                mode="outlined"
                style={styles.requestButton}
                loading={actioningId === booking.id}
                disabled={actioningId !== null}
                onPress={() => act(booking.id, 'Rejected')}
              >
                {t.craftsmanDashboard.decline}
              </Button>
              <Button
                mode="contained"
                style={styles.requestButton}
                loading={actioningId === booking.id}
                disabled={actioningId !== null}
                onPress={() => act(booking.id, 'Accepted')}
              >
                {t.craftsmanDashboard.accept}
              </Button>
            </View>
          </View>
        ))
      )}

      {error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    flex: 1,
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 8,
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  requestButton: {
    flex: 1,
    borderRadius: 20,
  },
});