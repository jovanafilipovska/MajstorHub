import { apiClient } from './client';
import type { CreateServiceCategoryRequest, ServiceCategoryResponse, UpdateServiceCategoryRequest } from '../types/api';

export function listServiceCategories(signal?: AbortSignal): Promise<ServiceCategoryResponse[]> {
  return apiClient.get<ServiceCategoryResponse[]>('/service-categories', undefined, signal);
}

export function listPendingServiceCategories(token: string): Promise<ServiceCategoryResponse[]> {
  return apiClient.get<ServiceCategoryResponse[]>('/service-categories/pending', token);
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

export function suggestServiceCategory(
  payload: CreateServiceCategoryRequest,
  token: string,
): Promise<ServiceCategoryResponse> {
  return apiClient.post<ServiceCategoryResponse>('/service-categories/suggest', payload, token);
}

export function approveServiceCategory(id: number, token: string): Promise<ServiceCategoryResponse> {
  return apiClient.post<ServiceCategoryResponse>(`/service-categories/${id}/approve`, undefined, token);
}

export function updateServiceCategory(
  id: number,
  payload: UpdateServiceCategoryRequest,
  token: string,
): Promise<ServiceCategoryResponse> {
  return apiClient.put<ServiceCategoryResponse>(`/service-categories/${id}`, payload, token);
}

export function deleteServiceCategory(id: number, token: string): Promise<void> {
  return apiClient.delete<void>(`/service-categories/${id}`, token);
}
