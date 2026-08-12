import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import { getMyBookings } from '../../api/bookings';
import { ApiError, resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { StatusBadge } from '../../components/StatusBadge';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingResponse } from '../../types/api';

type Props = NativeStackScreenProps<BookingsStackParamList, 'MyBookings'>;

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
  const theme = useTheme();
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getMyBookings(token, controller.signal)
      .then(setBookings)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load bookings.');
      });
    return () => controller.abort();
  }, [token]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!bookings) return <LoadingView />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={bookings}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
      renderItem={({ item }) => {
        const isClient = item.clientId === user?.id;
        const otherPartyName = isClient ? item.craftsmanName : item.clientName;
        const otherPartyImageUrl = isClient ? item.craftsmanProfileImageUrl : item.clientProfileImageUrl;
        return (
          <Card style={styles.card} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}>
            <Card.Title
              title={otherPartyName}
              subtitle={item.serviceCategoryName}
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
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});
