import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { resolveMediaUrl } from '../api/client';
import { useTranslation } from '../i18n';
import type { CraftsmanProfileResponse } from '../types/api';
import { GrayscaleImage } from './GrayscaleImage';

const CARD_PADDING = 10;

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
  const t = useTranslation();
  return (
    <Pressable onPress={onPress} style={[styles.gridCard, { width, backgroundColor: theme.colors.surface }]}>
      <View style={styles.imageWrapper}>
        {item.profileImageUrl ? (
          item.isAvailable ? (
            <Image source={{ uri: resolveMediaUrl(item.profileImageUrl) }} style={styles.cardImage} />
          ) : (
            <GrayscaleImage
              uri={resolveMediaUrl(item.profileImageUrl)}
              size={width - CARD_PADDING * 2}
              filterId={`grayscale-${item.userId}`}
            />
          )
        ) : (
          <CraftsmanImagePlaceholder tint={theme.colors.surfaceVariant} icon="account-hard-hat" />
        )}
        {!item.isAvailable && (
          <View style={[styles.unavailableRibbon, { backgroundColor: theme.colors.error }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onError }} numberOfLines={1}>
              {t.craftsmanCard.unavailable}
            </Text>
          </View>
        )}
        {item.isVerified && (
          <View style={[styles.verifiedCorner, { backgroundColor: theme.colors.surface }]}>
            <Icon source="check-decagram" size={16} color={theme.colors.primary} />
          </View>
        )}
        {cornerAction && <View style={styles.cornerActionSlot}>{cornerAction}</View>}
      </View>
      <Text variant="titleSmall" numberOfLines={1} style={styles.cardName}>
        {item.fullName}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.primary }} numberOfLines={1}>
        {item.serviceCategoryName}
        {item.addressText ? ` · ${item.addressText}` : ''}
      </Text>
      {distanceLabel && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {distanceLabel} {t.craftsmanCard.away}
        </Text>
      )}
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
        {item.averageRating ? `★ ${item.averageRating.toFixed(1)} (${item.reviewCount})` : t.craftsmanCard.noRatingsYet}{' '}
        · {item.hourlyRate.toFixed(0)} $/hr
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
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableRibbon: {
    position: 'absolute',
    bottom: 25,
    left: -34,
    width: 130,
    paddingVertical: 3,
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
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