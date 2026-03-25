import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  API_BASE_URL: (extra.apiBaseUrl as string) ?? 'https://api.example.com',
  SENTRY_DSN: (extra.sentryDsn as string) ?? '',
  APP_ENV: (extra.appEnv as string) ?? 'development',
} as const;
