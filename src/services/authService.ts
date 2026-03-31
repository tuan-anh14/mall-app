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

async function persistCookie(
  headers: Record<string, unknown>,
  sessionId?: string,
): Promise<void> {
  // Prefer Set-Cookie header; fall back to sessionId from response body
  // because React Native / axios cannot read Set-Cookie headers.
  const cookieFromHeader = extractSessionCookie(
    headers['set-cookie'] as string | string[] | undefined,
  );
  if (cookieFromHeader) {
    await secureStorage.setSessionCookie(cookieFromHeader);
  } else if (sessionId) {
    await secureStorage.setSessionCookie(`session=${sessionId}`);
  }
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser; sessionId: string }>('/api/v1/auth/login', data);
    await persistCookie(res.headers as Record<string, unknown>, res.data.sessionId);
    return res.data.user;
  },

  register: async (data: RegisterDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser; sessionId: string }>('/api/v1/auth/register', data);
    await persistCookie(res.headers as Record<string, unknown>, res.data.sessionId);
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

  resetPassword: async (token: string, password: string): Promise<string> => {
    const res = await api.post<{ message: string }>(
      '/api/v1/auth/reset-password',
      { token, password },
    );
    return res.data.message;
  },
};
