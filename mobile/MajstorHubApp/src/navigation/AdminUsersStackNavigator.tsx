import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { LogoutButton } from '../components/LogoutButton';
import { useTranslation } from '../i18n';
import type { AdminUsersStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminUsersStackParamList>();

export function AdminUsersStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="Users" component={AdminUsersScreen} options={{ title: t.nav.usersTitle }} />
    </Stack.Navigator>
  );
}