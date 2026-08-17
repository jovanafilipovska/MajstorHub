import type { ComponentType } from 'react';
import { DashboardStackNavigator } from './DashboardStackNavigator';
import { BrowseStackNavigator } from './BrowseStackNavigator';
import { BookingsStackNavigator } from './BookingsStackNavigator';
import { AssistantStackNavigator } from './AssistantStackNavigator';
import { MessagesStackNavigator } from './MessagesStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { CraftsmanProfileStackNavigator } from './CraftsmanProfileStackNavigator';
import type { WorkMode } from '../contexts/WorkModeContext';
import type { Translations } from '../i18n';
import type { MainTabParamList } from './types';

export interface MainNavItem {
  key: keyof MainTabParamList;
  icon: string;
  modes: WorkMode[];
  title: (t: Translations) => string;
  component: ComponentType;
}

// Single source of truth for the app's top-level destinations, consumed by
// both the (visually hidden) Tab.Navigator - which still owns routing/state -
// and the drawer menu that now triggers navigation between them.
export const mainNavItems: MainNavItem[] = [
  {
    key: 'DashboardTab',
    icon: 'view-dashboard',
    modes: ['craftsman'],
    title: (t) => t.nav.dashboard,
    component: DashboardStackNavigator,
  },
  {
    key: 'BrowseTab',
    icon: 'magnify',
    modes: ['client'],
    title: (t) => t.nav.browse,
    component: BrowseStackNavigator,
  },
  {
    key: 'BookingsTab',
    icon: 'calendar-check',
    modes: ['craftsman'],
    title: (t) => t.nav.bookings,
    component: BookingsStackNavigator,
  },
  {
    key: 'AssistantTab',
    icon: 'robot-outline',
    modes: ['client', 'craftsman'],
    title: (t) => t.nav.assistant,
    component: AssistantStackNavigator,
  },
  {
    key: 'MessagesTab',
    icon: 'message-text-outline',
    modes: ['client', 'craftsman'],
    title: (t) => t.nav.messages,
    component: MessagesStackNavigator,
  },
  {
    key: 'ProfileTab',
    icon: 'account',
    modes: ['client'],
    title: (t) => t.nav.profile,
    component: ProfileStackNavigator,
  },
  {
    key: 'ProfileTab',
    icon: 'account',
    modes: ['craftsman'],
    title: (t) => t.nav.profile,
    component: CraftsmanProfileStackNavigator,
  },
];
