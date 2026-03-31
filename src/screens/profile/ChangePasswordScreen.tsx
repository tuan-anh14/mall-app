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
import { useProfileMutations } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { IonIconGlyph } from '@components/ui/IonIconGlyph';
import { Ionicons } from '@expo/vector-icons';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { changePassword } = useProfileMutations();

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
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
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
        <ScreenHeader title="Đổi mật khẩu" onBack={() => navigation.goBack()} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={40} color="#1A56DB" />
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
              leftIcon={<IonIconGlyph name="key-outline" />}
              rightIcon={
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              }
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
              leftIcon={<IonIconGlyph name="lock-closed-outline" />}
              rightIcon={
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              }
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
              leftIcon={<IonIconGlyph name="lock-closed-outline" />}
              rightIcon={
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              }
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
