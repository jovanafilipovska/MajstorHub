import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import { listServiceCategories } from '../../api/serviceCategories';
import { listAllCraftsmen, listCraftsmenByCategory } from '../../api/craftsmen';
import { getMyBookings } from '../../api/bookings';
import { useAuth } from '../../contexts/AuthContext';
import { distanceKm } from '../../utils/geo';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { CraftsmanCard } from '../../components/CraftsmanCard';
import { HamburgerButton } from '../../components/HamburgerButton';
import { TabBackButton } from '../../components/TabBackButton';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { BrowseStackParamList } from '../../navigation/types';
import type { BookingResponse, CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Home'>;
type CategoryFilter = 'all' | number;
interface Coordinates {
  latitude: number;
  longitude: number;
}

const NEAR_YOU_RADIUS_KM = 20;
const NEAR_YOU_CARD_WIDTH = 160;
const NEW_CARD_WIDTH = 160;
const NEW_COUNT = 8;
const RECOMMENDED_CARD_WIDTH = 160;
const RECOMMENDED_COUNT = 8;
const RECOMMENDED_CATEGORY_BOOKING_THRESHOLD = 3;

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

const GRID_PADDING = 16;
const GRID_GAP = 12;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { user, token } = useAuth();
  const { width } = useWindowDimensions();
  const searchCardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  const [categories, setCategories] = useState<ServiceCategoryResponse[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [craftsmen, setCraftsmen] = useState<CraftsmanProfileResponse[] | null>(null);
  const [myBookings, setMyBookings] = useState<BookingResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // A fresh GPS fix can take several seconds (worse indoors / cold start).
        // Show the last cached fix immediately so "Near Me" isn't stuck loading,
        // then quietly refine it once the current fix comes back.
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setCoords({ latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude });
        }

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      } catch (err) {
        // Permission denied, services off, timeout, etc. — Near You just stays hidden.
        console.warn('HomeScreen: failed to get location', err);
      }
    })();
  }, []);

  const loadCategories = useCallback(() => {
    setError(null);
    listServiceCategories()
      .then(setCategories)
      .catch((err) => setError(apiErrorMessage(err, t, t.home.failedToLoadCategories)));
  }, [t]);

  useFocusEffect(loadCategories);

  useFocusEffect(
    useCallback(() => {
      const request = typeof categoryFilter === 'number' ? listCraftsmenByCategory(categoryFilter) : listAllCraftsmen();
      request
        .then(setCraftsmen)
        .catch((err) => setError(apiErrorMessage(err, t, t.home.failedToLoadCraftsmen)));
    }, [categoryFilter, t]),
  );

  useFocusEffect(
    useCallback(() => {
      // Feeds "Recommended for you" - non-critical, so a failure here just
      // means that section falls back to popularity-only recommendations.
      if (!token) return;
      getMyBookings(token)
        .then(setMyBookings)
        .catch(() => {});
    }, [token]),
  );

  const chipItems = useMemo(
    (): { id: CategoryFilter; name: string }[] =>
      categories ? [{ id: 'all', name: t.home.categoryAll }, ...categories] : [],
    [categories, t],
  );

  const filtered = useMemo(() => {
    if (!craftsmen) return [];
    const q = query.trim().toLowerCase();
    if (!q) return craftsmen;
    return craftsmen.filter(
      (item) => item.fullName.toLowerCase().includes(q) || item.serviceCategoryName.toLowerCase().includes(q),
    );
  }, [craftsmen, query]);

  const newToMajstorHub = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, NEW_COUNT),
    [filtered],
  );

  const recommended = useMemo(() => {
    if (!user) return [];

    // Categories the user has booked from 3+ times as a client - a signal of
    // trade affinity (they keep hiring plumbers, say), not just one-off jobs.
    const categoryBookingCounts = new Map<number, number>();
    for (const booking of myBookings) {
      if (booking.clientId !== user.id) continue;
      categoryBookingCounts.set(
        booking.serviceCategoryId,
        (categoryBookingCounts.get(booking.serviceCategoryId) ?? 0) + 1,
      );
    }
    const affinityCategoryIds = new Set(
      [...categoryBookingCounts.entries()]
        .filter(([, count]) => count >= RECOMMENDED_CATEGORY_BOOKING_THRESHOLD)
        .map(([categoryId]) => categoryId),
    );

    const candidates = filtered.filter((item) => item.userId !== user.id);
    const byCategoryAffinity = candidates.filter((item) => affinityCategoryIds.has(item.serviceCategoryId));
    // Falls back to (and tops up with) the most-viewed profiles overall, so
    // the section still has content for users without an established affinity.
    const byPopularity = [...candidates].sort((a, b) => b.viewCount - a.viewCount);

    const merged: CraftsmanProfileResponse[] = [];
    const seen = new Set<string>();
    for (const item of [...byCategoryAffinity, ...byPopularity]) {
      if (seen.has(item.userId)) continue;
      seen.add(item.userId);
      merged.push(item);
      if (merged.length >= RECOMMENDED_COUNT) break;
    }
    return merged;
  }, [filtered, myBookings, user]);

  const distanceOf = useCallback(
    (item: CraftsmanProfileResponse): number | null => {
      if (!coords || item.latitude == null || item.longitude == null) return null;
      return distanceKm(coords, { latitude: item.latitude, longitude: item.longitude });
    },
    [coords],
  );

  const nearYou = useMemo(() => {
    if (!coords) return [];
    return filtered
      .map((item) => ({ item, km: distanceOf(item) }))
      .filter((entry): entry is { item: CraftsmanProfileResponse; km: number } => entry.km != null && entry.km <= NEAR_YOU_RADIUS_KM)
      .sort((a, b) => a.km - b.km)
      .map((entry) => entry.item);
  }, [filtered, coords, distanceOf]);

  const isFiltering = query.trim().length > 0 || categoryFilter !== 'all';

  const goToDetail = (craftsman: CraftsmanProfileResponse) =>
    navigation.navigate('CraftsmanDetail', { craftsmanUserId: craftsman.userId, craftsmanName: craftsman.fullName });

  if (error) return <ErrorView message={error} onRetry={loadCategories} />;
  if (!categories || !craftsmen) return <LoadingView fullScreen />;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.list}
    >
      <View style={[styles.headerArea, { paddingTop: insets.top + 24 }]}>
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <TabBackButton />
            <View>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {t.home.greeting}
              </Text>
              <Text variant="headlineSmall">{user?.fullName}</Text>
            </View>
          </View>
          <View style={styles.topRowActions}>
            <HamburgerButton />
          </View>
        </View>

        <Searchbar
          placeholder={t.home.searchPlaceholder}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          elevation={0}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {chipItems.map((item) => {
            const isSelected = item.id === categoryFilter;
            return (
              <Chip
                key={String(item.id)}
                selected={isSelected}
                showSelectedCheck={false}
                onPress={() => setCategoryFilter(item.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                  },
                ]}
                textStyle={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }}
              >
                {item.name}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {!isFiltering && recommended.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t.home.recommendedForYou}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearYouRow}>
            {recommended.map((item) => (
              <CraftsmanCard
                key={item.userId}
                item={item}
                width={RECOMMENDED_CARD_WIDTH}
                onPress={() => goToDetail(item)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {!isFiltering && newToMajstorHub.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t.home.newToMajstorHub}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearYouRow}>
            {newToMajstorHub.map((item) => (
              <CraftsmanCard key={item.userId} item={item} width={NEW_CARD_WIDTH} onPress={() => goToDetail(item)} />
            ))}
          </ScrollView>
        </View>
      )}

      {isFiltering && (
        <View style={styles.section}>
          {filtered.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>{t.home.noCraftsmenFound}</Text>
          ) : (
            chunkPairs(filtered).map((row, index) => (
              <View key={index} style={styles.searchResultRow}>
                {row.map((item) => (
                  <CraftsmanCard
                    key={item.userId}
                    item={item}
                    width={searchCardWidth}
                    onPress={() => goToDetail(item)}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      )}

      {!isFiltering && coords && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t.home.nearMe}
          </Text>
          {nearYou.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearYouRow}>
              {nearYou.map((item) => (
                <CraftsmanCard
                  key={item.userId}
                  item={item}
                  width={NEAR_YOU_CARD_WIDTH}
                  distanceLabel={formatDistance(distanceOf(item)!)}
                  onPress={() => goToDetail(item)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text variant="bodySmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t.home.noCraftsmenNearby(NEAR_YOU_RADIUS_KM)}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
  },
  headerArea: {
    gap: 16,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    marginHorizontal: 16,
    borderRadius: 16,
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    paddingHorizontal: 16,
  },
  nearYouRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  searchResultRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});