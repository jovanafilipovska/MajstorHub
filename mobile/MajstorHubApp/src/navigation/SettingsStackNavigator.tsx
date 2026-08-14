import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { HamburgerButton } from '../components/HamburgerButton';
import { useTranslation } from '../i18n';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.nav.settings }} />
    </Stack.Navigator>
  );
}