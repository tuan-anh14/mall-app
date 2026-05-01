import { api } from './api';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  refundAmount?: number;
  sellerNote?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    subtotal: number;
    tax: number;
    couponDiscount?: number | null;
    total: number;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const returnService = {
  uploadImages: async (formData: FormData): Promise<string[]> => {
    const res = await api.post<{ urls: string[] }>('/api/v1/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.urls;
  },

  createRequest: async (data: {
    orderId: string;
    reason: string;
    images: string[];
  }): Promise<ReturnRequest> => {
    const res = await api.post<ReturnRequest>('/api/v1/return-requests', data);
    return res.data;
  },

  getRequestById: async (id: string): Promise<ReturnRequest> => {
    const res = await api.get<ReturnRequest>(`/api/v1/return-requests/${id}`);
    return res.data;
  },

  updateStatus: async (
    id: string,
    data: { status: string; sellerNote?: string; refundAmount?: number },
  ): Promise<ReturnRequest> => {
    const res = await api.patch<ReturnRequest>(`/api/v1/return-requests/${id}/status`, data);
    return res.data;
  },

  confirmReceipt: async (id: string): Promise<{ message: string; refundAmount: number }> => {
    const res = await api.post<{ message: string; refundAmount: number }>(
      `/api/v1/return-requests/${id}/confirm-receipt`,
    );
    return res.data;
  },
};
