import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Avatar, Chip, Icon, Menu, Searchbar, Text, useTheme } from 'react-native-paper';
import { listServiceCategories } from '../../api/serviceCategories';
import { listAllCraftsmen, listCraftsmenByCategory } from '../../api/craftsmen';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Language } from '../../contexts/LanguageContext';
import { distanceKm } from '../../utils/geo';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

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

const LANGUAGE_LABELS: Record<Language, string> = { mk: 'MK', sq: 'SQ', en: 'EN' };

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function CraftsmanImagePlaceholder({ tint, icon }: { tint: string; icon: string }) {
  return (
    <View style={[styles.cardImage, { backgroundColor: tint }]}>
      <Icon source={icon} size={40} color="#00000033" />
    </View>
  );
}

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

function CraftsmanCard({
  item,
  width,
  distanceLabel,
  onPress,
}: {
  item: CraftsmanProfileResponse;
  width: number;
  distanceLabel?: string | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.gridCard, { width, backgroundColor: theme.colors.surface }]}>
      <CraftsmanImagePlaceholder tint={theme.colors.surfaceVariant} icon="account-hard-hat" />
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

const GRID_PADDING = 16;
const GRID_GAP = 12;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { width } = useWindowDimensions();
  const searchCardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  const [categories, setCategories] = useState<ServiceCategoryResponse[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [craftsmen, setCraftsmen] = useState<CraftsmanProfileResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
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
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load categories.'));
  }, []);

  useFocusEffect(loadCategories);

  useFocusEffect(
    useCallback(() => {
      const request = typeof categoryFilter === 'number' ? listCraftsmenByCategory(categoryFilter) : listAllCraftsmen();
      request
        .then(setCraftsmen)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load craftsmen.'));
    }, [categoryFilter]),
  );

  const chipItems = useMemo(
    (): { id: CategoryFilter; name: string }[] => (categories ? [{ id: 'all', name: 'All' }, ...categories] : []),
    [categories],
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
          <View>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Hello
            </Text>
            <Text variant="headlineSmall">{user?.fullName}</Text>
          </View>
          <View style={styles.topRowActions}>
            <Menu
              visible={langMenuOpen}
              onDismiss={() => setLangMenuOpen(false)}
              anchor={
                <Chip
                  mode="outlined"
                  onPress={() => setLangMenuOpen(true)}
                  style={[styles.langChip, { borderColor: theme.colors.outline }]}
                >
                  {LANGUAGE_LABELS[language]}
                </Chip>
              }
            >
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
                <Menu.Item
                  key={code}
                  onPress={() => {
                    setLanguage(code);
                    setLangMenuOpen(false);
                  }}
                  title={LANGUAGE_LABELS[code]}
                />
              ))}
            </Menu>
            <Pressable onPress={() => navigation.getParent()?.navigate('ProfileTab' as never)}>
              <Avatar.Text
                size={40}
                label={initialsOf(user?.fullName ?? '?')}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ color: theme.colors.onPrimary }}
              />
            </Pressable>
          </View>
        </View>

        <Searchbar
          placeholder="Search services"
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

      {!isFiltering && newToMajstorHub.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            New to MajstorHub
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
            <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>No craftsmen found.</Text>
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
            Near Me
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
              No craftsmen within {NEAR_YOU_RADIUS_KM}km of you.
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
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langChip: {
    borderRadius: 20,
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
  gridCard: {
    borderRadius: 16,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardName: {
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});