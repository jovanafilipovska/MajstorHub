import { useCallback, useState } from 'react';
import { FlatList, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Card, Chip, Text, useTheme } from 'react-native-paper';
import { getMyBookings } from '../../api/bookings';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { StatusBadge } from '../../components/StatusBadge';
import { apiErrorMessage, useTranslation } from '../../i18n';
import { localizedText } from '../../utils/categoryName';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingResponse, BookingStatus } from '../../types/api';

type Props = NativeStackScreenProps<BookingsStackParamList, 'MyBookings'>;

const STATUS_FILTERS: Array<BookingStatus | 'All'> = ['All', 'Pending', 'Accepted', 'Completed', 'Rejected', 'Cancelled'];

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export function MyBookingsScreen({ navigation }: Props) {
  const { user, token } = useAuth();
  const { mode } = useWorkMode();
  const { language } = useLanguage();
  const theme = useTheme();
  const t = useTranslation();
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getMyBookings(token, controller.signal)
      .then(setBookings)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(apiErrorMessage(err, t, t.myBookings.failedToLoad));
      });
    return () => controller.abort();
  }, [token, t]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!bookings) return <LoadingView />;

  // Craftsman mode shows bookings received as the provider; client mode shows
  // bookings the user made as the customer - a single user can be both across
  // different bookings, so this list is scoped to the role they're viewing as.
  const visibleBookings = bookings.filter((b) =>
    mode === 'craftsman' ? b.craftsmanProfileId === user?.id : b.clientId === user?.id,
  );
  const filteredBookings =
    statusFilter === 'All' ? visibleBookings : visibleBookings.filter((b) => b.status === statusFilter);

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={filteredBookings}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              selected={statusFilter === status}
              showSelectedCheck={false}
              onPress={() => setStatusFilter(status)}
              style={{
                backgroundColor: statusFilter === status ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: statusFilter === status ? theme.colors.primary : theme.colors.outline,
              }}
              textStyle={{ color: statusFilter === status ? theme.colors.onPrimary : theme.colors.onSurface }}
            >
              {t.status[status]}
            </Chip>
          ))}
        </ScrollView>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {visibleBookings.length === 0
            ? mode === 'craftsman'
              ? t.myBookings.noReceivedBookings
              : t.myBookings.noMadeBookings
            : t.myBookings.noStatusBookings(t.status[statusFilter])}
        </Text>
      }
      renderItem={({ item }) => {
        const isClient = item.clientId === user?.id;
        const otherPartyName = isClient ? item.craftsmanName : item.clientName;
        const otherPartyImageUrl = isClient ? item.craftsmanProfileImageUrl : item.clientProfileImageUrl;
        return (
          <Card style={styles.card} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}>
            <Card.Title
              title={otherPartyName}
              subtitle={localizedText(item.serviceCategoryNameEn, item.serviceCategoryNameMk, item.serviceCategoryNameSq, language)}
              left={(props) =>
                otherPartyImageUrl ? (
                  <Avatar.Image size={props.size} source={{ uri: resolveMediaUrl(otherPartyImageUrl) }} />
                ) : (
                  <Avatar.Text
                    size={props.size}
                    label={initialsOf(otherPartyName)}
                    style={{ backgroundColor: theme.colors.primary }}
                    labelStyle={{ color: theme.colors.onPrimary }}
                  />
                )
              }
            />
            <Card.Content>
              <StatusBadge status={item.status} />
            </Card.Content>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});
