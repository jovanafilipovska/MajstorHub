import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatbotScreen } from '../screens/assistant/ChatbotScreen';
import { HamburgerButton } from '../components/HamburgerButton';
import type { AssistantStackParamList } from './types';

const Stack = createNativeStackNavigator<AssistantStackParamList>();

export function AssistantStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}