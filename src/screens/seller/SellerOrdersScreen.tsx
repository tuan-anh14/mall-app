import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerOrderService } from '@services/sellerOrderService';
import { returnService, type ReturnRequest } from '@services/returnService';
import { formatVnd } from '@utils/index';
import type { SellerOrder } from '@typings/seller';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

const STATUS_OPTS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'Processing', label: 'Đang xử lý' },
  { key: 'Shipped', label: 'Đang giao' },
  { key: 'Delivered', label: 'Đã giao' },
  { key: 'RETURN_REQUESTED', label: 'Đổi / Trả' },
  { key: 'RETURNED', label: 'Đã trả' },
  { key: 'CANCEL_REQUESTED', label: 'Yêu cầu hủy' },
  { key: 'Cancelled', label: 'Đã hủy' },
];

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  Pending:       { text: '#D97706', bg: '#FFFBEB' },
  Confirmed:     { text: '#2563EB', bg: '#EFF6FF' },
  Processing:    { text: '#D97706', bg: '#FFFBEB' },
  Shipped:       { text: '#2563EB', bg: '#EFF6FF' },
  Delivered:     { text: '#059669', bg: '#ECFDF5' },
  RETURN_REQUESTED: { text: '#2563EB', bg: '#EFF6FF' },
  RETURNED:      { text: '#059669', bg: '#ECFDF5' },
  CANCEL_REQUESTED: { text: '#EF4444', bg: '#FEF2F2' },
  Cancelled:     { text: '#EF4444', bg: '#FEF2F2' },
  Refunded:      { text: '#6B7280', bg: '#F3F4F6' },
};

const REVENUE_STATUS_CONFIG: Record<string, { label: string; text: string; bg: string }> = {
  UNPAID:   { label: 'Chưa thanh toán', text: '#6B7280', bg: '#F3F4F6' },
  PENDING:  { label: 'Sàn tạm giữ',    text: '#D97706', bg: '#FFFBEB' },
  RELEASED: { label: 'Đã quyết toán',  text: '#059669', bg: '#ECFDF5' },
  REFUNDED: { label: 'Đã hoàn tiền',   text: '#EF4444', bg: '#FEF2F2' },
};

const NEXT_STATUS: Record<string, string> = {
  Pending:    'Processing',
  Confirmed:  'Processing',
  Processing: 'Shipped',
  Shipped:    'Delivered',
};

const NEXT_LABEL: Record<string, string> = {
  Pending:    'Chuẩn bị hàng',
  Confirmed:  'Chuẩn bị hàng',
  Processing: 'Giao hàng',
  Shipped:    'Đã giao',
};

const normalizeStatusKey = (status?: string | null) =>
  status?.trim().toUpperCase().replace(/[\s-]+/g, '_') ?? '';

const getOrderStatusKey = (order: Pick<SellerOrder, 'status' | 'rawStatus'>) =>
  normalizeStatusKey(order.rawStatus || order.status);

const getDefaultRefundAmount = (order: Pick<ReturnRequest['order'], 'subtotal' | 'tax' | 'couponDiscount'>) =>
  Math.max(0, order.subtotal - (order.couponDiscount ?? 0) + order.tax);

