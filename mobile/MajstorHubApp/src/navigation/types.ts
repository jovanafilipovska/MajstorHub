import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type BrowseStackParamList = {
  Home: undefined;
  CraftsmenList: { categoryId: number; categoryName: string };
  CraftsmanDetail: { craftsmanUserId: string; craftsmanName?: string };
  CreateBooking: { craftsmanUserId: string; craftsmanName: string; serviceCategoryId: number };
};

export type BookingsStackParamList = {
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
  LeaveReview: { bookingId: string; craftsmanName: string };
  Chat: { bookingId: string; otherPartyName: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Favorites: undefined;
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
  LeaveReview: { bookingId: string; craftsmanName: string };
  Chat: { bookingId: string; otherPartyName: string };
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  MyReviews: undefined;
};

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { bookingId: string; otherPartyName: string };
};

export type AssistantStackParamList = {
  Chatbot: undefined;
  CraftsmanDetail: { craftsmanUserId: string; craftsmanName?: string };
  CreateBooking: { craftsmanUserId: string; craftsmanName: string; serviceCategoryId: number };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  BrowseTab: NavigatorScreenParams<BrowseStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList>;
  AssistantTab: NavigatorScreenParams<AssistantStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type AdminUsersStackParamList = {
  Users: undefined;
};

export type AdminCategoriesStackParamList = {
  Categories: undefined;
};

export type AdminSettingsStackParamList = {
  Settings: undefined;
};

export type AdminTabParamList = {
  UsersTab: NavigatorScreenParams<AdminUsersStackParamList>;
  CategoriesTab: NavigatorScreenParams<AdminCategoriesStackParamList>;
  SettingsTab: NavigatorScreenParams<AdminSettingsStackParamList>;
};
