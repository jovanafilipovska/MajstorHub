import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Text, useTheme } from 'react-native-paper';
import { getCraftsmanProfile } from '../../api/craftsmen';
import { getMyBookings } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { CraftsmanDashboard } from './CraftsmanDashboard';
import { useTranslation } from '../../i18n';
import type { DashboardStackParamList } from '../../navigation/types';
import type { BookingResponse, CraftsmanProfileResponse } from '../../types/api';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>;

export function CraftsmanDashboardScreen({ navigation }: Props) {
  const { user, token } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const [profile, setProfile] = useState<CraftsmanProfileResponse | null | undefined>(undefined);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    getCraftsmanProfile(user.id)
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setProfile(null);
          return;
        }
        // Transient load failure - useFocusEffect re-runs this on the next focus.
      });
    if (token) {
      getMyBookings(token)
        .then(setBookings)
        .catch(() => {});
    }
  }, [user, token]);

  useFocusEffect(load);

  if (profile === undefined) return <LoadingView />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile === null ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="titleMedium">{t.craftsmanDashboardScreen.setUpTitle}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t.craftsmanDashboardScreen.setUpBody}
          </Text>
          <Button mode="contained" onPress={() => navigation.getParent()?.navigate('ProfileTab' as never)}>
            {t.craftsmanDashboardScreen.goToProfile}
          </Button>
        </View>
      ) : (
        <CraftsmanDashboard
          profile={profile}
          bookings={bookings}
          onProfileChange={setProfile}
          onBookingsChange={setBookings}
          onViewReviews={() => navigation.navigate('MyReviews')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
});