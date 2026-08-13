import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useTranslation } from '../i18n';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const t = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: t.auth.register.submit }}
      />
    </Stack.Navigator>
  );
}