import { type ExpoConfig, type ConfigContext } from 'expo/config';

// ─── Environment ─────────────────────────────────────────────────────────────

const APP_ENV = process.env.APP_ENV ?? 'development';
const IS_DEV = APP_ENV === 'development';

const API_BASE_URL = process.env.API_BASE_URL ?? 'https://mall-be-dgpi.onrender.com';
const SENTRY_DSN   = process.env.SENTRY_DSN   ?? '';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? 'YOUR_EAS_PROJECT_ID';

// ─── Per-environment values ───────────────────────────────────────────────────

const appName: Record<string, string> = {
  development: 'MallApp (Dev)',
  preview:     'MallApp (Preview)',
  production:  'MallApp',
};

// Separate bundle IDs per env prevent dev/prod builds conflicting on same device
const bundleId: Record<string, string> = {
  development: 'com.yourcompany.mallapp.dev',
  preview:     'com.yourcompany.mallapp.preview',
  production:  'com.yourcompany.mallapp',
};

const androidPackage: Record<string, string> = {
  development: 'com.yourcompany.mallapp.dev',
  preview:     'com.yourcompany.mallapp.preview',
  production:  'com.yourcompany.mallapp',
};

// ─── Config ──────────────────────────────────────────────────────────────────

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name:        appName[APP_ENV]  ?? 'MallApp',
  slug:        'mall-app',
  scheme:      'mallapp',
  version:     '1.0.0',
  orientation: 'portrait',
  icon:        './src/assets/icon.png',
  userInterfaceStyle: 'light',

  splash: {
    image:           './src/assets/splash.png',
    resizeMode:      'contain',
    backgroundColor: '#ffffff',
  },

  // ── OTA Updates (EAS Update) ──────────────────────────────────────────────
  updates: {
    enabled:    !IS_DEV,
    url:        `https://u.expo.dev/${EAS_PROJECT_ID}`,
    // Fallback to embedded bundle if update check fails
    fallbackToCacheTimeout: 0,
  },

  // Native version bump only when native code changes
  runtimeVersion: {
    policy: 'appVersion',
  },

  // ── Platform ─────────────────────────────────────────────────────────────
  ios: {
    supportsTablet:   false,
    bundleIdentifier: bundleId[APP_ENV] ?? bundleId.production,
    // buildNumber managed by EAS (autoIncrement: true in eas.json)
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: androidPackage[APP_ENV] ?? androidPackage.production,
    // versionCode managed by EAS (autoIncrement: true in eas.json)
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      '@sentry/react-native/expo',
      {
        url:          'https://sentry.io/',
        project:      'mall-app',
        organization: 'your-org',
      },
    ],
  ],

  // ── Extra (runtime config via expo-constants) ─────────────────────────────
  extra: {
    appEnv:       APP_ENV,
    apiBaseUrl:   API_BASE_URL,
    sentryDsn:    SENTRY_DSN,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
