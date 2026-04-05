import { api } from './api';
import type {
  MessagesResponse,
  Conversation,
  ChatMessage,
  SendMessageDto,
} from '@typings/chat';

const BASE = '/api/v1/conversations';

function mapConversation(c: any): Conversation {
  return {
    ...c,
    sellerId: c.otherUser?.id,
    sellerName: c.otherUser?.name || 'Chưa rõ',
    sellerAvatar: c.otherUser?.avatar || null,
    buyerId: c.otherUser?.id,
    buyerName: c.otherUser?.name || 'Chưa rõ',
    buyerAvatar: c.otherUser?.avatar || null,
  };
}

function mapMessage(m: any): ChatMessage {
  return {
    ...m,
    senderId: m.sender?.id,
    senderName: m.sender?.name || 'Chưa rõ',
    senderAvatar: m.sender?.avatar || null,
  };
}

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<any>(BASE);
    return res.data.conversations
      .filter((c: any) => c.lastMessage && c.lastMessage.trim() !== '')
      .map(mapConversation);
  },

  createConversation: async (sellerId: string): Promise<Conversation> => {
    const res = await api.post<any>(BASE, { sellerId });
    return mapConversation(res.data.conversation);
  },

  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MessagesResponse> => {
    const res = await api.get<any>(
      `${BASE}/${conversationId}/messages`,
      { params: { page: 1, limit: 50, ...params } },
    );
    return {
      ...res.data,
      messages: res.data.messages.map(mapMessage),
    };
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageDto,
  ): Promise<ChatMessage> => {
    const res = await api.post<any>(
      `${BASE}/${conversationId}/messages`,
      data,
    );
    return mapMessage(res.data.message);
  },

  deleteMessage: async (
    conversationId: string,
    messageId: string,
  ): Promise<void> => {
    await api.delete(`${BASE}/${conversationId}/messages/${messageId}`);
  },
};
