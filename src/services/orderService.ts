import { api } from './api';
import type { Order, OrdersResponse } from '@typings/order';

const BASE = '/api/v1/orders';

export interface CreateOrderDto {
  addressId: string;
  paymentMethod: 'wallet' | 'vnpay' | 'card' | 'cod';
  notes?: string;
  couponCode?: string;
  returnUrl?: string;
}

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

  createOrder: async (data: CreateOrderDto): Promise<{ order: Order; paymentUrl?: string }> => {
    const res = await api.post<{ order: Order; paymentUrl?: string }>(BASE, data);
    return res.data;
  },

  cancelOrder: async (id: string): Promise<{ order: Order }> => {
    const res = await api.put<{ order: Order }>(`${BASE}/${id}/cancel`);
    return res.data;
  },
};
