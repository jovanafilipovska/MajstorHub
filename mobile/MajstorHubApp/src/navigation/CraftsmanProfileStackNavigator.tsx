import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CraftsmanProfileEditor } from '../screens/profile/CraftsmanProfileEditor';
import { HamburgerButton } from '../components/HamburgerButton';
import { TabBackButton } from '../components/TabBackButton';
import { useTranslation } from '../i18n';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function CraftsmanProfileStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <HamburgerButton /> }}>
      <Stack.Screen
        name="Profile"
        component={CraftsmanProfileEditor}
        options={{ title: t.nav.profile, headerLeft: () => <TabBackButton /> }}
      />
    </Stack.Navigator>
  );
}