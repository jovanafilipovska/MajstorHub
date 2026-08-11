import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { listFavorites, removeFavorite } from '../../api/favorites';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { ProfileStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse } from '../../types/api';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const theme = useTheme();
  const [favorites, setFavorites] = useState<CraftsmanProfileResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    listFavorites(token, controller.signal)
      .then(setFavorites)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load favorites.');
      });
    return () => controller.abort();
  }, [token]);

  useFocusEffect(load);

  const unfavorite = async (craftsmanUserId: string) => {
    if (!token) return;
    setRemovingId(craftsmanUserId);
    try {
      await removeFavorite(craftsmanUserId, token);
      setFavorites((prev) => prev?.filter((c) => c.userId !== craftsmanUserId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove favorite.');
    } finally {
      setRemovingId(null);
    }
  };

  const goToDetail = (craftsman: CraftsmanProfileResponse) => {
    const parentNavigate = navigation.getParent()?.navigate as unknown as
      | ((name: string, params: unknown) => void)
      | undefined;
    parentNavigate?.('BrowseTab', {
      screen: 'CraftsmanDetail',
      params: { craftsmanUserId: craftsman.userId, craftsmanName: craftsman.fullName },
    });
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!favorites) return <LoadingView />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={favorites}
      keyExtractor={(item) => item.userId}
      ListEmptyComponent={<Text style={styles.empty}>No favorite pros yet.</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card} onPress={() => goToDetail(item)}>
          <Card.Title
            title={item.fullName}
            subtitle={`${item.serviceCategoryName}${item.addressText ? ` · ${item.addressText}` : ''}`}
            right={(props) => (
              <IconButton
                {...props}
                icon="heart"
                iconColor={theme.colors.error}
                disabled={removingId === item.userId}
                onPress={() => unfavorite(item.userId)}
              />
            )}
          />
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
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});