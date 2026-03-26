import { api } from './api';
import type { AuthUser } from './authService';

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileDto): Promise<AuthUser> => {
    await api.put('/api/v1/users/me', data);
    // Re-fetch auth user to get updated combined name
    const res = await api.get<{ user: AuthUser }>('/api/v1/auth/me');
    return res.data.user;
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await api.put('/api/v1/users/me/password', data);
  },

  becomeSellerRequest: async (message?: string): Promise<string> => {
    const res = await api.post<{ message: string }>(
      '/api/v1/auth/become-seller',
      { message },
    );
    return res.data.message;
  },
};
