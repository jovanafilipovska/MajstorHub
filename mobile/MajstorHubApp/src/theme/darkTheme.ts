import { MD3DarkTheme } from 'react-native-paper';
import { darkColors, darkElevation } from './colors';
import { paperFonts } from './fonts';

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 5,
  fonts: paperFonts,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
    secondary: darkColors.onPrimaryContainer,
    onSecondary: darkColors.onPrimary,
    secondaryContainer: darkColors.primaryContainer,
    onSecondaryContainer: darkColors.onPrimaryContainer,
    tertiary: darkColors.onPrimaryContainer,
    onTertiary: darkColors.onPrimary,
    tertiaryContainer: darkColors.primaryContainer,
    onTertiaryContainer: darkColors.onPrimaryContainer,
    elevation: darkElevation,
  },
};
