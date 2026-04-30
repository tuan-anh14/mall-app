import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
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
import { returnService } from '@services/returnService';
import { formatVnd } from '@utils/index';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { RootStackParamList } from '@app/navigation/types';
import type { OrderTrackingStep } from '@typings/order';

// ─── Constants ────────────────────────────────────────

type RouteT = RouteProp<RootStackParamList, 'OrderDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: '#D97706', bg: '#FFFBEB' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2563EB', bg: '#EFF6FF' },
  PROCESSING: { label: 'Đang xử lý', color: '#7C3AED', bg: '#F5F3FF' },
  SHIPPED: { label: 'Đang vận chuyển', color: Colors.primary, bg: Colors.primaryLight },
  OUT_FOR_DELIVERY: { label: 'Đang giao', color: '#0891B2', bg: '#ECFEFF' },
  DELIVERED: { label: 'Đã giao', color: Colors.success, bg: Colors.successLight },
  CANCELLED: { label: 'Đã hủy', color: Colors.danger, bg: Colors.dangerLight },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#6B7280', bg: Colors.bg },
  CANCEL_REQUESTED: { label: 'Đang chờ hủy', color: '#EF4444', bg: '#FEF2F2' },
  RETURN_REQUESTED: { label: 'Yêu cầu đổi/trả', color: '#2563EB', bg: '#EFF6FF' },
  RETURN_APPROVED: { label: 'Đã duyệt đổi/trả', color: '#2563EB', bg: '#EFF6FF' },
  RETURNED: { label: 'Đã trả hàng', color: Colors.success, bg: Colors.successLight },
};

const PAY_LABELS: Record<string, string> = {
  wallet: 'Ví HUB',
  cod: 'Tiền mặt (COD)',
  vnpay: 'VNPay',
  momo: 'MoMo',
  card: 'Thẻ ngân hàng',
  paypal: 'PayPal',
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const RETURN_WINDOW_DAYS = 7;

function getDeliveredAt(order: NonNullable<Awaited<ReturnType<typeof orderService.getOrderById>>['order']>) {
  const deliveredStep = order.tracking.steps.find(
    (step) => step.status?.toUpperCase() === 'DELIVERED' && step.date,
  );
  return deliveredStep?.date ?? null;
}

function canRequestReturn(order: NonNullable<Awaited<ReturnType<typeof orderService.getOrderById>>['order']>) {
  if (order.status !== 'DELIVERED') return false;
  const deliveredAt = getDeliveredAt(order);
  if (!deliveredAt) return false;
  const expiresAt = new Date(deliveredAt);
  expiresAt.setDate(expiresAt.getDate() + RETURN_WINDOW_DAYS);
  return new Date() <= expiresAt;
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

function buildImagesFormData(assets: ImagePicker.ImagePickerAsset[]) {
  const formData = new FormData();
  assets.forEach((asset, index) => {
    const fileName = asset.uri.split('/').pop() || `return_${index}.jpg`;
    const match = /\.(\w+)$/.exec(fileName);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('files', { uri: asset.uri, name: fileName, type } as any);
  });
  return formData;
}

const TL = StyleSheet.create({
  wrap: { paddingLeft: 4 },
  row: { flexDirection: 'row', gap: 14, marginBottom: 0 },
  connCol: { alignItems: 'center', width: 18 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginTop: 2,
  },
  dotDone: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight, borderWidth: 3 },
  line: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4 },
  lineDone: { backgroundColor: Colors.primary },
  content: { flex: 1, paddingBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text },
  labelPending: { color: Colors.textMuted, fontWeight: '500' },
  desc: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});

// ─── Screen ───────────────────────────────────────────

