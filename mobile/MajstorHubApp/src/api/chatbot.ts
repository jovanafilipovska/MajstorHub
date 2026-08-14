import { apiClient } from './client';
import type { ChatbotConversationResponse, ChatbotMessageResponse, ChatbotMode, SendChatbotMessageRequest } from '../types/api';

export function sendChatbotMessage(payload: SendChatbotMessageRequest, token: string): Promise<ChatbotMessageResponse> {
  return apiClient.post<ChatbotMessageResponse>('/chatbot/message', payload, token);
}

export function getChatbotConversation(
  mode: ChatbotMode,
  token: string,
  signal?: AbortSignal,
): Promise<ChatbotConversationResponse> {
  return apiClient.get<ChatbotConversationResponse>(`/chatbot/conversation?mode=${mode}`, token, signal);
}

export function resetChatbotConversation(mode: ChatbotMode, token: string): Promise<void> {
  return apiClient.delete<void>(`/chatbot/conversation?mode=${mode}`, token);
}