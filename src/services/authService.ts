import { api, extractSessionCookie } from './api';
import { secureStorage } from './secureStorage';

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  userType: 'buyer' | 'seller' | 'admin';
  sellerRequestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

async function persistCookie(headers: Record<string, unknown>) {
  const cookie = extractSessionCookie(
    headers['set-cookie'] as string | string[] | undefined,
  );
  if (cookie) {
    await secureStorage.setSessionCookie(cookie);
  }
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser }>('/api/v1/auth/login', data);
    await persistCookie(res.headers as Record<string, unknown>);
    return res.data.user;
  },

  register: async (data: RegisterDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser }>('/api/v1/auth/register', data);
    await persistCookie(res.headers as Record<string, unknown>);
    return res.data.user;
  },

  me: async (): Promise<AuthUser> => {
    const res = await api.get<{ user: AuthUser }>('/api/v1/auth/me');
    return res.data.user;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      await secureStorage.clearAll();
    }
  },

  forgotPassword: async (email: string): Promise<string> => {
    const res = await api.post<{ message: string }>(
      '/api/v1/auth/forgot-password',
      { email },
    );
    return res.data.message;
  },
};
