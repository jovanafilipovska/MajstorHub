import { apiClient } from './client';
import type { BookingResponse, BookingStatus, CreateBookingRequest } from '../types/api';

export function createBooking(payload: CreateBookingRequest, token: string): Promise<BookingResponse> {
  return apiClient.post<BookingResponse>('/bookings', payload, token);
}

export function getBooking(id: string, token: string, signal?: AbortSignal): Promise<BookingResponse> {
  return apiClient.get<BookingResponse>(`/bookings/${id}`, token, signal);
}

export function getMyBookings(token: string, signal?: AbortSignal): Promise<BookingResponse[]> {
  return apiClient.get<BookingResponse[]>('/bookings/mine', token, signal);
}

export function updateBookingStatus(
  id: string,
  status: BookingStatus,
  token: string,
): Promise<BookingResponse> {
  return apiClient.patch<BookingResponse>(`/bookings/${id}/status`, { status }, token);
}
