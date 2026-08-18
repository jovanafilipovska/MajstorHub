import { apiClient } from './client';
import type { CreateReviewRequest, ReviewResponse } from '../types/api';

export function createReview(
  payload: CreateReviewRequest,
  photoUris: string[],
  token: string,
): Promise<ReviewResponse> {
  const formData = new FormData();
  formData.append('bookingId', payload.bookingId);
  formData.append('rating', String(payload.rating));
  if (payload.comment) formData.append('comment', payload.comment);

  photoUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() ?? `photo-${index}.jpg`;
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('files', { uri, name: filename, type: mimeType } as unknown as Blob);
  });

  return apiClient.postForm<ReviewResponse>('/reviews', formData, token);
}
