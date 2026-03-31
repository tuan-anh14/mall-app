import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@hooks/useAuth';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { IonIconGlyph } from '@components/ui/IonIconGlyph';
import { Ionicons } from '@expo/vector-icons';
import { getApiErrorMessage } from '@utils/index';
import type { AuthStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { resetPassword } = useAuth();

  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!token.trim()) next.token = 'Mã xác nhận không được để trống';
    if (!password) next.password = 'Mật khẩu mới không được để trống';
    else if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!confirmPassword) next.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (confirmPassword !== password) next.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    resetPassword.mutate({ token: token.trim(), password });
  }

  if (resetPassword.isSuccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Đặt lại mật khẩu thành công!</Text>
          <Text style={styles.successText}>
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
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
        <ScreenHeader onBack={() => navigation.goBack()} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={40} color="#1A56DB" />
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mã xác nhận từ email và mật khẩu mới của bạn.
          </Text>

          <View style={styles.form}>
            <Input
              label="Mã xác nhận"
              placeholder="Dán mã từ email vào đây"
              value={token}
              onChangeText={(v) => {
                setToken(v);
                if (errors.token) setErrors((e) => ({ ...e, token: undefined }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.token}
              leftIcon={<IonIconGlyph name="key-outline" />}
            />

            <Input
              label="Mật khẩu mới"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<IonIconGlyph name="lock-closed-outline" />}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
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

          {resetPassword.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(
                  resetPassword.error,
                  'Mã xác nhận không hợp lệ hoặc đã hết hạn.',
                )}
              </Text>
            </View>
          )}

          <Button
            label="Đặt lại mật khẩu"
            onPress={handleSubmit}
            loading={resetPassword.isPending}
            style={styles.ctaBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.cancelRow}
          >
            <Text style={styles.cancelText}>← Quay lại đăng nhập</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
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
  cancelRow: { alignItems: 'center', marginTop: 20 },
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
  loginBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#1A56DB',
    borderRadius: 12,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
