import { api } from './api';

export const viewHistoryService = {
  trackView: async (productId: string): Promise<void> => {
    await api.post('/api/v1/view-history/track', { productId });
  },
};
