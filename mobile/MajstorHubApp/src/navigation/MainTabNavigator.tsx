import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardStackNavigator } from './DashboardStackNavigator';
import { BrowseStackNavigator } from './BrowseStackNavigator';
import { BookingsStackNavigator } from './BookingsStackNavigator';
import { AssistantStackNavigator } from './AssistantStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { CraftsmanProfileStackNavigator } from './CraftsmanProfileStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { MessagesStackNavigator } from './MessagesStackNavigator';
import { useWorkMode } from '../contexts/WorkModeContext';
import { useChat } from '../contexts/ChatContext';
import { useTranslation } from '../i18n';
import { navigationRef } from './navigationRef';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { mode } = useWorkMode();
  const { totalUnread } = useChat();
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

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={mode === 'craftsman' ? 'DashboardTab' : 'BrowseTab'}
    >
      {mode === 'craftsman' && (
        <Tab.Screen
          name="DashboardTab"
          component={DashboardStackNavigator}
          options={{
            title: t.nav.dashboard,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
            ),
          }}
        />
      )}
      {mode === 'client' && (
        <Tab.Screen
          name="BrowseTab"
          component={BrowseStackNavigator}
          options={{
            title: t.nav.browse,
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" color={color} size={size} />,
          }}
        />
      )}
      {mode === 'craftsman' && (
        <Tab.Screen
          name="BookingsTab"
          component={BookingsStackNavigator}
          options={{
            title: t.nav.bookings,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="AssistantTab"
        component={AssistantStackNavigator}
        options={{
          title: t.nav.assistant,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackNavigator}
        options={{
          title: t.nav.messages,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={mode === 'craftsman' ? CraftsmanProfileStackNavigator : ProfileStackNavigator}
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
      {mode === 'craftsman' && (
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            title: t.nav.settings,
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}