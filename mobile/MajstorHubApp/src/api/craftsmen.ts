import { apiClient } from './client';
import type {
  CraftsmanProfileResponse,
  CreateCraftsmanProfileRequest,
  ReviewResponse,
  UpdateCraftsmanProfileRequest,
} from '../types/api';

export function createMyProfile(
  payload: CreateCraftsmanProfileRequest,
  token: string,
): Promise<CraftsmanProfileResponse> {
  return apiClient.post<CraftsmanProfileResponse>('/craftsmen/me/profile', payload, token);
}

export function updateMyProfile(
  payload: UpdateCraftsmanProfileRequest,
  token: string,
): Promise<CraftsmanProfileResponse> {
  return apiClient.put<CraftsmanProfileResponse>('/craftsmen/me/profile', payload, token);
}

// A 404 ApiError here means the craftsman hasn't created a profile yet —
// callers should treat that as "create mode", not as an error to surface.
export function getCraftsmanProfile(userId: string): Promise<CraftsmanProfileResponse> {
  return apiClient.get<CraftsmanProfileResponse>(`/craftsmen/${userId}`);
}

export function listCraftsmenByCategory(categoryId: number): Promise<CraftsmanProfileResponse[]> {
  return apiClient.get<CraftsmanProfileResponse[]>(`/craftsmen?categoryId=${categoryId}`);
}

export function listAllCraftsmen(): Promise<CraftsmanProfileResponse[]> {
  return apiClient.get<CraftsmanProfileResponse[]>('/craftsmen');
}

export function getCraftsmanReviews(userId: string): Promise<ReviewResponse[]> {
  return apiClient.get<ReviewResponse[]>(`/craftsmen/${userId}/reviews`);
}
