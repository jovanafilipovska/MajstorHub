import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { MyBookingsScreen } from '../screens/bookings/MyBookingsScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { LeaveReviewScreen } from '../screens/bookings/LeaveReviewScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { HamburgerButton } from '../components/HamburgerButton';
import { useTranslation } from '../i18n';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t.nav.profile }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.nav.settings }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: t.nav.favoriteProsTitle }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: t.nav.bookingHistoryTitle }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: t.nav.bookingTitle }} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: t.nav.leaveReviewTitle }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.otherPartyName })}
      />
    </Stack.Navigator>
  );
}