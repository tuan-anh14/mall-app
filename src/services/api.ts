import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Config } from '@constants/config';
import { secureStorage } from '@services/secureStorage';
import { authEvents } from '@services/authEvents';

export const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach session cookie to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const cookie = await secureStorage.getSessionCookie();
    if (cookie) {
      config.headers.Cookie = cookie;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Handle global 401 — clear cookie and notify store
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await secureStorage.clearAll();
      authEvents.emitUnauthenticated();
    }
    return Promise.reject(error);
  },
);

/** Extract and persist the session cookie from a Set-Cookie header */
export function extractSessionCookie(
  setCookieHeader: string | string[] | undefined,
): string | null {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const sessionEntry = cookies.find((c) => c.includes('session='));
  if (!sessionEntry) return null;
  return sessionEntry.split(';')[0].trim(); // "session=<value>"
}
