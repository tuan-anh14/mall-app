import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@store/authStore';
import { Colors } from '@constants/theme';
import type { SellerStackParamList } from './types';
import { SellerDashboardScreen } from '@screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '@screens/seller/SellerProductsScreen';
import { SellerProductFormScreen } from '@screens/seller/SellerProductFormScreen';
import { SellerOrdersScreen } from '@screens/seller/SellerOrdersScreen';
import { SellerReviewsScreen } from '@screens/seller/SellerReviewsScreen';
import { SellerCouponsScreen } from '@screens/seller/SellerCouponsScreen';
import { SellerStoreScreen } from '@screens/seller/SellerStoreScreen';

const Stack = createNativeStackNavigator<SellerStackParamList>();

function AccessDeniedScreen() {
  const nav = useNavigation();
  return (
    <SafeAreaView style={G.safe}>
      <View style={G.box}>
        <View style={G.iconWrap}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
        </View>
        <Text style={G.title}>Không có quyền truy cập</Text>
        <Text style={G.sub}>
          Khu vực này chỉ dành cho tài khoản người bán.{'\n'}
          Vui lòng đăng nhập bằng tài khoản seller.
        </Text>
        <TouchableOpacity style={G.btn} onPress={() => nav.goBack()}>
          <Ionicons name="home-outline" size={16} color="#FFF" />
          <Text style={G.btnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const G = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  box:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap:{ width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title:   { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub:     { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

export function SellerNavigator() {
  const userType = useAuthStore((s) => s.user?.userType);

  if (userType !== 'seller') {
    return <AccessDeniedScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen
        name="SellerProductForm"
        component={SellerProductFormScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerReviews" component={SellerReviewsScreen} />
      <Stack.Screen name="SellerCoupons" component={SellerCouponsScreen} />
      <Stack.Screen name="SellerStore" component={SellerStoreScreen} />
    </Stack.Navigator>
  );
}
