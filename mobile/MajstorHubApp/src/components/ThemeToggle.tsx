import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { useThemeMode } from '../contexts/ThemeContext';
import type { ThemeMode } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="labelLarge">Appearance</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as ThemeMode)}
        buttons={[
          { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
          { value: 'dark', label: 'Dark', icon: 'weather-night' },
        ]}
      />
    </View>
  );
}
