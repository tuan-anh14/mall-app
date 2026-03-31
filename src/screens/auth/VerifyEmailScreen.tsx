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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { verifyEmail } = useAuth();

  const { email } = route.params;
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();

  function validate(): boolean {
    if (!code.trim()) {
      setCodeError('Mã xác thực không được để trống');
      return false;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Mã xác thực gồm 6 chữ số');
      return false;
    }
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    verifyEmail.mutate({ email, code: code.trim() });
  }

  if (verifyEmail.isSuccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Xác thực thành công!</Text>
          <Text style={styles.successText}>
            Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.
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

        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={40} color="#1A56DB" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã 6 chữ số đến{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
            {'\n'}Nhập mã để hoàn tất đăng ký.
          </Text>

          <View style={styles.form}>
            <Input
              label="Mã xác thực"
              placeholder="Nhập 6 chữ số"
              value={code}
              onChangeText={(v) => {
                setCode(v);
                if (codeError) setCodeError(undefined);
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={codeError}
              leftIcon={<IonIconGlyph name="keypad-outline" />}
            />
          </View>

          {verifyEmail.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(
                  verifyEmail.error,
                  'Mã xác thực không hợp lệ hoặc đã hết hạn.',
                )}
              </Text>
            </View>
          )}

          <Button
            label="Xác thực"
            onPress={handleSubmit}
            loading={verifyEmail.isPending}
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
  emailHighlight: {
    fontWeight: '600',
    color: '#1A56DB',
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
