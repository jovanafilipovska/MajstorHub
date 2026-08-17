import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useThemeMode } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n';

export function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();
  const t = useTranslation();

  const isDark = mode === 'dark';

  return (
    <View style={styles.root}>
      <Text variant="labelLarge">{t.themeToggle.appearance}</Text>
      <Button
        mode="outlined"
        onPress={() => toggleTheme()}
        contentStyle={styles.anchorContent}
        icon={isDark ? 'weather-night' : 'white-balance-sunny'}
      >
        {isDark ? t.themeToggle.dark : t.themeToggle.light}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  anchorContent: {
    justifyContent: 'flex-start',
  },
});