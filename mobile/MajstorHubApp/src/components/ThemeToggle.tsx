import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { useThemeMode } from '../contexts/ThemeContext';
import type { ThemeMode } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n';

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();
  const t = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="labelLarge">{t.themeToggle.appearance}</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as ThemeMode)}
        buttons={[
          { value: 'light', label: t.themeToggle.light, icon: 'white-balance-sunny' },
          { value: 'dark', label: t.themeToggle.dark, icon: 'weather-night' },
        ]}
      />
    </View>
  );
}