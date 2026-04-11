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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/theme';
import { RootStackParamList } from '@app/navigation/types';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Standard dummy return URL for mobile to intercept
export const MOBILE_RETURN_URL = 'https://shophub.com/payment-result';

export function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  const { paymentUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Check if we hit the return URL
    if (url.startsWith(MOBILE_RETURN_URL)) {
      // Parse parameters
      const params = new URL(url).searchParams;
      const responseCode = params.get('vnp_ResponseCode');

      if (responseCode === '00') {
        Alert.alert('Thành công', 'Thanh toán đơn hàng thành công!', [
          {
            text: 'Xem đơn hàng',
            onPress: () => navigation.replace('OrderDetail', { orderId }),
          },
        ]);
      } else {
        const errorMsg = responseCode === '24' ? 'Giao dịch đã bị hủy.' : 'Thanh toán thất bại. Vui lòng thử lại.';
        Alert.alert('Thông báo', errorMsg, [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
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
