import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfile } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { changePassword } = useProfile();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!currentPassword) next.currentPassword = 'Mật khẩu hiện tại không được để trống';
    if (!newPassword) next.newPassword = 'Mật khẩu mới không được để trống';
    else if (newPassword.length < 6) next.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
    if (!confirmPassword) next.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (confirmPassword !== newPassword) next.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    changePassword.mutate({ currentPassword, newPassword });
  }

  if (changePassword.isSuccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Đổi mật khẩu thành công!</Text>
          <Text style={styles.successText}>
            Mật khẩu của bạn đã được cập nhật. Vui lòng sử dụng mật khẩu mới khi đăng nhập.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>← Quay lại hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tạo mật khẩu mới</Text>
          <Text style={styles.cardSubtitle}>
            Mật khẩu mới phải khác mật khẩu hiện tại và có ít nhất 6 ký tự.
          </Text>

          <View style={styles.form}>
            <Input
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={(v) => {
                setCurrentPassword(v);
                if (errors.currentPassword)
                  setErrors((e) => ({ ...e, currentPassword: undefined }));
              }}
              secureTextEntry={!showCurrent}
              error={errors.currentPassword}
              leftIcon={<Text style={styles.inputIcon}>🔑</Text>}
              rightIcon={<Text style={styles.inputIcon}>{showCurrent ? '🙈' : '👁'}</Text>}
              onRightIconPress={() => setShowCurrent((v) => !v)}
            />

            <Input
              label="Mật khẩu mới"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChangeText={(v) => {
                setNewPassword(v);
                if (errors.newPassword)
                  setErrors((e) => ({ ...e, newPassword: undefined }));
              }}
              secureTextEntry={!showNew}
              error={errors.newPassword}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
              rightIcon={<Text style={styles.inputIcon}>{showNew ? '🙈' : '👁'}</Text>}
              onRightIconPress={() => setShowNew((v) => !v)}
            />

            <Input
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (errors.confirmPassword)
                  setErrors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              secureTextEntry={!showConfirm}
              error={errors.confirmPassword}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
              rightIcon={<Text style={styles.inputIcon}>{showConfirm ? '🙈' : '👁'}</Text>}
              onRightIconPress={() => setShowConfirm((v) => !v)}
            />
          </View>

          {changePassword.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(
                  changePassword.error,
                  'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.',
                )}
              </Text>
            </View>
          )}

          <Button
            label="Đổi mật khẩu"
            onPress={handleSubmit}
            loading={changePassword.isPending}
            style={styles.ctaBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelRow}
          >
            <Text style={styles.cancelText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F5FF' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 32,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backIcon: { fontSize: 20, color: '#1F2937' },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  iconEmoji: { fontSize: 36 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  form: { gap: 16 },
  inputIcon: { fontSize: 16 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  ctaBtn: { marginTop: 20 },
  cancelRow: { alignItems: 'center', marginTop: 16 },
  cancelText: { fontSize: 14, color: '#6B7280' },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successEmoji: { fontSize: 44 },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#1A56DB',
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
