import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { listFavorites, removeFavorite } from '../../api/favorites';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { CraftsmanCard } from '../../components/CraftsmanCard';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { ProfileStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse } from '../../types/api';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Favorites'>;

const GRID_PADDING = 16;
const GRID_GAP = 12;

export function FavoritesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
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
        setError(apiErrorMessage(err, t, t.favorites.failedToLoad));
      });
    return () => controller.abort();
  }, [token, t]);

  useFocusEffect(load);

  const unfavorite = async (craftsmanUserId: string) => {
    if (!token) return;
    setRemovingId(craftsmanUserId);
    try {
      await removeFavorite(craftsmanUserId, token);
      setFavorites((prev) => prev?.filter((c) => c.userId !== craftsmanUserId) ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, t, t.favorites.failedToRemove));
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
      columnWrapperStyle={styles.row}
      numColumns={2}
      data={favorites}
      keyExtractor={(item) => item.userId}
      ListEmptyComponent={<Text style={styles.empty}>{t.favorites.empty}</Text>}
      renderItem={({ item }) => (
        <CraftsmanCard
          item={item}
          width={cardWidth}
          onPress={() => goToDetail(item)}
          cornerAction={
            <IconButton
              icon="heart"
              size={18}
              iconColor={theme.colors.error}
              containerColor={theme.colors.surface}
              disabled={removingId === item.userId}
              onPress={() => unfavorite(item.userId)}
            />
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});