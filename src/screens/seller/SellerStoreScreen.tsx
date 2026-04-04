import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { api } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

export function SellerStoreScreen() {
  const navigation = useNavigation<Nav>();
  const logoutFn = useAuthStore((s) => s.logout);
  const [isSuspended, setIsSuspended] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ isSuspended: boolean }>(
        '/api/v1/seller/profile/toggle-suspension',
      );
      return res.data;
    },
    onSuccess: (data) => {
      setIsSuspended(data.isSuspended ?? !isSuspended);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể cập nhật trạng thái cửa hàng.'),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/v1/seller/profile/close');
    },
    onSuccess: () => {
      Alert.alert(
        'Đã đóng cửa hàng',
        'Cửa hàng của bạn đã được đóng. Bạn sẽ được chuyển về tài khoản người mua.',
        [{ text: 'OK', onPress: () => void logoutFn() }],
      );
    },
    onError: () => Alert.alert('Lỗi', 'Không thể đóng cửa hàng. Vui lòng thử lại.'),
  });

  function handleToggleSuspend() {
    const action = isSuspended ? 'mở lại' : 'tạm dừng';
    Alert.alert(
      `${isSuspended ? 'Mở lại' : 'Tạm dừng'} cửa hàng`,
      `Bạn có chắc muốn ${action} cửa hàng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => toggleMutation.mutate(),
        },
      ],
    );
  }

  function handleCloseStore() {
    Alert.alert(
      'Đóng cửa hàng',
      'Hành động này không thể hoàn tác. Tất cả sản phẩm và dữ liệu cửa hàng sẽ bị xóa. Bạn có chắc chắn không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đóng cửa hàng',
          style: 'destructive',
          onPress: () => closeMutation.mutate(),
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
        <Text style={S.headerTitle}>Cửa hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Status */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Trạng thái cửa hàng</Text>

          <View style={S.row}>
            <View style={S.rowLeft}>
              <View style={[S.statusDot, !isSuspended ? S.dotActive : S.dotInactive]} />
              <View>
                <Text style={S.rowLabel}>
                  {isSuspended ? 'Đang tạm dừng' : 'Đang hoạt động'}
                </Text>
                <Text style={S.rowSub}>
                  {isSuspended
                    ? 'Khách hàng không thể xem sản phẩm của bạn'
                    : 'Cửa hàng của bạn đang hiển thị bình thường'}
                </Text>
              </View>
            </View>
            {toggleMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Switch
                value={!isSuspended}
                onValueChange={handleToggleSuspend}
                trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                thumbColor={!isSuspended ? Colors.primary : Colors.textMuted}
              />
            )}
          </View>
        </View>

        {/* Store Info */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Thông tin</Text>

          <View style={S.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={S.infoText}>
              Khi cửa hàng bị tạm dừng, khách hàng sẽ không thể xem hoặc mua
              sản phẩm của bạn. Đơn hàng đang xử lý vẫn cần được hoàn thành.
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[S.section, S.dangerSection]}>
          <Text style={S.dangerSectionTitle}>Vùng nguy hiểm</Text>

          <View style={S.dangerCard}>
            <Ionicons name="warning-outline" size={22} color={Colors.danger} />
            <View style={S.dangerInfo}>
              <Text style={S.dangerTitle}>Đóng cửa hàng</Text>
              <Text style={S.dangerDesc}>
                Hành động này không thể hoàn tác. Toàn bộ sản phẩm, đơn hàng
                và dữ liệu cửa hàng sẽ bị xóa vĩnh viễn.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[S.closeBtn, closeMutation.isPending && S.closeBtnDim]}
            onPress={handleCloseStore}
            disabled={closeMutation.isPending}
            activeOpacity={0.8}
          >
            {closeMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                <Text style={S.closeBtnText}>Đóng cửa hàng</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...Shadows.card,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dangerSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: { backgroundColor: Colors.success },
  dotInactive: { backgroundColor: Colors.textMuted },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSub,
    lineHeight: 18,
  },
  dangerCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  dangerInfo: { flex: 1, gap: 4 },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  dangerDesc: {
    fontSize: 13,
    color: Colors.textSub,
    lineHeight: 18,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  closeBtnDim: { opacity: 0.6 },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
});
