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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Tên không được để trống';
    if (!email.trim()) next.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Email không hợp lệ';
    if (!password) next.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleRegister() {
    if (!validate()) return;
    register.mutate({ name: name.trim(), email: email.trim(), password });
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
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.appName}>MALL</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu mua sắm cùng MALL</Text>

            <View style={styles.form}>
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                autoCapitalize="words"
                error={errors.name}
                leftIcon={<Text style={styles.inputIcon}>👤</Text>}
              />

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
                placeholder="Tối thiểu 6 ký tự"
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
            </View>

            {register.isError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  {getApiErrorMessage(register.error, 'Đăng ký thất bại. Vui lòng thử lại.')}
                </Text>
              </View>
            )}

            <Button
              label="Đăng ký"
              onPress={handleRegister}
              loading={register.isPending}
              style={styles.ctaBtn}
            />

            <Text style={styles.terms}>
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> của chúng tôi.
            </Text>

            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
    paddingBottom: 32,
  },
  header: {
    paddingTop: 12,
    marginBottom: 24,
  },
  backBtn: {
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
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 4,
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
  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: { color: '#1A56DB' },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginHint: { fontSize: 14, color: '#6B7280' },
  loginLink: {
    fontSize: 14,
    color: '#1A56DB',
    fontWeight: '600',
  },
});
