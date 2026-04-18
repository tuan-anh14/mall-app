import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerOrderService } from '@services/sellerOrderService';
import { formatVnd } from '@utils/index';
import type { SellerOrder } from '@typings/seller';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

const STATUS_OPTS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Processing', label: 'Đang xử lý' },
  { key: 'Shipped', label: 'Đang giao' },
  { key: 'Delivered', label: 'Đã giao' },
  { key: 'Cancelled', label: 'Đã hủy' },
];

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  Processing:    { text: '#D97706', bg: '#FFFBEB' },
  Shipped:       { text: '#2563EB', bg: '#EFF6FF' },
  Delivered:     { text: '#059669', bg: '#ECFDF5' },
  Cancelled:     { text: '#EF4444', bg: '#FEF2F2' },
  Refunded:      { text: '#6B7280', bg: '#F3F4F6' },
};

const NEXT_STATUS: Record<string, string> = {
  Processing: 'Shipped',
  Shipped:    'Delivered',
};

const NEXT_LABEL: Record<string, string> = {
  Processing: 'Giao hàng',
  Shipped:    'Đã giao',
};

function OrderCard({
  order,
  onUpdateStatus,
  isPending,
}: {
  order: SellerOrder;
  onUpdateStatus: (status: string) => void;
  isPending: boolean;
}) {
  const sc = STATUS_COLORS[order.status] ?? { text: Colors.textSub, bg: Colors.bg };
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = nextStatus ? NEXT_LABEL[order.status] : null;

  return (
    <View style={OC.card}>
      <View style={OC.topRow}>
        <Text style={OC.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[OC.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[OC.statusText, { color: sc.text }]}>
            {STATUS_OPTS.find((s) => s.key === order.status)?.label ?? order.status}
          </Text>
        </View>
      </View>

      <View style={OC.divider} />

      <View style={OC.infoRow}>
        <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
        <Text style={OC.infoText}>{order.buyerName}</Text>
      </View>
      <View style={OC.infoRow}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
        <Text style={OC.infoText}>
          {new Date(order.date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </Text>
      </View>
      <View style={OC.infoRow}>
        <Ionicons name="cube-outline" size={14} color={Colors.textMuted} />
        <Text style={OC.infoText}>
          {order.items.length} sản phẩm
        </Text>
      </View>

      <View style={OC.footer}>
        <Text style={OC.total}>{formatVnd(order.total)}</Text>
        {nextLabel && (
          <TouchableOpacity
            style={[OC.updateBtn, isPending && OC.updateBtnDim]}
            onPress={() => onUpdateStatus(nextStatus!)}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={OC.updateBtnText}>{nextLabel}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function SellerOrdersScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.sellerOrders(`${activeStatus}-${search}`),
    queryFn: () =>
      sellerOrderService.getOrders({
        status: activeStatus === 'all' ? undefined : activeStatus,
        search: search || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      sellerOrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
    },
    onError: () => Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng.'),
  });

  const orders = data?.orders ?? [];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={S.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={S.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm đơn hàng..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => refetch()}
        />
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        style={{ flexGrow: 0, flexShrink: 0 }}
        data={STATUS_OPTS}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[S.filterChip, activeStatus === item.key && S.filterChipActive]}
            onPress={() => setActiveStatus(item.key)}
          >
            <Text
              style={[
                S.filterChipText,
                activeStatus === item.key && S.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={S.filterRow}
        showsHorizontalScrollIndicator={false}
      />

      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Text style={S.errorText}>Không thể tải đơn hàng</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onUpdateStatus={(status) =>
                updateMutation.mutate({ orderId: item.id, status })
              }
              isPending={
                updateMutation.isPending &&
                (updateMutation.variables as { orderId: string })?.orderId === item.id
              }
            />
          )}
          contentContainerStyle={
            orders.length === 0 ? S.emptyContent : S.listContent
          }
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <Ionicons name="receipt-outline" size={56} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>Chưa có đơn hàng</Text>
            </View>
          }
          refreshing={false}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const OC = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: { height: 1, backgroundColor: Colors.border },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSub,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  updateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  updateBtnDim: { opacity: 0.6 },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterChipText: { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { fontSize: 15, color: Colors.textSub },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16, gap: 12 },
  emptyContent: { flex: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSub,
  },
});
