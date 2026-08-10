import { View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { starRatingColor } from '../theme';

export function StarRatingInput({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  const theme = useTheme();
  const goldColor = theme.dark ? starRatingColor.dark : starRatingColor.light;

  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <IconButton
          key={value}
          icon={value <= rating ? 'star' : 'star-outline'}
          iconColor={goldColor}
          size={32}
          onPress={() => onChange(value)}
          accessibilityLabel={`${value} star${value > 1 ? 's' : ''}`}
        />
      ))}
    </View>
  );
}
