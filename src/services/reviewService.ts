import { api } from './api';
import type { ReviewsResponse, ReviewEligibility } from '@typings/review';

const BASE = '/api/v1/reviews';

export const reviewService = {
  getProductReviews: async (
    productId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ReviewsResponse> => {
    const res = await api.get<ReviewsResponse>(`${BASE}/products/${productId}`, { params });
    return res.data;
  },

  checkUserReview: async (productId: string): Promise<ReviewEligibility> => {
    const res = await api.get<ReviewEligibility>(`${BASE}/products/${productId}/check`);
    return res.data;
  },

  createReview: async (dto: {
    productId: string;
    rating: number;
    comment?: string;
    emoji?: string;
    images?: string[];
  }): Promise<void> => {
    await api.post(BASE, dto);
  },

  markHelpful: async (reviewId: string): Promise<void> => {
    await api.post(`${BASE}/${reviewId}/helpful`);
  },

  createReply: async (reviewId: string, comment: string): Promise<void> => {
    await api.post(`${BASE}/${reviewId}/replies`, { comment });
  },
};
