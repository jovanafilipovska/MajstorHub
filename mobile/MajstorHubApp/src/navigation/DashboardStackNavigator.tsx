import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CraftsmanDashboardScreen } from '../screens/profile/CraftsmanDashboardScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { useTranslation } from '../i18n';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStackNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={CraftsmanDashboardScreen} options={{ title: t.nav.dashboard }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: t.nav.myReviewsTitle }} />
    </Stack.Navigator>
  );
}