function OrderCard({
  order,
  onUpdateStatus,
  onHandleCancel,
  onConfirmCodPayment,
  onManageReturn,
  isPending,
}: {
  order: SellerOrder;
  onUpdateStatus: (status: string) => void;
  onHandleCancel: (action: 'APPROVE' | 'REJECT') => void;
  onConfirmCodPayment: () => void;
  onManageReturn: () => void;
  isPending: boolean;
}) {
  const statusKey = getOrderStatusKey(order);
  const sc = STATUS_COLORS[statusKey] ?? STATUS_COLORS[order.status] ?? { text: Colors.textSub, bg: Colors.bg };
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = nextStatus ? NEXT_LABEL[order.status] : null;
  const canConfirmCodPayment =
    order.status === 'Delivered' &&
    order.paymentMethod === 'cod' &&
    order.revenueStatus === 'UNPAID';

  return (
    <View style={OC.card}>
      <View style={OC.topRow}>
        <Text style={OC.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[OC.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[OC.statusText, { color: sc.text }]}>
            {STATUS_OPTS.find((s) => s.key === statusKey)?.label ??
              STATUS_OPTS.find((s) => s.key === order.status)?.label ??
              order.status}
          </Text>
        </View>
      </View>

      {order.revenueStatus && (
        <View style={[OC.revenueBadge, { backgroundColor: REVENUE_STATUS_CONFIG[order.revenueStatus]?.bg }]}>
          <Ionicons name="wallet-outline" size={12} color={REVENUE_STATUS_CONFIG[order.revenueStatus]?.text} />
          <Text style={[OC.revenueText, { color: REVENUE_STATUS_CONFIG[order.revenueStatus]?.text }]}>
            {REVENUE_STATUS_CONFIG[order.revenueStatus]?.label}
          </Text>
        </View>
      )}

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
        
        {statusKey === 'CANCEL_REQUESTED' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[OC.cancelBtn, OC.approveBtn, isPending && OC.updateBtnDim]}
              onPress={() => onHandleCancel('APPROVE')}
              disabled={isPending}
            >
              <Text style={OC.cancelBtnText}>Đồng ý hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[OC.cancelBtn, isPending && OC.updateBtnDim]}
              onPress={() => onHandleCancel('REJECT')}
              disabled={isPending}
            >
              <Text style={[OC.cancelBtnText, { color: Colors.textSub }]}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        ) : statusKey === 'RETURN_REQUESTED' ? (
          <TouchableOpacity
            style={[OC.updateBtn, isPending && OC.updateBtnDim]}
            onPress={onManageReturn}
            disabled={isPending}
          >
            <Text style={OC.updateBtnText}>Quản lý đổi/trả</Text>
          </TouchableOpacity>
        ) : canConfirmCodPayment ? (
          <TouchableOpacity
            style={[OC.updateBtn, isPending && OC.updateBtnDim]}
            onPress={onConfirmCodPayment}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={OC.updateBtnText}>Đã nhận tiền COD</Text>
            )}
          </TouchableOpacity>
        ) : (
          nextLabel && (
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
          )
        )}
      </View>
    </View>
  );
}

