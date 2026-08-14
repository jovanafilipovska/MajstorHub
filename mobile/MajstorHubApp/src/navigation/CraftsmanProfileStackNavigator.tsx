import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CraftsmanProfileEditor } from '../screens/profile/CraftsmanProfileEditor';
import { HamburgerButton } from '../components/HamburgerButton';
import { useTranslation } from '../i18n';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function CraftsmanProfileStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen name="Profile" component={CraftsmanProfileEditor} options={{ title: t.nav.profile }} />
    </Stack.Navigator>
  );
}