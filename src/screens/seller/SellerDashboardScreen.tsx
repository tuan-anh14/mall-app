import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerDashboardService } from '@services/sellerDashboardService';
import { formatVnd } from '@utils/index';
import type { SellerStackParamList } from '@app/navigation/types';
import type { SellerStats } from '@typings/seller';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}

function StatCard({ label, value, icon, color, bg }: StatCardProps) {
  return (
    <View style={[SC.card, { borderLeftColor: color }]}>
      <View style={[SC.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={SC.cardInfo}>
        <Text style={SC.cardValue}>{value}</Text>
        <Text style={SC.cardLabel}>{label}</Text>
      </View>
    </View>
  );
}

function buildStats(stats: SellerStats): StatCardProps[] {
  return [
    {
      label: 'Doanh thu',
      value: formatVnd(stats.totalRevenue ?? 0),
      icon: 'cash-outline',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      label: 'Đơn hàng',
      value: (stats.totalOrders ?? 0).toString(),
      icon: 'receipt-outline',
      color: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      label: 'Chờ xử lý',
      value: (stats.pendingOrders ?? 0).toString(),
      icon: 'time-outline',
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      label: 'Hoàn thành',
      value: (stats.completedOrders ?? 0).toString(),
      icon: 'checkmark-circle-outline',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      label: 'Sản phẩm',
      value: (stats.totalProducts ?? 0).toString(),
      icon: 'cube-outline',
      color: '#7C3AED',
      bg: '#EDE9FE',
    },
    {
      label: 'Đánh giá TB',
      value: (stats.averageRating ?? 0) > 0 ? stats.averageRating!.toFixed(1) : '—',
      icon: 'star-outline',
      color: '#D97706',
      bg: '#FFFBEB',
    },
  ];
}

interface QuickAction {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  screen: keyof SellerStackParamList;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Sản phẩm', icon: 'cube-outline', screen: 'SellerProducts', color: Colors.primary },
  { label: 'Đơn hàng', icon: 'receipt-outline', screen: 'SellerOrders', color: '#059669' },
  { label: 'Đánh giá', icon: 'star-outline', screen: 'SellerReviews', color: '#D97706' },
  { label: 'Coupon', icon: 'pricetag-outline', screen: 'SellerCoupons', color: '#7C3AED' },
  { label: 'Cửa hàng', icon: 'storefront-outline', screen: 'SellerStore', color: '#EF4444' },
];

export function SellerDashboardScreen() {
  const navigation = useNavigation<Nav>();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.sellerStats,
    queryFn: sellerDashboardService.getStats,
  });

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Quản lý cửa hàng</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SellerStore')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Tổng quan</Text>
          {isLoading ? (
            <View style={S.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : isError ? (
            <View style={S.errorWrap}>
              <Text style={S.errorText}>Không thể tải dữ liệu</Text>
              <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
                <Text style={S.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : stats ? (
            <View style={S.statsGrid}>
              {buildStats(stats).map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </View>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Quản lý nhanh</Text>
          <View style={S.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.screen}
                style={S.actionBtn}
                onPress={() => navigation.navigate(action.screen as never)}
                activeOpacity={0.75}
              >
                <View style={[S.actionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={S.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Tính năng</Text>

          {([
            {
              icon: 'cube-outline' as const,
              label: 'Sản phẩm',
              sub: 'Thêm, sửa, xóa sản phẩm',
              screen: 'SellerProducts' as const,
            },
            {
              icon: 'receipt-outline' as const,
              label: 'Đơn hàng',
              sub: 'Xem và cập nhật trạng thái',
              screen: 'SellerOrders' as const,
            },
            {
              icon: 'star-outline' as const,
              label: 'Đánh giá',
              sub: 'Phản hồi khách hàng',
              screen: 'SellerReviews' as const,
            },
            {
              icon: 'pricetag-outline' as const,
              label: 'Mã giảm giá',
              sub: 'Tạo và quản lý coupon',
              screen: 'SellerCoupons' as const,
            },
            {
              icon: 'storefront-outline' as const,
              label: 'Cửa hàng',
              sub: 'Cài đặt và quản lý cửa hàng',
              screen: 'SellerStore' as const,
            },
          ] as const).map((item, idx, arr) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={S.menuItem}
                onPress={() => navigation.navigate(item.screen as never)}
                activeOpacity={0.7}
              >
                <View style={S.menuIcon}>
                  <Ionicons name={item.icon} size={20} color={Colors.textSub} />
                </View>
                <View style={S.menuContent}>
                  <Text style={S.menuLabel}>{item.label}</Text>
                  <Text style={S.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={S.divider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SC = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    ...Shadows.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
    fontSize: 20,
    fontWeight: '800',
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  errorText: { fontSize: 14, color: Colors.textSub },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: -2,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '18%',
    minWidth: 56,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSub,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
