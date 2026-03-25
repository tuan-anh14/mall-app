import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Providers } from './providers';
import { RootNavigator } from './navigation/RootNavigator';
import { initSentry } from '@utils/sentry';

initSentry();

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </Providers>
    </SafeAreaProvider>
  );
}
