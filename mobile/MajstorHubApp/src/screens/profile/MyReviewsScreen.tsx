import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import { getCraftsmanProfile, getCraftsmanReviews } from '../../api/craftsmen';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import { starRatingColor } from '../../theme';
import type { CraftsmanProfileResponse, ReviewResponse } from '../../types/api';

export function MyReviewsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const [profile, setProfile] = useState<CraftsmanProfileResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setError(null);
    Promise.all([getCraftsmanProfile(user.id), getCraftsmanReviews(user.id)])
      .then(([profileResult, reviewsResult]) => {
        setProfile(profileResult);
        setReviews(reviewsResult);
      })
      .catch((err) => setError(apiErrorMessage(err, t, t.myReviews.failedToLoad)));
  }, [user, t]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!profile) return <LoadingView />;

  const goldColor = theme.dark ? starRatingColor.dark : starRatingColor.light;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text variant="headlineMedium" style={styles.summaryRating}>
          {profile.averageRating ? profile.averageRating.toFixed(1) : t.craftsmanDetail.newBadge}
        </Text>
        <View style={styles.summaryStars}>
          {Array.from({ length: 5 }, (_, i) => (
            <Icon
              key={i}
              source={i < Math.round(profile.averageRating ?? 0) ? 'star' : 'star-outline'}
              size={18}
              color={goldColor}
            />
          ))}
        </View>
        {profile.reviewCount > 0 && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t.craftsmanDetail.reviewsLabel(profile.reviewCount)}
          </Text>
        )}
      </View>

      {reviews.length === 0 && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t.myReviews.noReviewsYet}
        </Text>
      )}

      {reviews.map((review) => (
        <Card key={review.id} style={[styles.reviewCard, { backgroundColor: theme.colors.surfaceVariant }]} mode="contained">
          <Card.Content>
            <View style={styles.reviewHeader}>
              <Text variant="titleSmall">{review.reviewerName}</Text>
              <View style={styles.reviewStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon key={i} source={i < review.rating ? 'star' : 'star-outline'} size={14} color={goldColor} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  summaryRating: {
    fontWeight: '700',
  },
  summaryStars: {
    flexDirection: 'row',
    gap: 2,
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
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});