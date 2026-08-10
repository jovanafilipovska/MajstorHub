import { apiClient } from './client';
import type { CreateServiceCategoryRequest, ServiceCategoryResponse } from '../types/api';

export function listServiceCategories(signal?: AbortSignal): Promise<ServiceCategoryResponse[]> {
  return apiClient.get<ServiceCategoryResponse[]>('/service-categories', undefined, signal);
}

export function getServiceCategory(id: number): Promise<ServiceCategoryResponse> {
  return apiClient.get<ServiceCategoryResponse>(`/service-categories/${id}`);
}

export function createServiceCategory(
  payload: CreateServiceCategoryRequest,
  token: string,
): Promise<ServiceCategoryResponse> {
  return apiClient.post<ServiceCategoryResponse>('/service-categories', payload, token);
}

export function deleteServiceCategory(id: number, token: string): Promise<void> {
  return apiClient.delete<void>(`/service-categories/${id}`, token);
}
