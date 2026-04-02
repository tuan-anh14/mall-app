import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { orderService } from '@services/orderService';
import { formatVnd } from '@utils/index';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { RootStackParamList } from '@app/navigation/types';
import type { OrderTrackingStep } from '@typings/order';

// ─── Constants ────────────────────────────────────────

type RouteT = RouteProp<RootStackParamList, 'OrderDetail'>;
type Nav    = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:           { label: 'Chờ xác nhận',    color: '#D97706', bg: '#FFFBEB' },
  CONFIRMED:         { label: 'Đã xác nhận',      color: '#2563EB', bg: '#EFF6FF' },
  PROCESSING:        { label: 'Đang xử lý',       color: '#7C3AED', bg: '#F5F3FF' },
  SHIPPED:           { label: 'Đang vận chuyển',  color: Colors.primary, bg: Colors.primaryLight },
  OUT_FOR_DELIVERY:  { label: 'Đang giao',        color: '#0891B2', bg: '#ECFEFF' },
  DELIVERED:         { label: 'Đã giao',          color: Colors.success, bg: Colors.successLight },
  CANCELLED:         { label: 'Đã hủy',           color: Colors.danger, bg: Colors.dangerLight },
  REFUNDED:          { label: 'Đã hoàn tiền',     color: '#6B7280', bg: Colors.bg },
};

