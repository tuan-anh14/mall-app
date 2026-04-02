import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { type RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProductDetailScreen } from '@screens/ProductDetailScreen';
import { OrderDetailScreen } from '@screens/OrderDetailScreen';
import { useAuthStore } from '@store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.splash}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ animation: 'fade' }} />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ animation: 'fade' }} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
