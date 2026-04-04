import { api } from './api';
import type { SellerReview, SellerReviewsResponse } from '@typings/seller';

const BASE = '/api/v1/seller/reviews';

export const sellerReviewService = {
  getReviews: async (params?: {
    filter?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SellerReviewsResponse> => {
    const res = await api.get<SellerReviewsResponse>(BASE, { params });
    return res.data;
  },

  replyToReview: async (
    reviewId: string,
    text: string,
  ): Promise<SellerReview> => {
    const res = await api.post<{ reply: SellerReview }>(
      `/api/v1/reviews/${reviewId}/replies`,
      { comment: text },
    );
    return res.data.reply;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`${BASE}/${reviewId}`);
  },
};
