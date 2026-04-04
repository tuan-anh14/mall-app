import { api } from './api';

export interface ViewHistoryItem {
  id: string;
  productId: string;
  viewedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    discount: number | null;
    rating: number | null;
    stock: number;
    status: string;
  };
}

export interface ViewHistoryResponse {
  items: ViewHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const viewHistoryService = {
  trackView: async (productId: string): Promise<void> => {
    await api.post('/api/v1/view-history/track', { productId });
  },

  getHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ViewHistoryResponse> => {
    const res = await api.get<ViewHistoryResponse>('/api/v1/view-history', {
      params,
    });
    return res.data;
  },

  deleteItem: async (productId: string): Promise<void> => {
    await api.delete(`/api/v1/view-history/${productId}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete('/api/v1/view-history');
  },
};
