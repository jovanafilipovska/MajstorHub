import { apiClient } from './client';
import type { CraftsmanProfileResponse } from '../types/api';

export function listFavorites(token: string, signal?: AbortSignal): Promise<CraftsmanProfileResponse[]> {
  return apiClient.get<CraftsmanProfileResponse[]>('/favorites/mine', token, signal);
}

export function addFavorite(craftsmanUserId: string, token: string): Promise<void> {
  return apiClient.post<void>(`/favorites/${craftsmanUserId}`, undefined, token);
}

export function removeFavorite(craftsmanUserId: string, token: string): Promise<void> {
  return apiClient.delete<void>(`/favorites/${craftsmanUserId}`, token);
}