function SellerReturnModal({
  visible,
  requestId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  requestId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sellerNote, setSellerNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    if (!visible || !requestId) return;
    let active = true;
    setLoading(true);
    returnService.getRequestById(requestId)
      .then((data) => {
        if (!active) return;
        setRequest(data);
        setSellerNote(data.sellerNote || '');
        setRefundAmount((data.refundAmount ?? getDefaultRefundAmount(data.order)).toString());
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Không thể tải chi tiết yêu cầu.';
        Alert.alert('Lỗi', msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, requestId]);

  async function updateStatus(status: 'APPROVED' | 'REJECTED') {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await returnService.updateStatus(requestId, {
        status,
        sellerNote: sellerNote.trim() || undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
      });
      Alert.alert('Thành công', 'Cập nhật yêu cầu trả thành công.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật yêu cầu.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReceipt() {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await returnService.confirmReceipt(requestId);
      Alert.alert('Thành công', 'Đã xác nhận nhận hàng và hoàn tiền cho khách.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xác nhận nhận hàng.';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={S.modalBackdrop}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>Quản lý yêu cầu trả hàng</Text>
          {loading ? (
            <View style={S.modalLoading}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={S.modalSub}>Đang tải chi tiết...</Text>
            </View>
          ) : request ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View style={S.returnInfoBox}>
                <Text style={S.returnLabel}>Khách hàng</Text>
                <Text style={S.returnText}>{request.user.firstName} {request.user.lastName} ({request.user.email})</Text>
                <Text style={S.returnLabel}>Lý do từ khách hàng</Text>
                <Text style={S.returnReason}>{request.reason}</Text>
                {request.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {request.images.map((url) => (
                      <Image key={url} source={{ uri: url }} style={S.returnImage} resizeMode="cover" />
                    ))}
                  </ScrollView>
                )}
              </View>
              <View style={S.currencyInputWrap}>
                <TextInput
                  style={S.currencyInput}
                  value={refundAmount}
                  onChangeText={setRefundAmount}
                  keyboardType="numeric"
                  placeholder="Số tiền hoàn"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={S.currencySuffix}>đ</Text>
              </View>
              <TextInput
                style={S.modalTextarea}
                value={sellerNote}
                onChangeText={setSellerNote}
                placeholder="Ghi chú / phản hồi cho khách hàng..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {request.status === 'PENDING' && (
                <View style={S.modalActions}>
                  <TouchableOpacity style={[S.rejectBtn, submitting && S.updateBtnDim]} onPress={() => updateStatus('REJECTED')} disabled={submitting}>
                    <Text style={S.rejectText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.approveReturnBtn, submitting && S.updateBtnDim]} onPress={() => updateStatus('APPROVED')} disabled={submitting}>
                    <Text style={S.approveReturnText}>Chấp nhận</Text>
                  </TouchableOpacity>
                </View>
              )}
              {request.status === 'APPROVED' && (
                <TouchableOpacity style={[S.confirmReceiptBtn, submitting && S.updateBtnDim]} onPress={confirmReceipt} disabled={submitting}>
                  <Text style={S.confirmReceiptText}>Xác nhận đã nhận hàng & hoàn tiền</Text>
                </TouchableOpacity>
              )}
              {request.status === 'COMPLETED' && (
                <Text style={S.completedText}>Yêu cầu này đã hoàn tất và hoàn tiền.</Text>
              )}
            </ScrollView>
          ) : (
            <Text style={S.modalSub}>Không tìm thấy thông tin yêu cầu.</Text>
          )}
          <TouchableOpacity style={S.closeModalBtn} onPress={onClose} disabled={submitting}>
            <Text style={S.closeModalText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function SellerOrdersScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedReturnRequestId, setSelectedReturnRequestId] = useState<string | null>(null);

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

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: 'APPROVE' | 'REJECT' }) =>
      sellerOrderService.handleCancelRequest(orderId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      Alert.alert('Thành công', variables.action === 'APPROVE' ? 'Đã đồng ý hủy đơn hàng' : 'Đã từ chối hủy đơn');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Lỗi xử lý yêu cầu hủy';
      Alert.alert('Lỗi', msg);
    },
  });

  const confirmCodMutation = useMutation({
    mutationFn: (orderId: string) => sellerOrderService.confirmCodPayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      Alert.alert('Thành công', 'Đã ghi nhận tiền COD và cộng doanh thu vào ví shop.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể xác nhận tiền COD';
      Alert.alert('Lỗi', msg);
    },
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
              onHandleCancel={(action) =>
                cancelMutation.mutate({ orderId: item.id, action })
              }
              onConfirmCodPayment={() => confirmCodMutation.mutate(item.id)}
              onManageReturn={() => {
                if (!item.returnRequest?.id) {
                  Alert.alert('Thiếu dữ liệu', 'Đơn này chưa có mã yêu cầu trả hàng.');
                  return;
                }
                setSelectedReturnRequestId(item.returnRequest.id);
              }}
              isPending={
                (updateMutation.isPending &&
                  (updateMutation.variables as { orderId: string })?.orderId === item.id) ||
                (cancelMutation.isPending &&
                  (cancelMutation.variables as { orderId: string })?.orderId === item.id) ||
                (confirmCodMutation.isPending && confirmCodMutation.variables === item.id)
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
      <SellerReturnModal
        visible={!!selectedReturnRequestId}
        requestId={selectedReturnRequestId}
        onClose={() => setSelectedReturnRequestId(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })}
      />
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
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 4,
  },
  revenueText: {
    fontSize: 10,
    fontWeight: '600',
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
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 18,
    backgroundColor: Colors.surface,
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
  modalLoading: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  returnInfoBox: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  returnLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  returnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  returnReason: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
  },
  returnImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  currencyInputWrap: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    paddingHorizontal: 12,
  },
  currencyInput: {
    flex: 1,
    color: Colors.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  currencySuffix: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSub,
  },
  modalTextarea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    backgroundColor: Colors.bg,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  updateBtnDim: { opacity: 0.6 },
  rejectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  rejectText: { fontSize: 14, fontWeight: '800', color: Colors.danger },
  approveReturnBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  approveReturnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  confirmReceiptBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
  },
  confirmReceiptText: { fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' },
  completedText: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    color: Colors.success,
    fontWeight: '700',
  },
  closeModalBtn: {
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  closeModalText: { fontSize: 14, fontWeight: '700', color: Colors.textSub },
});
