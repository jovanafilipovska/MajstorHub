import { ScrollView, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export function AdminSettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemeToggle />
      <Divider />
      <LanguageSwitcher />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
});
