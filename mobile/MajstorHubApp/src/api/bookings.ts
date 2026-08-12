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

export function uploadBookingPhotos(id: string, photoUris: string[], token: string): Promise<BookingResponse> {
  const formData = new FormData();
  photoUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() ?? `photo-${index}.jpg`;
    const extensionMatch = /\.(\w+)$/.exec(filename);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('files', { uri, name: filename, type: mimeType } as unknown as Blob);
  });

  return apiClient.postForm<BookingResponse>(`/bookings/${id}/photos`, formData, token);
}
