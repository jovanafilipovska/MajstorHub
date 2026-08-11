import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BrowseStackNavigator } from './BrowseStackNavigator';
import { BookingsStackNavigator } from './BookingsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useWorkMode } from '../contexts/WorkModeContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { mode } = useWorkMode();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={mode === 'craftsman' ? 'ProfileTab' : 'BrowseTab'}
    >
      {mode === 'client' && (
        <Tab.Screen
          name="BrowseTab"
          component={BrowseStackNavigator}
          options={{
            title: 'Browse',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" color={color} size={size} />,
          }}
        />
      )}
      {mode === 'craftsman' && (
        <Tab.Screen
          name="BookingsTab"
          component={BookingsStackNavigator}
          options={{
            title: 'My Bookings',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-check" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
