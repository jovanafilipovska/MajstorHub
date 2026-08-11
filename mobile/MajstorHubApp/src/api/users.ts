import { apiClient } from './client';
import type { ChangePasswordRequest, UpdateUserRequest, UserResponse } from '../types/api';

export function getMe(token: string): Promise<UserResponse> {
  return apiClient.get<UserResponse>('/users/me', token);
}

export function updateMe(payload: UpdateUserRequest, token: string): Promise<UserResponse> {
  return apiClient.put<UserResponse>('/users/me', payload, token);
}

export function changeMyPassword(payload: ChangePasswordRequest, token: string): Promise<void> {
  return apiClient.put<void>('/users/me/password', payload, token);
}

export function deleteMe(token: string): Promise<void> {
  return apiClient.delete<void>('/users/me', token);
}

export function uploadMyPhoto(uri: string, token: string): Promise<UserResponse> {
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

  return apiClient.postForm<UserResponse>('/users/me/photo', formData, token);
}

export function removeMyPhoto(token: string): Promise<UserResponse> {
  return apiClient.delete<UserResponse>('/users/me/photo', token);
}

export function getAllUsers(token: string, signal?: AbortSignal): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>('/users', token, signal);
}

export function deleteUser(id: string, token: string): Promise<void> {
  return apiClient.delete<void>(`/users/${id}`, token);
}
