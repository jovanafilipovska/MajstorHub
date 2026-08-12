import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCraftsmanProfile } from '../../api/craftsmen';
import { getMyBookings } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { CraftsmanProfileEditor } from './CraftsmanProfileEditor';
import { CraftsmanDashboard } from './CraftsmanDashboard';
import type { ProfileStackParamList } from '../../navigation/types';
import type { BookingResponse, CraftsmanProfileResponse } from '../../types/api';

interface Props {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;
}

export function CraftsmanHome({ navigation }: Props) {
  const { user, token } = useAuth();
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
        // Transient load failure - the setup form / dashboard will simply not render this pass;
        // useFocusEffect re-runs this on the next focus.
      });
    if (token) {
      getMyBookings(token)
        .then(setBookings)
        .catch(() => {});
    }
  }, [user, token]);

  useFocusEffect(load);

  if (profile === undefined) return <LoadingView />;
  if (profile === null) return <CraftsmanProfileEditor />;

  return (
    <CraftsmanDashboard
      profile={profile}
      bookings={bookings}
      onProfileChange={setProfile}
      onBookingsChange={setBookings}
      onEditProfile={() => navigation.navigate('BusinessProfile')}
    />
  );
}