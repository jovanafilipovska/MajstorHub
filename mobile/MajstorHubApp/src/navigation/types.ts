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
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Favorites: undefined;
  MyBookings: undefined;
  BookingDetail: { bookingId: string };
  LeaveReview: { bookingId: string; craftsmanName: string };
  BusinessProfile: undefined;
};

export type MainTabParamList = {
  BrowseTab: NavigatorScreenParams<BrowseStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
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
