import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION_COOKIE: 'session_cookie',
} as const;

export const secureStorage = {
  getSessionCookie: (): Promise<string | null> =>
    SecureStore.getItemAsync(KEYS.SESSION_COOKIE),

  setSessionCookie: (cookie: string): Promise<void> =>
    SecureStore.setItemAsync(KEYS.SESSION_COOKIE, cookie),

  clearAll: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(KEYS.SESSION_COOKIE);
  },
};
