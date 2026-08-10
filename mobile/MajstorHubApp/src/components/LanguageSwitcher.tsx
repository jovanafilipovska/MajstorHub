import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="labelLarge">Language</Text>
      <SegmentedButtons
        value={language}
        onValueChange={(value) => setLanguage(value as Language)}
        buttons={[
          { value: 'mk', label: 'Македонски' },
          { value: 'sq', label: 'Shqip' },
          { value: 'en', label: 'English' },
        ]}
      />
    </View>
  );
}
