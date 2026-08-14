import { apiClient } from './client';
import type { ConversationSummaryResponse, MessageResponse, SendMessageRequest } from '../types/api';

export function sendMessage(payload: SendMessageRequest, token: string): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/messages', payload, token);
}

export function getMessageHistory(
  bookingId: string,
  token: string,
  signal?: AbortSignal,
): Promise<MessageResponse[]> {
  return apiClient.get<MessageResponse[]>(`/messages/booking/${bookingId}`, token, signal);
}

export function getConversations(token: string, signal?: AbortSignal): Promise<ConversationSummaryResponse[]> {
  return apiClient.get<ConversationSummaryResponse[]>('/messages/conversations', token, signal);
}

export function markConversationRead(bookingId: string, token: string): Promise<void> {
  return apiClient.post<void>(`/messages/booking/${bookingId}/read`, undefined, token);
}

export function deleteConversation(bookingId: string, token: string): Promise<void> {
  return apiClient.delete<void>(`/messages/booking/${bookingId}`, token);
}

export function sendPhotoMessage(bookingId: string, photoUri: string, token: string): Promise<MessageResponse> {
  const filename = photoUri.split('/').pop() ?? 'photo.jpg';
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: photoUri, name: filename, type: mimeType } as unknown as Blob);

  return apiClient.postForm<MessageResponse>(`/messages/booking/${bookingId}/photo`, formData, token);
}