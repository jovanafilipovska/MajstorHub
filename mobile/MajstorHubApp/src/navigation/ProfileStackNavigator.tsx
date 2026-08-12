import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { CraftsmanProfileEditor } from '../screens/profile/CraftsmanProfileEditor';
import { MyBookingsScreen } from '../screens/bookings/MyBookingsScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { LeaveReviewScreen } from '../screens/bookings/LeaveReviewScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorite Pros' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'Booking History' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Leave a Review' }} />
      <Stack.Screen name="BusinessProfile" component={CraftsmanProfileEditor} options={{ title: 'Business Profile' }} />
    </Stack.Navigator>
  );
}