import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { ProfileScreen } from '@screens/ProfileScreen';
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '@screens/profile/ChangePasswordScreen';
import { BecomeSellerScreen } from '@screens/profile/BecomeSellerScreen';
import { AddressesScreen } from '@screens/profile/AddressesScreen';
import { AddressFormScreen } from '@screens/profile/AddressFormScreen';
import { SettingsScreen } from '@screens/profile/SettingsScreen';
import { ViewHistoryScreen } from '@screens/profile/ViewHistoryScreen';
import { OrdersScreen } from '@screens/OrdersScreen';
import { WishlistScreen } from '@screens/WishlistScreen';
import { WalletScreen } from '@screens/WalletScreen';
import { ConversationsScreen } from '@screens/ConversationsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ViewHistory" component={ViewHistoryScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
    </Stack.Navigator>
  );
}
