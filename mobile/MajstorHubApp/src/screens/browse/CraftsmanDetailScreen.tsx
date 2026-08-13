import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { getCraftsmanProfile, getCraftsmanReviews, recordProfileView } from '../../api/craftsmen';
import { addFavorite, listFavorites, removeFavorite } from '../../api/favorites';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
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
  const t = useTranslation();
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
      .catch((err) => setError(apiErrorMessage(err, t, t.craftsmanDetail.failedToLoad)));
    // Popularity telemetry only - never block or fail the screen over it.
    recordProfileView(craftsmanUserId).catch(() => {});
  }, [craftsmanUserId, token, t]);

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
      setError(apiErrorMessage(err, t, t.craftsmanDetail.failedToUpdateFavorite));
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
          {profile.profileImageUrl ? (
            <Avatar.Image
              size={88}
              source={{ uri: resolveMediaUrl(profile.profileImageUrl) }}
              style={[styles.avatar, { borderColor: theme.colors.background }]}
            />
          ) : (
            <Avatar.Text
              size={88}
              label={initialsOf(profile.fullName)}
              style={[styles.avatar, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
          )}

          <View style={styles.nameRow}>
            <Text variant="headlineSmall" style={styles.name}>
              {profile.businessName || profile.fullName}
            </Text>
            {profile.isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon source="check-decagram" size={14} color={theme.colors.onPrimaryContainer} />
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  {t.craftsmanDetail.verified}
                </Text>
              </View>
            )}
          </View>
          {locationLabel.length > 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {locationLabel}
            </Text>
          )}

          <View style={styles.ratingRow}>
            <Icon source="star" size={16} color={goldColor} />
            <Text variant="bodyMedium" style={{ color: goldColor }}>
              {profile.averageRating ? profile.averageRating.toFixed(1) : t.craftsmanDetail.newBadge}
              {profile.reviewCount > 0 ? ` · ${t.craftsmanDetail.reviewsLabel(profile.reviewCount)}` : ''}
            </Text>
          </View>
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t.craftsmanDetail.about}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {profile.bio}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t.craftsmanDetail.servicesAndRates}
          </Text>
          <View style={[styles.rateRow, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium">{t.craftsmanDetail.hourlyRate}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              ${profile.hourlyRate.toFixed(2)}/hr
            </Text>
          </View>
          {profile.yearsOfExperience != null && (
            <View style={[styles.rateRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="bodyMedium">{t.craftsmanDetail.experience}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t.craftsmanDetail.yearsLabel(profile.yearsOfExperience)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t.craftsmanDetail.reviews}
          </Text>
          {reviews.length === 0 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t.craftsmanDetail.noReviewsYet}
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
            {t.craftsmanDetail.bookButton}
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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