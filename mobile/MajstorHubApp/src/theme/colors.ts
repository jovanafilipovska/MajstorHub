import type { BookingStatus } from '../types/api';

export const lightColors = {
  primary: '#C1623A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F0DDD1',
  onPrimaryContainer: '#8C4526',
  background: '#F7F1E8',
  onBackground: '#3A2E22',
  surface: '#FFFFFF',
  onSurface: '#3A2E22',
  surfaceVariant: '#F1E6D6',
  onSurfaceVariant: '#7C6F5F',
  outline: '#E9DFD1',
  outlineVariant: '#EADFCB',
};

export const darkColors = {
  primary: '#E08A55',
  onPrimary: '#181410',
  primaryContainer: '#3A2A1C',
  onPrimaryContainer: '#F0B98A',
  background: '#181410',
  onBackground: '#F5EEE3',
  surface: '#241E17',
  onSurface: '#F5EEE3',
  surfaceVariant: '#120F0C',
  onSurfaceVariant: '#9C8E78',
  outline: '#362C20',
  outlineVariant: '#362C20',
};

// Elevated Cards read colors.elevation.levelN as background. MD3's stock values
// are hardcoded from the default purple palette, not derived from `primary`,
// so they'd tint every card faintly purple against this warm palette unless
// overridden here (primary blended over surface at MD3's own stock opacities).
export const lightElevation = {
  level0: 'transparent',
  level1: '#FCF7F5',
  level2: '#FAF2EF',
  level3: '#F8EEE9',
  level4: '#F8ECE7',
  level5: '#F6E9E3',
};

export const darkElevation = {
  level0: 'transparent',
  level1: '#2D2319',
  level2: '#33271C',
  level3: '#392A1E',
  level4: '#3B2B1E',
  level5: '#3E2D20',
};

export const starRatingColor = {
  light: '#C08A2E',
  dark: '#E3A94A',
};

interface StatusColorPair {
  bg: string;
  text: string;
}

export const statusColors: Record<BookingStatus, { light: StatusColorPair; dark: StatusColorPair }> = {
  Accepted: {
    light: { bg: '#F0DDD1', text: '#8C4526' },
    dark: { bg: '#3A2A1C', text: '#F0B98A' },
  },
  Rejected: {
    light: { bg: '#F9DEDC', text: '#410E0B' },
    dark: { bg: '#8C1D18', text: '#F2B8B5' },
  },
  Cancelled: {
    light: { bg: '#E9DFD1', text: '#7C6F5F' },
    dark: { bg: '#362C20', text: '#9C8E78' },
  },
  Pending: {
    light: { bg: '#F3E6C8', text: '#8A6420' },
    dark: { bg: '#3A2E14', text: '#E8C87A' },
  },
  Completed: {
    light: { bg: '#E4E9D8', text: '#4C5736' },
    dark: { bg: '#2A3020', text: '#B9C99A' },
  },
};
