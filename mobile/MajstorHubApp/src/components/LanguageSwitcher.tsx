import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n';

const LANGUAGE_OPTIONS: { value: Language; flag: string; label: string }[] = [
  { value: 'mk', flag: '🇲🇰', label: 'Македонски' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'sq', flag: '🇦🇱', label: 'Shqip' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const current = LANGUAGE_OPTIONS.find((option) => option.value === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <View style={styles.root}>
      <Text variant="labelLarge">{t.languageSwitcher.language}</Text>
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <Button mode="outlined" onPress={() => setMenuOpen(true)} contentStyle={styles.anchorContent}>
            {`${current.flag}  ${current.label}`}
          </Button>
        }
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <Menu.Item
            key={option.value}
            leadingIcon={() => <Text style={styles.flag}>{option.flag}</Text>}
            title={option.label}
            onPress={() => {
              setLanguage(option.value);
              setMenuOpen(false);
            }}
          />
        ))}
      </Menu>
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
  flag: {
    fontSize: 18,
  },
});
