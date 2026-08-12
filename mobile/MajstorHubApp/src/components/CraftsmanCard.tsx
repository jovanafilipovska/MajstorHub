import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { resolveMediaUrl } from '../api/client';
import type { CraftsmanProfileResponse } from '../types/api';

function CraftsmanImagePlaceholder({ tint, icon }: { tint: string; icon: string }) {
  return (
    <View style={[styles.cardImage, { backgroundColor: tint }]}>
      <Icon source={icon} size={40} color="#00000033" />
    </View>
  );
}

interface CraftsmanCardProps {
  item: CraftsmanProfileResponse;
  width: number;
  distanceLabel?: string | null;
  onPress: () => void;
  cornerAction?: ReactNode;
}

export function CraftsmanCard({ item, width, distanceLabel, onPress, cornerAction }: CraftsmanCardProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.gridCard, { width, backgroundColor: theme.colors.surface }]}>
      {item.profileImageUrl ? (
        <Image source={{ uri: resolveMediaUrl(item.profileImageUrl) }} style={styles.cardImage} />
      ) : (
        <CraftsmanImagePlaceholder tint={theme.colors.surfaceVariant} icon="account-hard-hat" />
      )}
      {item.isVerified && (
        <View style={[styles.verifiedCorner, { backgroundColor: theme.colors.surface }]}>
          <Icon source="check-decagram" size={16} color={theme.colors.primary} />
        </View>
      )}
      {cornerAction && <View style={styles.cornerActionSlot}>{cornerAction}</View>}
      <Text variant="titleSmall" numberOfLines={1} style={styles.cardName}>
        {item.fullName}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.primary }} numberOfLines={1}>
        {item.serviceCategoryName}
        {item.addressText ? ` · ${item.addressText}` : ''}
      </Text>
      {distanceLabel && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {distanceLabel} away
        </Text>
      )}
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
        {item.averageRating ? `★ ${item.averageRating.toFixed(1)} (${item.reviewCount})` : 'No ratings yet'} ·{' '}
        {item.hourlyRate.toFixed(0)} $/hr
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    borderRadius: 16,
    padding: 10,
    gap: 6,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  verifiedCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 3,
  },
  cornerActionSlot: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  cardName: {
    marginTop: 2,
  },
});