import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConversationsScreen } from '../screens/messages/ConversationsScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { HamburgerButton } from '../components/HamburgerButton';
import { useTranslation } from '../i18n';
import type { MessagesStackParamList } from './types';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: t.nav.messages }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.otherPartyName })}
      />
    </Stack.Navigator>
  );
}