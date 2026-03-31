import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
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

// Native HTTP layer (iOS NSURLSession / Android OkHttp) automatically sends
// cookies received via Set-Cookie. Do NOT set Cookie header manually — on iOS
// it merges the manual header with the native cookie using a comma, producing
// an invalid value like "session=id,session=id" that breaks session lookup.

/**
 * Unwrap the global TransformInterceptor envelope from the backend.
 * All success responses are shaped as { success: true, data: <actual>, meta: {...} }.
 * After this interceptor, response.data === the actual payload (e.g. { user: {...} }).
 */
api.interceptors.response.use(
  (response) => {
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      response.data.success === true &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
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
  console.log('[AUTH CHECK] cookie in store:', cookie ?? 'NONE');
  if (!cookie) {
    console.warn('[AUTH CHECK] no cookie → logging out immediately');
    authEvents.emitUnauthenticated();
    return;
  }
  try {
    await axios.get(`${Config.API_BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookie, Accept: 'application/json' },
      timeout: 10_000,
    });
    console.log('[AUTH CHECK] /auth/me OK → session valid, 401 from another endpoint');
  } catch (e) {
    const status = (e as AxiosError).response?.status;
    console.warn('[AUTH CHECK] /auth/me failed, status:', status);
    if (status === 401) {
      await secureStorage.clearAll();
      authEvents.emitUnauthenticated();
    }
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
