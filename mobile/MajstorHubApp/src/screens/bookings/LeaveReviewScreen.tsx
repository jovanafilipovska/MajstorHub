import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Button, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { createReview } from '../../api/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { StarRatingInput } from '../../components/StarRatingInput';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { BookingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<BookingsStackParamList, 'LeaveReview'>;

const MAX_PHOTOS = 6;

export function LeaveReviewScreen({ route, navigation }: Props) {
  const { bookingId, craftsmanName } = route.params;
  const { token } = useAuth();
  const theme = useTheme();
  const t = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t.leaveReview.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photos.length),
      quality: 0.7,
    });
    if (result.canceled) return;
    setPhotos((prev) => [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const onSubmit = async () => {
    if (!token || rating < 1) return;
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ bookingId, rating, comment: comment.trim() || undefined }, photos, token);
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

      <Text variant="titleMedium">{t.leaveReview.photos}</Text>
      <View style={styles.photoGrid}>
        {photos.map((uri) => (
          <View key={uri} style={styles.photoTile}>
            <Image source={{ uri }} style={styles.photoImage} />
            <IconButton
              icon="close"
              size={14}
              mode="contained"
              style={styles.photoRemove}
              onPress={() => removePhoto(uri)}
            />
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <View style={[styles.photoTile, styles.addPhotoTile, { borderColor: theme.colors.outline }]}>
            <IconButton icon="plus" onPress={pickPhotos} />
          </View>
        )}
      </View>

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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    margin: 0,
  },
  addPhotoTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
