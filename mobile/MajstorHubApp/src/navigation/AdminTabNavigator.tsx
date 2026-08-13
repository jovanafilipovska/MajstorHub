import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminUsersStackNavigator } from './AdminUsersStackNavigator';
import { AdminCategoriesStackNavigator } from './AdminCategoriesStackNavigator';
import { AdminSettingsStackNavigator } from './AdminSettingsStackNavigator';
import { useTranslation } from '../i18n';
import type { AdminTabParamList } from './types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabNavigator() {
  const t = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="UsersTab"
        component={AdminUsersStackNavigator}
        options={{
          title: t.nav.usersTitle,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={AdminCategoriesStackNavigator}
        options={{
          title: t.nav.categoriesTitle,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="shape" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={AdminSettingsStackNavigator}
        options={{
          title: t.nav.settings,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}