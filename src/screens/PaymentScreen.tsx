import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { api } from '@services/api';
import { RootStackParamList } from '@app/navigation/types';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Standard dummy return URL for mobile to intercept
export const MOBILE_RETURN_URL = 'https://shophub.com/payment-result';

export function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  const queryClient = useQueryClient();
  const { paymentUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Check if we hit the return URL
    if (url.startsWith(MOBILE_RETURN_URL)) {
      // Parse parameters
      const urlObj = new URL(url);
      const queryParams = Object.fromEntries(urlObj.searchParams.entries());
      
      const finalizePayment = async () => {
        setLoading(true);
        try {
          // Tell backend to verify and complete the transaction
          await api.get('/api/v1/payment/vnpay/callback', { params: queryParams });
          
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
          queryClient.invalidateQueries({ queryKey: ['wallet', 'txns'] });
          
          const isDeposit = orderId.startsWith('DEPOSIT');
          if (isDeposit) {
            Alert.alert('Thành công', 'Nạp tiền vào ví thành công!', [
              { text: 'Đóng', onPress: () => navigation.goBack() }
            ]);
          } else {
            Alert.alert('Thành công', 'Thanh toán đơn hàng thành công!', [
              {
                text: 'Xem đơn hàng',
                onPress: () => navigation.replace('OrderDetail', { orderId }),
              },
            ]);
          }
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể xác nhận giao dịch. Vui lòng kiểm tra lại ví.', [
            { text: 'Quay lại', onPress: () => navigation.goBack() }
          ]);
        } finally {
          setLoading(false);
        }
      };

      finalizePayment();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Thanh toán VnPay</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={true}
          style={styles.webview}
        />
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
