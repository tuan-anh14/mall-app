import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  APP_ENV:      (extra.appEnv    as string) ?? 'development',
  API_BASE_URL: (extra.apiBaseUrl as string) ?? 'https://mall-be-dgpi.onrender.com',
  SENTRY_DSN:   (extra.sentryDsn  as string) ?? '',
  IS_DEV:       ((extra.appEnv as string) ?? 'development') === 'development',
  IS_PROD:      ((extra.appEnv as string) ?? 'development') === 'production',
} as const;
