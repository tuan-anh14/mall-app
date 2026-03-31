import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { useProfileQuery, useProfileMutations } from '@hooks/useProfile';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Người mua',
  seller: 'Người bán',
  admin: 'Quản trị viên',
  BUYER: 'Người mua',
  SELLER: 'Người bán',
  ADMIN: 'Quản trị viên',
};

const SELLER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã được duyệt',
  REJECTED: 'Bị từ chối',
};

function formatMemberSince(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

function InfoRow({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueRow}>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
        {verified !== undefined && (
          <View style={[styles.verifiedBadge, !verified && styles.unverifiedBadge]}>
            <Text style={[styles.verifiedText, !verified && styles.unverifiedText]}>
              {verified ? 'Đã xác thực' : 'Chưa xác thực'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();
  const { deleteAccount } = useProfileMutations();

  const avatarLetter = user?.name?.[0]?.toUpperCase() ?? '?';
  const isBuyer = user?.userType === 'buyer';
  const hasPendingRequest = user?.sellerRequestStatus === 'PENDING';

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Xóa tài khoản',
      'Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: () => deleteAccount.mutate(),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABEL[user?.userType ?? ''] ?? user?.userType}
            </Text>
          </View>
          {profile?.memberSince && (
            <Text style={styles.memberSince}>
              Thành viên từ {formatMemberSince(profile.memberSince)}
            </Text>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          {profileLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1A56DB" />
            </View>
          ) : (
            <>
              <InfoRow
                label="Email"
                value={user?.email ?? '—'}
                verified={profile?.isEmailVerified}
              />
              {profile?.phone && (
                <>
                  <View style={styles.divider} />
                  <InfoRow label="Số điện thoại" value={profile.phone} />
                </>
              )}
              <View style={styles.divider} />
              <InfoRow
                label="Vai trò"
                value={ROLE_LABEL[user?.userType ?? ''] ?? '—'}
              />
              {user?.sellerRequestStatus && (
                <>
                  <View style={styles.divider} />
                  <InfoRow
                    label="Yêu cầu bán hàng"
                    value={
                      SELLER_STATUS_LABEL[user.sellerRequestStatus] ??
                      user.sellerRequestStatus
                    }
                  />
                </>
              )}
            </>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>

          <MenuItem
            icon="✏️"
            label="Chỉnh sửa hồ sơ"
            sublabel="Tên, số điện thoại"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <View style={styles.divider} />

          <MenuItem
            icon="🔒"
            label="Đổi mật khẩu"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <View style={styles.divider} />

          <MenuItem
            icon="📦"
            label="Địa chỉ giao hàng"
            sublabel="Quản lý địa chỉ nhận hàng"
            onPress={() => navigation.navigate('Addresses')}
          />
          <View style={styles.divider} />

          <MenuItem
            icon="⚙️"
            label="Cài đặt"
            sublabel="Thông báo, ngôn ngữ, tiền tệ"
            onPress={() => navigation.navigate('Settings')}
          />

          {isBuyer && !hasPendingRequest && (
            <>
              <View style={styles.divider} />
              <MenuItem
                icon="🏪"
                label="Trở thành người bán"
                onPress={() => navigation.navigate('BecomeSeller')}
              />
            </>
          )}

          {hasPendingRequest && (
            <>
              <View style={styles.divider} />
              <View style={styles.pendingRow}>
                <Text style={styles.pendingIcon}>⏳</Text>
                <Text style={styles.pendingText}>Yêu cầu bán hàng đang chờ duyệt</Text>
              </View>
            </>
          )}
        </View>

        {/* Logout + Delete */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={logout.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>
              {logout.isPending ? 'Đang đăng xuất...' : '🚪  Đăng xuất'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={handleDeleteAccount}
            disabled={deleteAccount.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteAccountText}>
              {deleteAccount.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A56DB',
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '65%',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flexShrink: 1,
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  unverifiedText: {
    color: '#CA8A04',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconDanger: {
    backgroundColor: '#FEF2F2',
  },
  menuIconText: { fontSize: 18 },
  menuContent: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuLabelDanger: { color: '#EF4444' },
  menuSublabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  menuChevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  pendingIcon: { fontSize: 20 },
  pendingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});
