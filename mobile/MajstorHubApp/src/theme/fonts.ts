import { configureFonts } from 'react-native-paper';
import type { MD3Type } from 'react-native-paper/lib/typescript/types';

function font(fontFamily: string, fontWeight: MD3Type['fontWeight']): Partial<MD3Type> {
  // Nunito ships as static per-weight files, not a variable font — fontWeight
  // must match fontFamily or Android will synthetically re-bold the glyphs.
  return { fontFamily, fontWeight };
}

const extraBold = font('Nunito_800ExtraBold', '800');
const bold = font('Nunito_700Bold', '700');
const semiBold = font('Nunito_600SemiBold', '600');
const regular = font('Nunito_400Regular', '400');

export const paperFonts = configureFonts({
  config: {
    displayLarge: extraBold,
    displayMedium: extraBold,
    displaySmall: extraBold,
    headlineLarge: extraBold,
    headlineMedium: bold,
    headlineSmall: bold,
    titleLarge: bold,
    titleMedium: bold,
    titleSmall: semiBold,
    labelLarge: bold,
    labelMedium: semiBold,
    labelSmall: semiBold,
    bodyLarge: regular,
    bodyMedium: regular,
    bodySmall: regular,
  },
});
