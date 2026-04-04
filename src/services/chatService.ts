import { api } from './api';
import type {
  ConversationsResponse,
  MessagesResponse,
  Conversation,
  ChatMessage,
  SendMessageDto,
} from '@typings/chat';

const BASE = '/api/v1/conversations';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<ConversationsResponse>(BASE);
    return res.data.conversations;
  },

  createConversation: async (sellerId: string): Promise<Conversation> => {
    const res = await api.post<{ conversation: Conversation }>(BASE, {
      sellerId,
    });
    return res.data.conversation;
  },

  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MessagesResponse> => {
    const res = await api.get<MessagesResponse>(
      `${BASE}/${conversationId}/messages`,
      { params: { page: 1, limit: 50, ...params } },
    );
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageDto,
  ): Promise<ChatMessage> => {
    const res = await api.post<{ message: ChatMessage }>(
      `${BASE}/${conversationId}/messages`,
      data,
    );
    return res.data.message;
  },

  deleteMessage: async (
    conversationId: string,
    messageId: string,
  ): Promise<void> => {
    await api.delete(`${BASE}/${conversationId}/messages/${messageId}`);
  },
};
