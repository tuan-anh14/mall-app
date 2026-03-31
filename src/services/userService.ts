import { api } from './api';
import { secureStorage } from './secureStorage';
import type {
  ProfileUser,
  ShippingAddress,
  CreateAddressDto,
  UpdateAddressDto,
  UserSettings,
  UpdateSettingsDto,
} from '@types/profile';

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
  // ─── Profile ────────────────────────────────────────────────────────────────

  getProfile: async (): Promise<ProfileUser> => {
    const res = await api.get<{ user: ProfileUser }>('/api/v1/users/me');
    return res.data.user;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<ProfileUser> => {
    const res = await api.put<{ user: ProfileUser }>('/api/v1/users/me', data);
    return res.data.user;
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await api.put('/api/v1/users/me/password', data);
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/v1/users/me');
    await secureStorage.clearAll();
  },

  becomeSellerRequest: async (message?: string): Promise<string> => {
    const res = await api.post<{ message: string }>(
      '/api/v1/auth/become-seller',
      { message },
    );
    return res.data.message;
  },

  // ─── Addresses ──────────────────────────────────────────────────────────────

  getAddresses: async (): Promise<ShippingAddress[]> => {
    const res = await api.get<{ addresses: ShippingAddress[] }>(
      '/api/v1/users/me/addresses',
    );
    return res.data.addresses;
  },

  createAddress: async (data: CreateAddressDto): Promise<ShippingAddress> => {
    const res = await api.post<{ address: ShippingAddress }>(
      '/api/v1/users/me/addresses',
      data,
    );
    return res.data.address;
  },

  updateAddress: async (
    id: string,
    data: UpdateAddressDto,
  ): Promise<ShippingAddress> => {
    const res = await api.put<{ address: ShippingAddress }>(
      `/api/v1/users/me/addresses/${id}`,
      data,
    );
    return res.data.address;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/users/me/addresses/${id}`);
  },

  // ─── Settings ────────────────────────────────────────────────────────────────

  getSettings: async (): Promise<UserSettings> => {
    const res = await api.get<{ settings: UserSettings }>(
      '/api/v1/users/me/settings',
    );
    return res.data.settings;
  },

  updateSettings: async (data: UpdateSettingsDto): Promise<UserSettings> => {
    const res = await api.put<{ settings: UserSettings }>(
      '/api/v1/users/me/settings',
      data,
    );
    return res.data.settings;
  },
};
