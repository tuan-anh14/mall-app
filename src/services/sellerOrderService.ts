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
    const res = await api.get<any>(BASE, { params });
    const rawData = res.data?.data || [];
    const orders = rawData.map((o: any) => ({
      ...o,
      buyerName: o.customer?.name || 'Khách hàng',
      buyerEmail: o.customer?.email || '',
    }));
    
    return {
      orders,
      total: res.data?.stats?.total || 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 1,
    };
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
