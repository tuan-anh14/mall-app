import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { ProfileScreen } from '@screens/ProfileScreen';
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '@screens/profile/ChangePasswordScreen';
import { BecomeSellerScreen } from '@screens/profile/BecomeSellerScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
    </Stack.Navigator>
  );
}