export function OrderDetailScreen() {
  const route = useRoute<RouteT>();
  const nav = useNavigation<Nav>();
  const qc = useQueryClient();
  const { orderId } = route.params;
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnImages, setReturnImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.order(orderId),
    queryFn: () => orderService.getOrderById(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => orderService.cancelOrder(orderId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      setCancelModalOpen(false);
      setCancelReason('');
      Alert.alert('Đã gửi yêu cầu', 'Yêu cầu hủy đơn hàng đã được gửi thành công');
    },
    onError: () => Alert.alert('Lỗi', 'Không thể hủy đơn hàng lúc này'),
  });

  function confirmCancel() {
    setCancelModalOpen(true);
  }

  function submitCancel() {
    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập lý do hủy đơn.');
      return;
    }
    cancelMutation.mutate(reason);
  }

  const returnMutation = useMutation({
    mutationFn: async () => {
      const reason = returnReason.trim();
      if (!reason) throw new Error('Vui lòng nhập lý do trả hàng.');
      if (returnImages.length === 0) throw new Error('Vui lòng tải lên ít nhất một ảnh minh chứng.');
      const urls = await returnService.uploadImages(buildImagesFormData(returnImages));
      return returnService.createRequest({ orderId, reason, images: urls });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      setReturnModalOpen(false);
      setReturnReason('');
      setReturnImages([]);
      Alert.alert('Thành công', 'Yêu cầu trả hàng đã được gửi thành công.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Không thể gửi yêu cầu trả hàng.';
      Alert.alert('Lỗi', msg);
    },
  });

  async function pickReturnImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh để tải ảnh minh chứng.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    setReturnImages((prev) => [...prev, ...result.assets].slice(0, 5));
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
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);
  const canReturn = canRequestReturn(order);

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

        {canReturn && (
          <TouchableOpacity
            style={[S.returnBtn, returnMutation.isPending && { opacity: 0.5 }]}
            onPress={() => setReturnModalOpen(true)}
            disabled={returnMutation.isPending}
          >
            <Text style={S.returnBtnText}>Yêu cầu trả hàng</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <Modal visible={cancelModalOpen} transparent animationType="fade" onRequestClose={() => setCancelModalOpen(false)}>
        <View style={S.modalBackdrop}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Hủy đơn hàng</Text>
            <Text style={S.modalSub}>Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng.</Text>
            <TextInput
              style={S.textarea}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ví dụ: Tôi muốn đổi địa chỉ, đặt nhầm sản phẩm..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={S.modalActions}>
              <TouchableOpacity style={S.modalGhostBtn} onPress={() => setCancelModalOpen(false)} disabled={cancelMutation.isPending}>
                <Text style={S.modalGhostText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalDangerBtn, cancelMutation.isPending && { opacity: 0.6 }]} onPress={submitCancel} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={S.modalDangerText}>Xác nhận hủy</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={returnModalOpen} transparent animationType="fade" onRequestClose={() => setReturnModalOpen(false)}>
        <View style={S.modalBackdrop}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Yêu cầu trả hàng</Text>
            <Text style={S.modalSub}>Mô tả lý do và tải lên ảnh minh chứng. Tối đa 5 ảnh.</Text>
            <TextInput
              style={S.textarea}
              value={returnReason}
              onChangeText={setReturnReason}
              placeholder="Sản phẩm lỗi, không đúng mẫu, thiếu phụ kiện..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={S.imagePickerRow}>
              <TouchableOpacity style={S.pickImageBtn} onPress={pickReturnImages} disabled={returnMutation.isPending || returnImages.length >= 5}>
                <Ionicons name="image-outline" size={18} color={Colors.primary} />
                <Text style={S.pickImageText}>Thêm ảnh ({returnImages.length}/5)</Text>
              </TouchableOpacity>
            </View>
            {returnImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {returnImages.map((asset, index) => (
                  <View key={`${asset.uri}-${index}`} style={S.returnThumb}>
                    <Image source={{ uri: asset.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <TouchableOpacity
                      style={S.removeImageBtn}
                      onPress={() => setReturnImages((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={S.modalActions}>
              <TouchableOpacity style={S.modalGhostBtn} onPress={() => setReturnModalOpen(false)} disabled={returnMutation.isPending}>
                <Text style={S.modalGhostText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalPrimaryBtn, returnMutation.isPending && { opacity: 0.6 }]} onPress={() => returnMutation.mutate()} disabled={returnMutation.isPending}>
                {returnMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={S.modalPrimaryText}>Gửi yêu cầu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '700' },
  estDelivery: { fontSize: 12, color: Colors.textSub },

  // Items
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  itemImg: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F1F5F9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  itemVariant: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  itemQty: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, alignSelf: 'center' },

  // Pricing
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  priceLabel: { fontSize: 13, color: Colors.textSub },
  priceValue: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '900', color: Colors.primary },

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
  returnBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    marginTop: 4,
  },
  returnBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },

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
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    backgroundColor: Colors.bg,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalGhostBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  modalGhostText: { fontSize: 14, fontWeight: '700', color: Colors.textSub },
  modalDangerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
  },
  modalDangerText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalPrimaryText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  imagePickerRow: { flexDirection: 'row' },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pickImageText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  returnThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.9)',
  },
});
