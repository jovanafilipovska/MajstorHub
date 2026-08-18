import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Card, Chip, Icon, Text, useTheme } from 'react-native-paper';
import { listCraftsmenByCategory } from '../../api/craftsmen';
import { resolveMediaUrl } from '../../api/client';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CraftsmenList'>;

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export function CraftsmenListScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const t = useTranslation();
  const { categoryId, categoryName } = route.params;
  const [craftsmen, setCraftsmen] = useState<CraftsmanProfileResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    listCraftsmenByCategory(categoryId)
      .then(setCraftsmen)
      .catch((err) => setError(apiErrorMessage(err, t, t.craftsmenList.failedToLoad)));
  }, [categoryId, t]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!craftsmen) return <LoadingView />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={craftsmen}
      keyExtractor={(item) => item.userId}
      ListEmptyComponent={<Text style={styles.empty}>{t.craftsmenList.empty(categoryName)}</Text>}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() =>
            navigation.navigate('CraftsmanDetail', {
              craftsmanUserId: item.userId,
              craftsmanName: item.businessName || item.fullName,
            })
          }
        >
          {item.isVerified && (
            <View style={[styles.verifiedCorner, { backgroundColor: theme.colors.surface }]}>
              <Icon source="check-decagram" size={18} color={theme.colors.primary} />
            </View>
          )}
          <Card.Title
            title={item.businessName || item.fullName}
            subtitle={`$${item.hourlyRate.toFixed(2)}/hr${
              item.averageRating
                ? ` · ${item.averageRating.toFixed(1)}★ (${item.reviewCount})`
                : ` · ${t.craftsmenList.noRatingsYet}`
            }`}
            left={(props) =>
              item.profileImageUrl ? (
                <Avatar.Image size={props.size} source={{ uri: resolveMediaUrl(item.profileImageUrl) }} />
              ) : (
                <Avatar.Text
                  size={props.size}
                  label={initialsOf(item.fullName)}
                  style={{ backgroundColor: theme.colors.primary }}
                  labelStyle={{ color: theme.colors.onPrimary }}
                />
              )
            }
          />
          <Card.Content>
            <View style={styles.chipRow}>
              <Chip compact>{item.isAvailable ? t.craftsmenList.available : t.craftsmenList.unavailable}</Chip>
            </View>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  verifiedCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 3,
    zIndex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});
