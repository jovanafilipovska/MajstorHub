import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { LogoutButton } from '../components/LogoutButton';
import type { AdminUsersStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminUsersStackParamList>();

export function AdminUsersStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Users' }} />
    </Stack.Navigator>
  );
}
