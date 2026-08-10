import { IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export function LogoutButton() {
  const { logout } = useAuth();
  return <IconButton icon="logout" onPress={() => logout()} accessibilityLabel="Log out" />;
}
