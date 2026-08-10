import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Chip, Icon, Menu, Searchbar, Text, useTheme } from 'react-native-paper';
import { listServiceCategories } from '../../api/serviceCategories';
import { listCraftsmenByCategory } from '../../api/craftsmen';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Language } from '../../contexts/LanguageContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse, ServiceCategoryResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Home'>;

const LANGUAGE_LABELS: Record<Language, string> = { mk: 'MK', sq: 'SQ', en: 'EN' };
const SUGGESTED_COUNT = 4;

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function CraftsmanAvatarPlaceholder({ size, tint, icon }: { size: number; tint: string; icon: string }) {
  return (
    <View style={[styles.placeholder, { width: size, height: size, backgroundColor: tint }]}>
      <Icon source={icon} size={size * 0.42} color="#00000033" />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [categories, setCategories] = useState<ServiceCategoryResponse[] | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [craftsmen, setCraftsmen] = useState<CraftsmanProfileResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const loadCategories = useCallback(() => {
    setError(null);
    listServiceCategories()
      .then((result) => {
        setCategories(result);
        setSelectedCategoryId((current) => current ?? result[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load categories.'));
  }, []);

  useFocusEffect(loadCategories);

  useFocusEffect(
    useCallback(() => {
      if (selectedCategoryId == null) return;
      listCraftsmenByCategory(selectedCategoryId)
        .then(setCraftsmen)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load craftsmen.'));
    }, [selectedCategoryId]),
  );

  const filtered = useMemo(() => {
    if (!craftsmen) return [];
    const q = query.trim().toLowerCase();
    if (!q) return craftsmen;
    return craftsmen.filter(
      (item) => item.fullName.toLowerCase().includes(q) || item.serviceCategoryName.toLowerCase().includes(q),
    );
  }, [craftsmen, query]);

  const suggested = useMemo(
    () => [...filtered].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)).slice(0, SUGGESTED_COUNT),
    [filtered],
  );
  const suggestedIds = useMemo(() => new Set(suggested.map((item) => item.userId)), [suggested]);
  const nearby = useMemo(() => filtered.filter((item) => !suggestedIds.has(item.userId)), [filtered, suggestedIds]);

  const goToDetail = (craftsman: CraftsmanProfileResponse) =>
    navigation.navigate('CraftsmanDetail', { craftsmanUserId: craftsman.userId, craftsmanName: craftsman.fullName });

  if (error) return <ErrorView message={error} onRetry={loadCategories} />;
  if (!categories || !craftsmen) return <LoadingView fullScreen />;

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.list}
      data={nearby}
      keyExtractor={(item) => item.userId}
      ListHeaderComponent={
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

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCategoryId;
              return (
                <Chip
                  selected={isSelected}
                  showSelectedCheck={false}
                  onPress={() => setSelectedCategoryId(item.id)}
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
            }}
          />

          {suggested.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                ✨ AI picks for you
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={suggested}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.suggestedRow}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => goToDetail(item)}
                    style={[styles.suggestedCard, { backgroundColor: theme.colors.surface }]}
                  >
                    <View>
                      <CraftsmanAvatarPlaceholder
                        size={140}
                        tint={theme.colors.surfaceVariant}
                        icon="account-hard-hat"
                      />
                      <Chip
                        compact
                        style={[styles.aiBadge, { backgroundColor: theme.colors.primaryContainer }]}
                        textStyle={[styles.aiBadgeText, { color: theme.colors.onPrimaryContainer }]}
                      >
                        AI SUGGESTED
                      </Chip>
                    </View>
                    <Text variant="titleSmall" numberOfLines={1} style={styles.cardName}>
                      {item.fullName}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                      {item.serviceCategoryName}
                      {item.addressText ? ` · ${item.addressText}` : ''}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          <Text variant="titleMedium" style={[styles.sectionTitle, styles.nearYouTitle]}>
            Near you
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>No craftsmen found.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => goToDetail(item)}
          style={[styles.nearCard, { backgroundColor: theme.colors.surface }]}
        >
          <CraftsmanAvatarPlaceholder size={56} tint={theme.colors.surfaceVariant} icon="account-hard-hat" />
          <View style={styles.nearInfo}>
            <Text variant="titleSmall">{item.fullName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }} numberOfLines={1}>
              {item.serviceCategoryName}
              {item.addressText ? ` · ${item.addressText}` : ''}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.averageRating ? `★ ${item.averageRating.toFixed(1)} (${item.reviewCount})` : 'No ratings yet'} ·{' '}
              {item.hourlyRate.toFixed(0)} ден/ч
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
  },
  headerArea: {
    gap: 16,
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
  nearYouTitle: {
    marginTop: -4,
  },
  suggestedRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestedCard: {
    width: 160,
    borderRadius: 16,
    padding: 10,
    gap: 6,
  },
  cardName: {
    marginTop: 2,
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  aiBadgeText: {
    fontSize: 10,
  },
  placeholder: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  nearInfo: {
    flex: 1,
    gap: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});