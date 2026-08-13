import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { statusColors } from '../theme';
import { useTranslation } from '../i18n';
import type { BookingStatus } from '../types/api';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const theme = useTheme();
  const t = useTranslation();
  const { bg, text } = theme.dark ? statusColors[status].dark : statusColors[status].light;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text variant="labelLarge" style={{ color: text }}>
        {t.status[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});