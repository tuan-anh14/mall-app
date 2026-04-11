import { api, extractSessionCookie } from './api';
import { secureStorage } from './secureStorage';

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  userType: 'buyer' | 'seller' | 'admin';
  avatar?: string | null;
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

export interface VerifyEmailDto {
  email: string;
  code: string;
}

async function persistCookie(
  headers: Record<string, unknown>,
  sessionId?: string,
): Promise<void> {
  console.log('[AUTH] persistCookie called, sessionId:', sessionId);
  console.log('[AUTH] set-cookie header:', headers['set-cookie']);
  const cookieFromHeader = extractSessionCookie(
    headers['set-cookie'] as string | string[] | undefined,
  );
  console.log('[AUTH] cookieFromHeader:', cookieFromHeader);
  if (cookieFromHeader) {
    await secureStorage.setSessionCookie(cookieFromHeader);
    console.log('[AUTH] cookie stored from header:', cookieFromHeader);
  } else if (sessionId) {
    const value = `session=${sessionId}`;
    await secureStorage.setSessionCookie(value);
    console.log('[AUTH] cookie stored from sessionId:', value);
  } else {
    console.warn('[AUTH] persistCookie: nothing to store! sessionId and header both missing');
  }
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser; sessionId: string }>('/api/v1/auth/login', data);
    await persistCookie(res.headers as Record<string, unknown>, res.data.sessionId);
    return res.data.user;
  },

  // Register returns { user } with no session — user must verify email before login
  register: async (data: RegisterDto): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser }>('/api/v1/auth/register', data);
    return res.data.user;
  },

  verifyEmail: async (data: VerifyEmailDto): Promise<string> => {
    const res = await api.post<{ message: string }>('/api/v1/auth/verify-email', data);
    return res.data.message;
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
