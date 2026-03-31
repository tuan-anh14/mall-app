import { api } from './api';
import type { NotificationsResponse, NotificationType } from '@typings/notification';

const BASE = '/api/v1/notifications';

export const notificationService = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    isRead?: boolean;
  }): Promise<NotificationsResponse> => {
    const res = await api.get<NotificationsResponse>(BASE, { params });
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`${BASE}/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put(`${BASE}/read-all`);
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
