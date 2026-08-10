import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyBookingsScreen } from '../screens/bookings/MyBookingsScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { LeaveReviewScreen } from '../screens/bookings/LeaveReviewScreen';
import { LogoutButton } from '../components/LogoutButton';
import type { BookingsStackParamList } from './types';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: 'Leave a Review' }} />
    </Stack.Navigator>
  );
}
