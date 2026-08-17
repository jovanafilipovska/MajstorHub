import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { resolveMediaUrl } from '../api/client';
import { useTranslation } from '../i18n';
import type { CraftsmanProfileResponse } from '../types/api';

interface ChatSuggestionCardProps {
  item: CraftsmanProfileResponse;
  distanceLabel?: string | null;
  onPress: () => void;
}

export function ChatSuggestionCard({ item, distanceLabel, onPress }: ChatSuggestionCardProps) {
  const theme = useTheme();
  const t = useTranslation();

  const metaParts = [
    item.serviceCategoryName,
    item.averageRating ? `★ ${item.averageRating.toFixed(1)}` : t.craftsmanCard.noRatingsYet,
    distanceLabel,
  ].filter((part): part is string => !!part);

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {item.profileImageUrl ? (
        <Image source={{ uri: resolveMediaUrl(item.profileImageUrl) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon source="account-hard-hat" size={22} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.info}>
        <Text variant="titleSmall" numberOfLines={1}>
          {item.businessName || item.fullName}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
          {t.assistant.viewProfile} →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
