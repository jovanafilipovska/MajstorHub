import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatbotScreen } from '../screens/assistant/ChatbotScreen';
import { CraftsmanDetailScreen } from '../screens/browse/CraftsmanDetailScreen';
import { CreateBookingScreen } from '../screens/browse/CreateBookingScreen';
import { HamburgerButton } from '../components/HamburgerButton';
import { useTranslation } from '../i18n';
import type { AssistantStackParamList } from './types';

const Stack = createNativeStackNavigator<AssistantStackParamList>();

export function AssistantStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CraftsmanDetail"
        component={CraftsmanDetailScreen}
        options={({ route }) => ({ title: route.params.craftsmanName ?? t.nav.craftsmanFallbackTitle })}
      />
      <Stack.Screen name="CreateBooking" component={CreateBookingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
