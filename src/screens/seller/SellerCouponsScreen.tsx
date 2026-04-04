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
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerCouponService } from '@services/sellerCouponService';
import { formatVnd } from '@utils/index';
import type { SellerCoupon, CreateCouponDto } from '@typings/seller';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

const EMPTY_FORM: CreateCouponDto = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
};

function CouponCard({
  coupon,
  onToggle,
  onDelete,
  togglePending,
}: {
  coupon: SellerCoupon;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
}) {
  const isExpired = new Date(coupon.validUntil) < new Date();

  return (
    <View style={CC.card}>
      <View style={CC.topRow}>
        <View style={CC.codeWrap}>
          <Ionicons name="pricetag" size={14} color={Colors.primary} />
          <Text style={CC.code}>{coupon.code}</Text>
        </View>
        <View style={[CC.typeBadge, coupon.discountType === 'PERCENTAGE' ? CC.pctBadge : CC.fixedBadge]}>
          <Text style={[CC.typeText, coupon.discountType === 'PERCENTAGE' ? CC.pctText : CC.fixedText]}>
            {coupon.discountType === 'PERCENTAGE'
              ? `-${coupon.discountValue}%`
              : `-${formatVnd(coupon.discountValue)}`}
          </Text>
        </View>
      </View>

      <View style={CC.infoGrid}>
        {coupon.minOrderValue != null && (
          <Text style={CC.infoItem}>
            Đơn tối thiểu: {formatVnd(coupon.minOrderValue)}
          </Text>
        )}
        {coupon.usageLimit != null && (
          <Text style={CC.infoItem}>
            Đã dùng: {coupon.usageCount}/{coupon.usageLimit}
          </Text>
        )}
        <Text style={CC.infoItem}>
          HSD: {new Date(coupon.validUntil).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      <View style={CC.footer}>
        <View style={CC.statusRow}>
          {isExpired ? (
            <View style={CC.expiredBadge}>
              <Text style={CC.expiredText}>Hết hạn</Text>
            </View>
          ) : (
            <View style={[CC.activeBadge, !coupon.isActive && CC.inactiveBadge]}>
              <Text style={[CC.activeText, !coupon.isActive && CC.inactiveText]}>
                {coupon.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
              </Text>
            </View>
          )}
        </View>
        <View style={CC.actions}>
          <Switch
            value={coupon.isActive}
            onValueChange={onToggle}
            disabled={togglePending || isExpired}
            trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
            thumbColor={coupon.isActive ? Colors.primary : Colors.textMuted}
          />
          <TouchableOpacity
            style={CC.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function CouponFormModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateCouponDto) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateCouponDto>(EMPTY_FORM);

  function reset() {
    setForm(EMPTY_FORM);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!form.code.trim()) {
      Alert.alert('Lỗi', 'Mã coupon không được để trống');
      return;
    }
    if (!form.discountValue || form.discountValue <= 0) {
      Alert.alert('Lỗi', 'Giá trị giảm giá phải > 0');
      return;
    }
    onSubmit(form);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={FM.safe} edges={['top']}>
        <View style={FM.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={FM.headerTitle}>Tạo coupon mới</Text>
          <TouchableOpacity
            style={[FM.createBtn, isPending && FM.createBtnDim]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={FM.createBtnText}>Tạo</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={FM.scroll}>
          <View style={FM.field}>
            <Text style={FM.label}>Mã coupon *</Text>
            <TextInput
              style={FM.input}
              value={form.code}
              onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
              placeholder="VD: SALE20"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </View>

          <View style={FM.field}>
            <Text style={FM.label}>Loại giảm giá</Text>
            <View style={FM.typeRow}>
              {(['PERCENTAGE', 'FIXED'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[FM.typeChip, form.discountType === t && FM.typeChipActive]}
                  onPress={() => setForm((f) => ({ ...f, discountType: t }))}
                >
                  <Text style={[FM.typeChipText, form.discountType === t && FM.typeChipTextActive]}>
                    {t === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={FM.field}>
            <Text style={FM.label}>
              Giá trị giảm {form.discountType === 'PERCENTAGE' ? '(%)' : '(VND)'} *
            </Text>
            <TextInput
              style={FM.input}
              value={form.discountValue ? form.discountValue.toString() : ''}
              onChangeText={(v) => setForm((f) => ({ ...f, discountValue: Number(v) || 0 }))}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={FM.row2}>
            <View style={FM.flex1}>
              <Text style={FM.label}>Bắt đầu</Text>
              <TextInput
                style={FM.input}
                value={form.validFrom}
                onChangeText={(v) => setForm((f) => ({ ...f, validFrom: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={FM.flex1}>
              <Text style={FM.label}>Kết thúc</Text>
              <TextInput
                style={FM.input}
                value={form.validUntil}
                onChangeText={(v) => setForm((f) => ({ ...f, validUntil: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={FM.field}>
            <Text style={FM.label}>Đơn hàng tối thiểu (VND)</Text>
            <TextInput
              style={FM.input}
              value={form.minOrderValue ? form.minOrderValue.toString() : ''}
              onChangeText={(v) => setForm((f) => ({ ...f, minOrderValue: Number(v) || undefined }))}
              placeholder="Không giới hạn"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={FM.field}>
            <Text style={FM.label}>Giới hạn sử dụng</Text>
            <TextInput
              style={FM.input}
              value={form.usageLimit ? form.usageLimit.toString() : ''}
              onChangeText={(v) => setForm((f) => ({ ...f, usageLimit: Number(v) || undefined }))}
              placeholder="Không giới hạn"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function SellerCouponsScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: coupons = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.sellerCoupons,
    queryFn: sellerCouponService.getCoupons,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateCouponDto) => sellerCouponService.createCoupon(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerCoupons });
      setShowModal(false);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể tạo coupon.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      sellerCouponService.updateCoupon(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerCoupons });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sellerCouponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerCoupons });
    },
    onError: () => Alert.alert('Lỗi', 'Không thể xóa coupon.'),
  });

  function handleDelete(coupon: SellerCoupon) {
    Alert.alert(
      'Xóa coupon',
      `Xóa mã "${coupon.code}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(coupon.id),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Mã giảm giá</Text>
        <TouchableOpacity
          style={S.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Text style={S.errorText}>Không thể tải coupon</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CouponCard
              coupon={item}
              onToggle={() =>
                toggleMutation.mutate({ id: item.id, isActive: !item.isActive })
              }
              onDelete={() => handleDelete(item)}
              togglePending={
                toggleMutation.isPending &&
                (toggleMutation.variables as { id: string })?.id === item.id
              }
            />
          )}
          contentContainerStyle={
            coupons.length === 0 ? S.emptyContent : S.listContent
          }
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <Ionicons name="pricetag-outline" size={56} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>Chưa có coupon</Text>
              <TouchableOpacity
                style={S.addEmptyBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={S.addEmptyText}>Tạo coupon đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={false}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CouponFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(dto) => createMutation.mutate(dto)}
        isPending={createMutation.isPending}
      />
    </SafeAreaView>
  );
}

const CC = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pctBadge: { backgroundColor: '#ECFDF5' },
  fixedBadge: { backgroundColor: '#EDE9FE' },
  typeText: { fontSize: 13, fontWeight: '800' },
  pctText: { color: '#059669' },
  fixedText: { color: '#7C3AED' },
  infoGrid: { gap: 4 },
  infoItem: { fontSize: 12, color: Colors.textSub },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {},
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
  },
  inactiveBadge: { backgroundColor: Colors.bg },
  activeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  inactiveText: { color: Colors.textMuted },
  expiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
  },
  expiredText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const FM = StyleSheet.create({
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 56,
    alignItems: 'center',
  },
  createBtnDim: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  input: {
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSub },
  typeChipTextActive: { color: Colors.primary, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1, gap: 6 },
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSub },
  addEmptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  addEmptyText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
