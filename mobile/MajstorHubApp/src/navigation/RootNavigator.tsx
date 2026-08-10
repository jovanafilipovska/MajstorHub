import { useAuth } from '../contexts/AuthContext';
import { useWorkMode } from '../contexts/WorkModeContext';
import { LoadingView } from '../components/LoadingView';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';

export function RootNavigator() {
  const { token, user, isLoading: authLoading } = useAuth();
  const { isLoading: workModeLoading } = useWorkMode();

  if (authLoading) return <LoadingView fullScreen />;
  if (!token || !user) return <AuthNavigator />;
  if (user.role !== 'Admin' && workModeLoading) return <LoadingView fullScreen />;
  return user.role === 'Admin' ? <AdminTabNavigator /> : <MainTabNavigator />;
}
