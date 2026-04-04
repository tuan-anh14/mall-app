import { api } from './api';
import type { SellerOrder, SellerOrdersResponse } from '@typings/seller';

const BASE = '/api/v1/seller/orders';

export const sellerOrderService = {
  getOrders: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<SellerOrdersResponse> => {
    const res = await api.get<SellerOrdersResponse>(BASE, { params });
    return res.data;
  },

  updateOrderStatus: async (
    orderId: string,
    status: string,
  ): Promise<SellerOrder> => {
    const res = await api.put<{ order: SellerOrder }>(
      `${BASE}/${orderId}/status`,
      { status },
    );
    return res.data.order;
  },
};
