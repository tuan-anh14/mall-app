import { api } from './api';

const BASE = '/api/v1/wishlist';

export const wishlistService = {
  checkItem: async (productId: string): Promise<{ inWishlist: boolean }> => {
    const res = await api.get<{ inWishlist: boolean }>(`${BASE}/check/${productId}`);
    return res.data;
  },

  addItem: async (productId: string): Promise<void> => {
    await api.post(BASE, { productId });
  },

  removeItem: async (productId: string): Promise<void> => {
    await api.delete(`${BASE}/${productId}`);
  },
};
