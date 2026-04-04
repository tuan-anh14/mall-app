export interface Conversation {
  id: string;
  sellerId: string;
  buyerId: string;
  sellerName: string;
  sellerAvatar: string | null;
  buyerName: string;
  buyerAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendMessageDto {
  text?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}
