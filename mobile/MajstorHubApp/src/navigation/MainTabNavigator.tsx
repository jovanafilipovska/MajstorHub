import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { mainNavItems } from './mainNavItems';
import { useWorkMode } from '../contexts/WorkModeContext';
import { useTranslation } from '../i18n';
import { navigationRef } from './navigationRef';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { mode } = useWorkMode();
  const t = useTranslation();

  // Jumps to each mode's landing tab whenever the role switches. `initialRouteName`
  // alone only applies on this navigator's first mount, not on later mode flips
  // while it stays mounted, so RoleSwitcher's mode change needs an explicit nudge
  // here (after the tab set below has re-rendered for the new mode, so the target
  // route actually exists to navigate to).
  useEffect(() => {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate(mode === 'craftsman' ? ('DashboardTab' as never) : ('BrowseTab' as never));
  }, [mode]);

  const items = mainNavItems.filter((item) => item.modes.includes(mode));

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      // Navigation between sections now happens through the drawer (see
      // AppDrawerMenu), so the visual tab bar is hidden - the Tab.Navigator
      // itself is kept purely for its routing/state-per-screen behavior.
      tabBar={() => null}
      initialRouteName={mode === 'craftsman' ? 'DashboardTab' : 'BrowseTab'}
    >
      {items.map((item) => (
        <Tab.Screen key={item.key} name={item.key} component={item.component} options={{ title: item.title(t) }} />
      ))}
    </Tab.Navigator>
  );
}
