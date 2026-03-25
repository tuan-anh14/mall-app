import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Người mua',
  seller: 'Người bán',
  admin: 'Quản trị viên',
};

export function ProfileScreen() {
  const { user, logout } = useAuth();

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

  const avatarLetter = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <View style={styles.divider} />
          <InfoRow label="Vai trò" value={ROLE_LABEL[user?.userType ?? ''] ?? '—'} />
          {user?.sellerRequestStatus && (
            <>
              <View style={styles.divider} />
              <InfoRow label="Yêu cầu bán hàng" value={user.sellerRequestStatus} />
            </>
          )}
        </View>

        {/* Logout */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={logout.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>
              {logout.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
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
    paddingVertical: 28,
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
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A56DB',
  },
  card: {
    marginHorizontal: 20,
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
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
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
});
