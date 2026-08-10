import { Chip, useTheme } from 'react-native-paper';
import { statusColors } from '../theme';
import type { BookingStatus } from '../types/api';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const theme = useTheme();
  const { bg, text } = theme.dark ? statusColors[status].dark : statusColors[status].light;

  return (
    <Chip
      style={{ alignSelf: 'flex-start', backgroundColor: bg }}
      textStyle={{ color: text }}
    >
      {status}
    </Chip>
  );
}
