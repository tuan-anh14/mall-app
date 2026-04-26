import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@constants/theme';
import Providers from './providers';
import { RootNavigator } from './navigation/RootNavigator';
import { initSentry } from '@utils/sentry';

initSentry();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Providers>
        <NavigationContainer theme={AppTheme}>
          <RootNavigator />
        </NavigationContainer>
      </Providers>
    </SafeAreaProvider>
  );
}
