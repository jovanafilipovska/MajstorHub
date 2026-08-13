import { IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';

export function LogoutButton() {
  const { logout } = useAuth();
  const t = useTranslation();
  return <IconButton icon="logout" onPress={() => logout()} accessibilityLabel={t.logoutButton.accessibilityLabel} />;
}
