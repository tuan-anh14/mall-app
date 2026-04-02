import { api } from './api';
import type { Order, OrdersResponse } from '@typings/order';

const BASE = '/api/v1/orders';

export const orderService = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<OrdersResponse> => {
    const res = await api.get<OrdersResponse>(BASE, { params });
    return res.data;
  },

  getOrderById: async (id: string): Promise<{ order: Order }> => {
    const res = await api.get<{ order: Order }>(`${BASE}/${id}`);
    return res.data;
  },

  cancelOrder: async (id: string): Promise<{ order: Order }> => {
    const res = await api.put<{ order: Order }>(`${BASE}/${id}/cancel`);
    return res.data;
  },
};
