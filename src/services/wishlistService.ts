import { api } from './api';
import type { WishlistResponse } from '@typings/wishlist';

const BASE = '/api/v1/wishlist';

export const wishlistService = {
  getWishlist: async (): Promise<WishlistResponse> => {
    const res = await api.get<WishlistResponse>(BASE);
    return res.data;
  },

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
