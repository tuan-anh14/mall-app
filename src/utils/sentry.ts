import * as Sentry from '@sentry/react-native';
import { Config } from '@constants/config';

export function initSentry() {
  if (!Config.SENTRY_DSN) return;

  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: Config.APP_ENV,
    tracesSampleRate: Config.APP_ENV === 'production' ? 0.2 : 1.0,
    debug: Config.APP_ENV === 'development',
  });
}
