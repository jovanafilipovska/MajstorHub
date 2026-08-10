import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { LogoutButton } from '../components/LogoutButton';
import type { AdminSettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminSettingsStackParamList>();

export function AdminSettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="Settings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
