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
import type { AuthStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('Email không được để trống');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    forgotPassword.mutate(email.trim());
  }

  if (forgotPassword.isSuccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>📧</Text>
          </View>
          <Text style={styles.successTitle}>Kiểm tra email của bạn</Text>
          <Text style={styles.successText}>
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backToLoginBtn}
          >
            <Text style={styles.backToLoginText}>← Quay lại đăng nhập</Text>
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
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🔑</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Quên mật khẩu?</Text>
            <Text style={styles.subtitle}>
              Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="ban@example.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError(undefined);
                }}
                keyboardType="email-address"
                error={emailError}
                leftIcon={<Text style={styles.inputIcon}>✉</Text>}
              />
            </View>

            {forgotPassword.isError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>
                  Không tìm thấy tài khoản với email này.
                </Text>
              </View>
            )}

            <Button
              label="Gửi hướng dẫn"
              onPress={handleSubmit}
              loading={forgotPassword.isPending}
              style={styles.ctaBtn}
            />

            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
  header: {
    paddingTop: 12,
    marginBottom: 32,
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
  emailHighlight: {
    fontWeight: '600',
    color: '#1A56DB',
  },
  backToLoginBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#1A56DB',
    borderRadius: 12,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
