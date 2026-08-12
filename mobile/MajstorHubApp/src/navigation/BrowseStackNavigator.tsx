import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/browse/HomeScreen';
import { CraftsmenListScreen } from '../screens/browse/CraftsmenListScreen';
import { CraftsmanDetailScreen } from '../screens/browse/CraftsmanDetailScreen';
import { CreateBookingScreen } from '../screens/browse/CreateBookingScreen';
import type { BrowseStackParamList } from './types';

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export function BrowseStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CraftsmenList"
        component={CraftsmenListScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="CraftsmanDetail"
        component={CraftsmanDetailScreen}
        options={({ route }) => ({ title: route.params.craftsmanName ?? 'Craftsman' })}
      />
      <Stack.Screen name="CreateBooking" component={CreateBookingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
