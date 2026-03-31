import { api } from './api';
import type { CartResponse, ApplyCouponResponse } from '@typings/cart';

const BASE = '/api/v1/cart';

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const res = await api.get<CartResponse>(BASE);
    return res.data;
  },

  addItem: async (
    productId: string,
    quantity: number,
    color?: string,
    size?: string,
  ): Promise<CartResponse> => {
    const res = await api.post<CartResponse>(`${BASE}/items`, {
      productId,
      quantity,
      color,
      size,
    });
    return res.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<CartResponse> => {
    const res = await api.put<CartResponse>(`${BASE}/items/${itemId}`, { quantity });
    return res.data;
  },

  removeItem: async (itemId: string): Promise<CartResponse> => {
    const res = await api.delete<CartResponse>(`${BASE}/items/${itemId}`);
    return res.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete(BASE);
  },

  applyCoupon: async (code: string): Promise<ApplyCouponResponse> => {
    const res = await api.post<ApplyCouponResponse>(`${BASE}/coupon`, { code });
    return res.data;
  },
};
