import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Chip, Text } from 'react-native-paper';
import { listCraftsmenByCategory } from '../../api/craftsmen';
import { ApiError } from '../../api/client';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CraftsmenList'>;

export function CraftsmenListScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;
  const [craftsmen, setCraftsmen] = useState<CraftsmanProfileResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    listCraftsmenByCategory(categoryId)
      .then(setCraftsmen)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load craftsmen.'));
  }, [categoryId]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!craftsmen) return <LoadingView />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={craftsmen}
      keyExtractor={(item) => item.userId}
      ListEmptyComponent={
        <Text style={styles.empty}>No {categoryName} craftsmen yet.</Text>
      }
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() =>
            navigation.navigate('CraftsmanDetail', { craftsmanUserId: item.userId, craftsmanName: item.fullName })
          }
        >
          <Card.Title
            title={item.fullName}
            subtitle={`$${item.hourlyRate.toFixed(2)}/hr${
              item.averageRating ? ` · ${item.averageRating.toFixed(1)}★ (${item.reviewCount})` : ' · No ratings yet'
            }`}
          />
          <Card.Content>
            <View style={styles.chipRow}>
              <Chip compact>{item.isAvailable ? 'Available' : 'Unavailable'}</Chip>
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
  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});
