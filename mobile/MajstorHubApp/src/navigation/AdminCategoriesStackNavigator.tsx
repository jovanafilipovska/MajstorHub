import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminCategoriesScreen } from '../screens/admin/AdminCategoriesScreen';
import { LogoutButton } from '../components/LogoutButton';
import { useTranslation } from '../i18n';
import type { AdminCategoriesStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminCategoriesStackParamList>();

export function AdminCategoriesStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="Categories" component={AdminCategoriesScreen} options={{ title: t.nav.categoriesTitle }} />
    </Stack.Navigator>
  );
}