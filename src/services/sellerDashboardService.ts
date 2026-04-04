import { api } from './api';
import type { SellerStats, SalesDataPoint } from '@typings/seller';

export const sellerDashboardService = {
  getStats: async (): Promise<SellerStats> => {
    const res = await api.get<SellerStats>(
      '/api/v1/seller/dashboard/stats',
    );
    return res.data;
  },

  getSalesData: async (): Promise<SalesDataPoint[]> => {
    const res = await api.get<SalesDataPoint[]>(
      '/api/v1/seller/dashboard/sales-data',
    );
    return res.data;
  },
};
