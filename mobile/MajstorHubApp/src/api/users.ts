import { apiClient } from './client';
import type { UpdateUserRequest, UserResponse } from '../types/api';

export function getMe(token: string): Promise<UserResponse> {
  return apiClient.get<UserResponse>('/users/me', token);
}

export function updateMe(payload: UpdateUserRequest, token: string): Promise<UserResponse> {
  return apiClient.put<UserResponse>('/users/me', payload, token);
}

export function getAllUsers(token: string, signal?: AbortSignal): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>('/users', token, signal);
}

export function deleteUser(id: string, token: string): Promise<void> {
  return apiClient.delete<void>(`/users/${id}`, token);
}
