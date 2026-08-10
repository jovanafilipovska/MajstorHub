import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { getCraftsmanProfile, getCraftsmanReviews } from '../../api/craftsmen';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { BrowseStackParamList } from '../../navigation/types';
import type { CraftsmanProfileResponse, ReviewResponse } from '../../types/api';

type Props = NativeStackScreenProps<BrowseStackParamList, 'CraftsmanDetail'>;

export function CraftsmanDetailScreen({ route, navigation }: Props) {
  const { craftsmanUserId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<CraftsmanProfileResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([getCraftsmanProfile(craftsmanUserId), getCraftsmanReviews(craftsmanUserId)])
      .then(([profileResult, reviewsResult]) => {
        setProfile(profileResult);
        setReviews(reviewsResult);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load craftsman.'));
  }, [craftsmanUserId]);

  useFocusEffect(load);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!profile) return <LoadingView />;

  const canBook = user?.id !== profile.userId && profile.isAvailable;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{profile.fullName}</Text>
      <Text variant="bodyMedium" style={styles.category}>
        {profile.serviceCategoryName} · ${profile.hourlyRate.toFixed(2)}/hr
      </Text>
      {profile.averageRating ? (
        <Text variant="bodyMedium">
          {profile.averageRating.toFixed(1)}★ ({profile.reviewCount} review{profile.reviewCount === 1 ? '' : 's'})
        </Text>
      ) : (
        <Text variant="bodyMedium">No ratings yet</Text>
      )}
      {profile.yearsOfExperience != null && (
        <Text variant="bodyMedium">{profile.yearsOfExperience} years of experience</Text>
      )}
      {profile.addressText && <Text variant="bodyMedium">{profile.addressText}</Text>}
      {profile.bio && (
        <Text variant="bodyMedium" style={styles.bio}>
          {profile.bio}
        </Text>
      )}

      {canBook && (
        <Button
          mode="contained"
          style={styles.bookButton}
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
      )}

      <Divider style={styles.divider} />
      <Text variant="titleMedium">Reviews</Text>
      {reviews.length === 0 && <Text variant="bodyMedium">No reviews yet.</Text>}
      {reviews.map((review) => (
        <Card key={review.id} style={styles.reviewCard}>
          <Card.Content>
            <Text variant="titleSmall">
              {review.reviewerName} · {review.rating}★
            </Text>
            {review.comment && <Text variant="bodyMedium">{review.comment}</Text>}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 6,
  },
  category: {
    marginBottom: 4,
  },
  bio: {
    marginTop: 8,
  },
  bookButton: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  reviewCard: {
    marginTop: 8,
  },
});
