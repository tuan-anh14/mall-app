import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { userService } from '@services/userService';
import { orderService } from '@services/orderService';
import { cartService } from '@services/cartService';
import { useCartStore } from '@store/cartStore';
import { formatVnd } from '@utils/index';
import type { ShippingAddress } from '@typings/profile';
import type { RootStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type PaymentMethod = 'wallet' | 'vnpay' | 'card' | 'cod';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; desc: string }[] = [
  {
    key: 'wallet',
    label: 'Ví MALL',
    icon: 'wallet-outline',
    desc: 'Thanh toán bằng số dư ví',
  },
  {
    key: 'vnpay',
    label: 'VNPAY',
    icon: 'qr-code-outline',
    desc: 'Internet Banking / ATM / QR Code',
  },
  {
    key: 'card',
    label: 'Thẻ tín dụng/ghi nợ',
    icon: 'card-outline',
    desc: 'Thanh toán bằng thẻ',
  },
  {
    key: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    icon: 'cash-outline',
    desc: 'Trả tiền mặt khi nhận hàng',
  },
];

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: ShippingAddress;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[S.addressCard, selected && S.addressCardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={S.addressRadio}>
        <View style={[S.radioOuter, selected && S.radioOuterSelected]}>
          {selected && <View style={S.radioInner} />}
        </View>
      </View>
      <View style={S.addressInfo}>
        <View style={S.addressTopRow}>
          <Text style={S.addressName}>
            {address.firstName} {address.lastName}
          </Text>
          {address.isDefault && (
            <View style={S.defaultBadge}>
              <Text style={S.defaultBadgeText}>Mặc định</Text>
            </View>
          )}
          {address.label ? (
            <View style={S.labelBadge}>
              <Text style={S.labelBadgeText}>{address.label}</Text>
            </View>
          ) : null}
        </View>
        {address.phone && (
          <Text style={S.addressPhone}>{address.phone}</Text>
        )}
        <Text style={S.addressStreet} numberOfLines={2}>
          {address.street}, {address.city}, {address.state} {address.zip}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');

  const { data: addresses = [], isLoading: addressLoading } = useQuery({
    queryKey: QUERY_KEYS.addresses,
    queryFn: userService.getAddresses,
  });

  // Pre-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (def) setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: QUERY_KEYS.cart,
    queryFn: cartService.getCart,
  });

  const cart = cartData?.cart;

  const orderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
      setItemCount(0);
      const orderId = res.order.id;
      if (res.paymentUrl) {
        Alert.alert('Chuyển hướng', 'Đang chuyển hướng đến cổng thanh toán...', [
          {
            text: 'Mở trình duyệt',
            onPress: () => {
              Linking.openURL(res.paymentUrl!);
              navigation.navigate('OrderDetail', { orderId });
            }
          }
        ]);
        return;
      }
      navigation.navigate('OrderDetail', { orderId });
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = apiErr?.response?.data?.error?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi đặt hàng', msg);
    },
  });

  function handlePlaceOrder() {
    if (!selectedAddressId) {
      Alert.alert('Chưa chọn địa chỉ', 'Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    if (!cart || cart.items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Không có sản phẩm nào để đặt hàng.');
      return;
    }
    Alert.alert(
      'Xác nhận đặt hàng',
      `Tổng cộng: ${formatVnd(total)}\nPhương thức: ${PAYMENT_OPTIONS.find((p) => p.key === paymentMethod)?.label}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt hàng',
          onPress: () =>
            orderMutation.mutate({
              addressId: selectedAddressId,
              paymentMethod,
              returnUrl: 'shophub://orders',
            }),
        },
      ],
    );
  }

  const FREE_SHIPPING = 50_000;
  const SHIPPING_FEE = 30_000;
  const TAX_RATE = 0.1;
  const subtotal = cart?.subtotal ?? 0;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const isLoading = addressLoading || cartLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Thanh toán</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shipping Address */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={S.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={S.addAddressBtn}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Profile',
                  params: { screen: 'AddressForm', params: {} },
                } as never)
              }
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={S.addAddressText}>Thêm địa chỉ giao hàng</Text>
            </TouchableOpacity>
          ) : (
            <View style={S.addressList}>
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={selectedAddressId === addr.id}
                  onSelect={() => setSelectedAddressId(addr.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Order Items Preview */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={Colors.primary} />
            <Text style={S.sectionTitle}>
              Sản phẩm ({cart?.itemCount ?? 0})
            </Text>
          </View>
          {(cart?.items ?? []).map((item) => (
            <View key={item.id} style={S.orderItem}>
              <Text style={S.orderItemName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <View style={S.orderItemRight}>
                {(item.selectedColor || item.selectedSize) && (
                  <Text style={S.orderItemVariant}>
                    {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <Text style={S.orderItemQty}>x{item.quantity}</Text>
                <Text style={S.orderItemPrice}>
                  {formatVnd(item.product.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="card-outline" size={18} color={Colors.primary} />
            <Text style={S.sectionTitle}>Phương thức thanh toán</Text>
          </View>

          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[S.paymentOption, paymentMethod === opt.key && S.paymentOptionSelected]}
              onPress={() => setPaymentMethod(opt.key)}
              activeOpacity={0.8}
            >
              <View style={[S.paymentIconWrap, paymentMethod === opt.key && S.paymentIconWrapSelected]}>
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={paymentMethod === opt.key ? Colors.primary : Colors.textSub}
                />
              </View>
              <View style={S.paymentInfo}>
                <Text style={[S.paymentLabel, paymentMethod === opt.key && S.paymentLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={S.paymentDesc}>{opt.desc}</Text>
              </View>
              <View style={[S.radioOuter, paymentMethod === opt.key && S.radioOuterSelected]}>
                {paymentMethod === opt.key && <View style={S.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            <Text style={S.sectionTitle}>Tóm tắt đơn hàng</Text>
          </View>

          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Tạm tính</Text>
            <Text style={S.summaryValue}>{formatVnd(subtotal)}</Text>
          </View>
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Phí vận chuyển</Text>
            {shipping === 0 ? (
              <View style={S.freeBadge}>
                <Text style={S.freeBadgeText}>MIỄN PHÍ</Text>
              </View>
            ) : (
              <Text style={S.summaryValue}>{formatVnd(shipping)}</Text>
            )}
          </View>
          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Thuế (10%)</Text>
            <Text style={S.summaryValue}>{formatVnd(tax)}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.summaryRow}>
            <Text style={S.totalLabel}>Tổng cộng</Text>
            <Text style={S.totalValue}>{formatVnd(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={S.footer}>
        <View style={S.footerTotal}>
          <Text style={S.footerTotalLabel}>Tổng</Text>
          <Text style={S.footerTotalValue}>{formatVnd(total)}</Text>
        </View>
        <TouchableOpacity
          style={[
            S.orderBtn,
            (orderMutation.isPending || !selectedAddressId) && S.orderBtnDim,
          ]}
          onPress={handlePlaceOrder}
          disabled={orderMutation.isPending || !selectedAddressId}
          activeOpacity={0.85}
        >
          {orderMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={S.orderBtnText}>Đặt hàng</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
    gap: 12,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  // Address
  addressList: { gap: 10 },
  addressCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  addressRadio: {
    paddingTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  addressInfo: { flex: 1, gap: 3 },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  labelBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  labelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressPhone: {
    fontSize: 13,
    color: Colors.textSub,
  },
  addressStreet: {
    fontSize: 13,
    color: Colors.textSub,
    lineHeight: 18,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Order Items
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  orderItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemVariant: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  orderItemQty: {
    fontSize: 12,
    color: Colors.textSub,
    fontWeight: '600',
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 70,
    textAlign: 'right',
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconWrapSelected: {
    backgroundColor: '#fff',
  },
  paymentInfo: { flex: 1 },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentLabelSelected: {
    color: Colors.primary,
  },
  paymentDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSub,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  freeBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Footer
  footer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.card,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    ...Shadows.button,
  },
  orderBtnDim: {
    opacity: 0.55,
  },
  orderBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
