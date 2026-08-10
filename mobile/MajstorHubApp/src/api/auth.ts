import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api';

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', payload);
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload);
}
