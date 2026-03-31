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

/**
 * On 401, verify the session is truly invalid via /auth/me before logging out.
 * A 401 from a non-auth endpoint (e.g. /users/me) doesn't necessarily mean
 * the session expired — it could be a routing or permissions issue.
 * We only clear storage and emit logout when /auth/me also fails with 401.
 */
let pendingAuthCheck: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (!pendingAuthCheck) {
        pendingAuthCheck = checkSessionAndLogoutIfNeeded().finally(() => {
          pendingAuthCheck = null;
        });
      }
      await pendingAuthCheck;
    }
    return Promise.reject(error);
  },
);

async function checkSessionAndLogoutIfNeeded(): Promise<void> {
  const cookie = await secureStorage.getSessionCookie();
  if (!cookie) {
    authEvents.emitUnauthenticated();
    return;
  }
  try {
    // Use a plain axios instance (no interceptors) to avoid recursive loops
    await axios.get(`${Config.API_BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookie, Accept: 'application/json' },
      timeout: 10_000,
    });
    // /auth/me succeeded → session is valid, the 401 was from another endpoint
  } catch (e) {
    if ((e as AxiosError).response?.status === 401) {
      // Session is truly expired
      await secureStorage.clearAll();
      authEvents.emitUnauthenticated();
    }
    // Other errors (network, 5xx) → don't logout, may be transient
  }
}

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
