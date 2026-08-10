import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Text } from 'react-native-paper';
import { getMyBookings } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { StatusBadge } from '../../components/StatusBadge';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingResponse } from '../../types/api';

type Props = NativeStackScreenProps<BookingsStackParamList, 'MyBookings'>;

export function MyBookingsScreen({ navigation }: Props) {
  const { user, token } = useAuth();
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
        const otherParty = item.clientId === user?.id ? item.craftsmanName : item.clientName;
        return (
          <Card style={styles.card} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}>
            <Card.Title title={otherParty} subtitle={item.serviceCategoryName} />
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
