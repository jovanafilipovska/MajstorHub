import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LogoutButton } from '../components/LogoutButton';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
