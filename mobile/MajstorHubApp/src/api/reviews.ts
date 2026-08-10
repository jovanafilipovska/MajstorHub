import { apiClient } from './client';
import type { CreateReviewRequest, ReviewResponse } from '../types/api';

export function createReview(payload: CreateReviewRequest, token: string): Promise<ReviewResponse> {
  return apiClient.post<ReviewResponse>('/reviews', payload, token);
}