const PAY_LABELS: Record<string, string> = {
  wallet: 'Ví MALL',
  cod:    'Tiền mặt (COD)',
  vnpay:  'VNPay',
  momo:   'MoMo',
  card:   'Thẻ ngân hàng',
  paypal: 'PayPal',
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Timeline ─────────────────────────────────────────

function Timeline({ steps }: { steps: OrderTrackingStep[] }) {
  return (
    <View style={TL.wrap}>
      {steps.map((step, i) => (
        <View key={step.status} style={TL.row}>
          {/* Connector */}
          <View style={TL.connCol}>
            <View style={[
              TL.dot,
              step.completed && TL.dotDone,
              step.isCurrent && TL.dotCurrent,
            ]} />
            {i < steps.length - 1 && (
              <View style={[TL.line, step.completed && TL.lineDone]} />
            )}
          </View>
          {/* Content */}
          <View style={TL.content}>
            <Text style={[TL.label, !step.completed && TL.labelPending]}>
              {step.label}
            </Text>
            {step.description ? (
              <Text style={TL.desc}>{step.description}</Text>
            ) : null}
            {step.date ? (
              <Text style={TL.date}>{fmtDate(step.date)}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const TL = StyleSheet.create({
  wrap:    { paddingLeft: 4 },
  row:     { flexDirection: 'row', gap: 14, marginBottom: 0 },
  connCol: { alignItems: 'center', width: 18 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginTop: 2,
  },
  dotDone:    { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight, borderWidth: 3 },
  line:    { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4 },
  lineDone: { backgroundColor: Colors.primary },
  content: { flex: 1, paddingBottom: 20 },
  label:   { fontSize: 13, fontWeight: '700', color: Colors.text },
  labelPending: { color: Colors.textMuted, fontWeight: '500' },
  desc:    { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  date:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});

// ─── Screen ───────────────────────────────────────────

export function OrderDetailScreen() {
  const route = useRoute<RouteT>();
  const nav   = useNavigation<Nav>();
  const qc    = useQueryClient();
  const { orderId } = route.params;

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.order(orderId),
    queryFn:  () => orderService.getOrderById(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(orderId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      Alert.alert('Đã hủy', 'Đơn hàng đã được hủy thành công');
    },
    onError: () => Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này'),
  });

  function confirmCancel() {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc muốn hủy đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        { text: 'Hủy đơn', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <ScreenHeader title="Chi tiết đơn hàng" onBack={() => nav.goBack()} />
        <View style={S.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (isError || !data?.order) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <ScreenHeader title="Chi tiết đơn hàng" onBack={() => nav.goBack()} />
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={{ color: Colors.textSub, marginTop: 8 }}>Không tải được đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { order } = data;
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const canCancel = order.status === 'PENDING';

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScreenHeader title={`Đơn ${order.id}`} onBack={() => nav.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>

        {/* ── Status card ── */}
        <View style={S.card}>
          <View style={S.statusRow}>
            <View style={[S.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[S.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {order.estimatedDelivery && (
              <Text style={S.estDelivery}>Dự kiến: {fmtDate(order.estimatedDelivery)}</Text>
            )}
          </View>

          {/* Tracking timeline */}
          {order.tracking.steps.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Timeline steps={order.tracking.steps} />
            </View>
          )}
        </View>

        {/* ── Items ── */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Sản phẩm ({order.items.length})</Text>
          {order.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={S.itemRow}
              onPress={() => nav.navigate('ProductDetail', { productId: item.productId })}
              activeOpacity={0.8}
            >
              <View style={S.itemImg}>
                {item.productImage ? (
                  <Image source={{ uri: item.productImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : (
                  <Ionicons name="image-outline" size={20} color="#CBD5E1" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.itemName} numberOfLines={2}>{item.productName}</Text>
                {(item.selectedColor || item.selectedSize) && (
                  <Text style={S.itemVariant}>
                    {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                  </Text>
                )}
                <Text style={S.itemQty}>×{item.quantity}</Text>
              </View>
              <Text style={S.itemPrice}>{formatVnd(item.price * item.quantity)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Price breakdown ── */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={S.priceRow}>
            <Text style={S.priceLabel}>Tạm tính</Text>
            <Text style={S.priceValue}>{formatVnd(order.subtotal)}</Text>
          </View>
          <View style={S.priceRow}>
            <Text style={S.priceLabel}>Phí vận chuyển</Text>
            <Text style={S.priceValue}>{formatVnd(order.shippingCost)}</Text>
          </View>
          {order.tax > 0 && (
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>Thuế</Text>
              <Text style={S.priceValue}>{formatVnd(order.tax)}</Text>
            </View>
          )}
          {order.couponDiscount != null && order.couponDiscount > 0 && (
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}</Text>
              <Text style={[S.priceValue, { color: Colors.success }]}>−{formatVnd(order.couponDiscount)}</Text>
            </View>
          )}
          <View style={[S.priceRow, S.totalRow]}>
            <Text style={S.totalLabel}>Tổng cộng</Text>
            <Text style={S.totalValue}>{formatVnd(order.total)}</Text>
          </View>
          <View style={S.priceRow}>
            <Text style={S.priceLabel}>Phương thức</Text>
            <Text style={S.priceValue}>{PAY_LABELS[order.paymentMethod] ?? order.paymentMethod}</Text>
          </View>
        </View>

        {/* ── Shipping address ── */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Địa chỉ giao hàng</Text>
          <Text style={S.addrName}>{order.shippingAddress.fullName}</Text>
          {order.shippingAddress.phone ? (
            <Text style={S.addrLine}>{order.shippingAddress.phone}</Text>
          ) : null}
          <Text style={S.addrLine}>
            {[
              order.shippingAddress.street,
              order.shippingAddress.city,
              order.shippingAddress.state,
              order.shippingAddress.zip,
              order.shippingAddress.country,
            ].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* ── Notes ── */}
        {order.notes ? (
          <View style={S.card}>
            <Text style={S.sectionTitle}>Ghi chú</Text>
            <Text style={S.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        {/* ── Cancel ── */}
        {canCancel && (
          <TouchableOpacity
            style={[S.cancelBtn, cancelMutation.isPending && { opacity: 0.5 }]}
            onPress={confirmCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending
              ? <ActivityIndicator color={Colors.danger} />
              : <Text style={S.cancelBtnText}>Hủy đơn hàng</Text>}
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  // Status
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:  { fontSize: 13, fontWeight: '700' },
  estDelivery: { fontSize: 12, color: Colors.textSub },

  // Items
  itemRow:   { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  itemImg:   { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F1F5F9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  itemName:  { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  itemVariant: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  itemQty:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, alignSelf: 'center' },

  // Pricing
  priceRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  priceLabel:  { fontSize: 13, color: Colors.textSub },
  priceValue:  { fontSize: 13, color: Colors.text, fontWeight: '600' },
  totalRow:    { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 10 },
  totalLabel:  { fontSize: 14, fontWeight: '800', color: Colors.text },
  totalValue:  { fontSize: 16, fontWeight: '900', color: Colors.primary },

  // Address
  addrName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  addrLine: { fontSize: 13, color: Colors.textSub, lineHeight: 19 },

  // Notes
  notesText: { fontSize: 13, color: Colors.textSub, lineHeight: 19 },

  // Cancel
  cancelBtn: {
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    marginTop: 4,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
