const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// ─── Path alias resolver (mirrors tsconfig.json paths) ───────────────────────
// Expo SDK 50+ reads tsconfig paths automatically, but we declare them
// explicitly here too so EAS cloud builds resolve them deterministically.
config.resolver.alias = {
  '@':            path.resolve(__dirname, 'src'),
  '@app':         path.resolve(__dirname, 'src/app'),
  '@screens':     path.resolve(__dirname, 'src/screens'),
  '@components':  path.resolve(__dirname, 'src/components'),
  '@services':    path.resolve(__dirname, 'src/services'),
  '@store':       path.resolve(__dirname, 'src/store'),
  '@hooks':       path.resolve(__dirname, 'src/hooks'),
  '@utils':       path.resolve(__dirname, 'src/utils'),
  '@constants':   path.resolve(__dirname, 'src/constants'),
  '@assets':      path.resolve(__dirname, 'src/assets'),
  '@typings':     path.resolve(__dirname, 'src/types'),
};

module.exports = withNativeWind(config, { input: './global.css' });
