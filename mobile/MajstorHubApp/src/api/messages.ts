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