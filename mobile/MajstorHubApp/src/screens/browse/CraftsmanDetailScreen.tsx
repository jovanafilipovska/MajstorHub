import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { getCraftsmanProfile, getCraftsmanReviews } from '../../api/craftsmen';
import { addFavorite, listFavorites, removeFavorite } from '../../api/favorites';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { starRatingColor } from '../../theme';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse, ReviewResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CraftsmanDetail'>;

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export function CraftsmanDetailScreen({ route, navigation }: Props) {
  const { craftsmanUserId } = route.params;
  const { user, token } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<CraftsmanProfileResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      getCraftsmanProfile(craftsmanUserId),
      getCraftsmanReviews(craftsmanUserId),
      token ? listFavorites(token) : Promise.resolve([]),
    ])
      .then(([profileResult, reviewsResult, favoritesResult]) => {
        setProfile(profileResult);
        setReviews(reviewsResult);
        setIsFavorited(favoritesResult.some((c) => c.userId === craftsmanUserId));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load craftsman.'));
  }, [craftsmanUserId, token]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!profile) return <LoadingView />;

  const isOwnProfile = user?.id === profile.userId;
  const canBook = !isOwnProfile && profile.isAvailable;
  const goldColor = theme.dark ? starRatingColor.dark : starRatingColor.light;
  const locationLabel = [profile.serviceCategoryName, profile.addressText].filter(Boolean).join(' · ');

  const toggleFavorite = async () => {
    if (!token) return;
    setFavoriting(true);
    try {
      if (isFavorited) {
        await removeFavorite(profile.userId, token);
      } else {
        await addFavorite(profile.userId, token);
      }
      setIsFavorited((prev) => !prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update favorite.');
    } finally {
      setFavoriting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="account-hard-hat" size={64} color={theme.dark ? '#00000022' : '#00000014'} />
          {!isOwnProfile && (
            <IconButton
              icon={isFavorited ? 'heart' : 'heart-outline'}
              iconColor={goldColor}
              size={24}
              disabled={favoriting}
              onPress={toggleFavorite}
              style={[styles.favoriteButton, { backgroundColor: theme.colors.surface }]}
            />
          )}
        </View>

        <View style={styles.headerBlock}>
          <Avatar.Text
            size={88}
            label={initialsOf(profile.fullName)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
            labelStyle={{ color: theme.colors.onPrimary }}
          />

          <Text variant="headlineSmall" style={styles.name}>
            {profile.fullName}
          </Text>
          {locationLabel.length > 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {locationLabel}
            </Text>
          )}

          <View style={styles.ratingRow}>
            <Icon source="star" size={16} color={goldColor} />
            <Text variant="bodyMedium" style={{ color: goldColor }}>
              {profile.averageRating ? profile.averageRating.toFixed(1) : 'New'}
              {profile.reviewCount > 0
                ? ` · ${profile.reviewCount} review${profile.reviewCount === 1 ? '' : 's'}`
                : ''}
            </Text>
          </View>
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {profile.bio}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Services &amp; rates
          </Text>
          <View style={[styles.rateRow, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium">Hourly rate</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              ${profile.hourlyRate.toFixed(2)}/hr
            </Text>
          </View>
          {profile.yearsOfExperience != null && (
            <View style={[styles.rateRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="bodyMedium">Experience</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {profile.yearsOfExperience} year{profile.yearsOfExperience === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Reviews
          </Text>
          {reviews.length === 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No reviews yet.
            </Text>
          )}
          {reviews.map((review) => (
            <Card
              key={review.id}
              style={[styles.reviewCard, { backgroundColor: theme.colors.surfaceVariant }]}
              mode="contained"
            >
              <Card.Content>
                <View style={styles.reviewHeader}>
                  <Text variant="titleSmall">{review.reviewerName}</Text>
                  <View style={styles.ratingRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Icon
                        key={i}
                        source={i < review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color={goldColor}
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {review.comment}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        {canBook && <View style={styles.footerSpacer} />}
      </ScrollView>

      {canBook && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.outlineVariant,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Button
            mode="contained"
            style={styles.bookButton}
            contentStyle={styles.bookButtonContent}
            onPress={() =>
              navigation.navigate('CreateBooking', {
                craftsmanUserId: profile.userId,
                craftsmanName: profile.fullName,
                serviceCategoryId: profile.serviceCategoryId,
              })
            }
          >
            Book This Craftsman
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  banner: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    margin: 0,
  },
  headerBlock: {
    paddingHorizontal: 20,
    marginTop: -44,
    gap: 4,
  },
  avatar: {
    borderWidth: 3,
    marginBottom: 8,
  },
  name: {
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewCard: {
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerSpacer: {
    height: 88,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bookButton: {
    borderRadius: 28,
  },
  bookButtonContent: {
    paddingVertical: 6,
  },
});