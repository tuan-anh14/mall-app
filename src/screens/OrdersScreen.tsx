import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { orderService } from '@services/orderService';
import { formatVnd } from '@utils/index';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { RootStackParamList } from '@app/navigation/types';
import type { Order, OrderStatus } from '@typings/order';

// ─── Constants ────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList>;

type TabKey = 'all' | OrderStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',               label: 'Tất cả' },
  { key: 'PENDING',           label: 'Chờ xác nhận' },
  { key: 'CONFIRMED',         label: 'Đã xác nhận' },
  { key: 'SHIPPED',           label: 'Đang giao' },
  { key: 'DELIVERED',         label: 'Đã giao' },
  { key: 'CANCELLED',         label: 'Đã hủy' },
];

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Empty state ──────────────────────────────────────

function EmptyOrders() {
  return (
    <View style={S.empty}>
      <View style={S.emptyIcon}>
        <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={S.emptyTitle}>Chưa có đơn hàng</Text>
      <Text style={S.emptySub}>Các đơn hàng của bạn sẽ hiển thị tại đây</Text>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────

function SkeletonOrder() {
  return (
    <View style={S.orderCard}>
      <View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 6, width: '40%', marginBottom: 8 }} />
      <View style={{ height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, width: '25%', marginBottom: 12 }} />
      <View style={{ height: 60, backgroundColor: '#E5E7EB', borderRadius: 10, marginBottom: 12 }} />
      <View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 6, width: '30%' }} />
    </View>
  );
}

// ─── Order card ───────────────────────────────────────

interface OrderCardProps {
  order: Order;
  onDetail: () => void;
  onCancel: () => void;
  cancelling: boolean;
}

function OrderCard({ order, onDetail, onCancel, cancelling }: OrderCardProps) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const canCancel = order.status === 'PENDING';

  return (
    <TouchableOpacity style={S.orderCard} onPress={onDetail} activeOpacity={0.92}>
      {/* Header */}
      <View style={S.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={S.orderId} numberOfLines={1}>{order.id}</Text>
          <Text style={S.orderDate}>{fmtDate(order.date)}</Text>
        </View>
        <View style={[S.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[S.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Items preview */}
      <View style={S.itemsRow}>
        {order.items.slice(0, 3).map((item) => (
          <View key={item.id} style={S.itemThumb}>
            {item.productImage ? (
              <Image source={{ uri: item.productImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <Ionicons name="image-outline" size={18} color="#CBD5E1" />
            )}
            {item.quantity > 1 && (
              <View style={S.qtyBadge}>
                <Text style={S.qtyBadgeText}>×{item.quantity}</Text>
              </View>
            )}
          </View>
        ))}
        {order.items.length > 3 && (
          <View style={[S.itemThumb, S.moreThumb]}>
            <Text style={S.moreText}>+{order.items.length - 3}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={S.totalBlock}>
          <Text style={S.totalLabel}>{order.items.length} sản phẩm</Text>
          <Text style={S.totalAmount}>{formatVnd(order.total)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={S.orderActions}>
        <TouchableOpacity style={S.detailBtn} onPress={onDetail}>
          <Text style={S.detailBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
        {canCancel && (
          <TouchableOpacity
            style={[S.cancelBtn, cancelling && { opacity: 0.5 }]}
            onPress={onCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator size="small" color={Colors.danger} />
              : <Text style={S.cancelBtnText}>Hủy đơn</Text>}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────

export function OrdersScreen() {
  const nav = useNavigation<Nav>();
  const qc  = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.orders(activeTab === 'all' ? undefined : activeTab),
    queryFn:  () => orderService.getOrders({
      status: activeTab === 'all' ? undefined : activeTab,
      limit: 50,
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onMutate:   (id) => setCancellingId(id),
    onSettled:  () => setCancellingId(null),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Đã hủy', 'Đơn hàng đã được hủy thành công');
    },
    onError: () => Alert.alert('Lỗi', 'Không thể hủy đơn hàng'),
  });

  function confirmCancel(id: string) {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc muốn hủy đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        { text: 'Hủy đơn', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
      ],
    );
  }

  const orders = data?.orders ?? [];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScreenHeader title="Đơn hàng của tôi" onBack={() => nav.goBack()} />

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={S.tabsBar}
        contentContainerStyle={S.tabsContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[S.tab, activeTab === t.key && S.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[S.tabText, activeTab === t.key && S.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
          {[0, 1, 2].map((i) => <SkeletonOrder key={i} />)}
        </ScrollView>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={S.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onDetail={() => nav.navigate('OrderDetail', { orderId: item.id })}
              onCancel={() => confirmCancel(item.id)}
              cancelling={cancellingId === item.id}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  tabsBar:     { flexGrow: 0, flexShrink: 0, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabsContent: { paddingHorizontal: 12, gap: 4, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  tabActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:       { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  tabTextActive: { color: '#fff' },

  listContent: { padding: 12, gap: 10, paddingBottom: 32 },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textSub, textAlign: 'center', paddingHorizontal: 40 },

  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    ...Shadows.card,
  },
  orderHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  orderId:      { fontSize: 13, fontWeight: '700', color: Colors.text },
  orderDate:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  itemsRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  itemThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  moreThumb: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  moreText:  { fontSize: 12, fontWeight: '700', color: Colors.textSub },
  qtyBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 5, paddingHorizontal: 3, paddingVertical: 1,
  },
  qtyBadgeText:  { fontSize: 9, fontWeight: '700', color: '#fff' },
  totalBlock:    { alignItems: 'flex-end' },
  totalLabel:    { fontSize: 11, color: Colors.textSub },
  totalAmount:   { fontSize: 15, fontWeight: '800', color: Colors.primary, marginTop: 2 },

  orderActions:  { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  detailBtn: {
    flex: 1, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  detailBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  cancelBtn: {
    flex: 1, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
});
