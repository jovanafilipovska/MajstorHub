import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyBookingsScreen } from '../screens/bookings/MyBookingsScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { LeaveReviewScreen } from '../screens/bookings/LeaveReviewScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { useTranslation } from '../i18n';
import type { BookingsStackParamList } from './types';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: t.nav.receivedBookingsTitle }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: t.nav.bookingDetailsTitle }} />
      <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} options={{ title: t.nav.leaveReviewTitle }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.otherPartyName })}
      />
    </Stack.Navigator>
  );
}