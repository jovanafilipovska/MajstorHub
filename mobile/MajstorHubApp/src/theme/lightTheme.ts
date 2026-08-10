import { MD3LightTheme } from 'react-native-paper';
import { lightColors, lightElevation } from './colors';
import { paperFonts } from './fonts';

export const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 5,
  fonts: paperFonts,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
    secondary: lightColors.onPrimaryContainer,
    onSecondary: lightColors.onPrimary,
    secondaryContainer: lightColors.primaryContainer,
    onSecondaryContainer: lightColors.onPrimaryContainer,
    tertiary: lightColors.onPrimaryContainer,
    onTertiary: lightColors.onPrimary,
    tertiaryContainer: lightColors.primaryContainer,
    onTertiaryContainer: lightColors.onPrimaryContainer,
    elevation: lightElevation,
  },
};
