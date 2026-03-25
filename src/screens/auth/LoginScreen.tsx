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
import { useAuth } from '@hooks/useAuth';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { getApiErrorMessage } from '@utils/index';
import type { AuthStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Email không hợp lệ';
    if (!password) next.password = 'Mật khẩu không được để trống';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleLogin() {
    if (!validate()) return;
    login.mutate({ email: email.trim(), password });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.appName}>MALL</Text>
            <Text style={styles.tagline}>Mua sắm thông minh</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>Đăng nhập vào tài khoản của bạn</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="ban@example.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
                keyboardType="email-address"
                error={errors.email}
                leftIcon={<Text style={styles.inputIcon}>✉</Text>}
              />

              <Input
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password)
                    setErrors((e) => ({ ...e, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                error={errors.password}
                leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                rightIcon={
                  <Text style={styles.inputIcon}>
                    {showPassword ? '🙈' : '👁'}
                  </Text>
                }
                onRightIconPress={() => setShowPassword((v) => !v)}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {login.isError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  {getApiErrorMessage(login.error, 'Đăng nhập thất bại. Vui lòng thử lại.')}
                </Text>
              </View>
            )}

            <Button
              label="Đăng nhập"
              onPress={handleLogin}
              loading={login.isPending}
              style={styles.ctaBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerHint}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  form: { gap: 16 },
  inputIcon: { fontSize: 16 },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: 13,
    color: '#1A56DB',
    fontWeight: '500',
  },
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF' },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerHint: { fontSize: 14, color: '#6B7280' },
  registerLink: {
    fontSize: 14,
    color: '#1A56DB',
    fontWeight: '600',
  },
});
