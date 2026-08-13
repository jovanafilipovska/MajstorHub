import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { createReview } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { StarRatingInput } from '../../components/StarRatingInput';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { BookingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<BookingsStackParamList, 'LeaveReview'>;

export function LeaveReviewScreen({ route, navigation }: Props) {
  const { bookingId, craftsmanName } = route.params;
  const { token } = useAuth();
  const t = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token || rating < 1) return;
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ bookingId, rating, comment: comment.trim() || undefined }, token);
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err, t, t.leaveReview.failedToSubmit));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">{t.leaveReview.title(craftsmanName)}</Text>
      <StarRatingInput rating={rating} onChange={setRating} />
      <TextInput
        label={t.leaveReview.commentLabel}
        value={comment}
        onChangeText={setComment}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      {error && <HelperText type="error">{error}</HelperText>}
      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={rating < 1 || submitting}>
        {t.leaveReview.submit}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
