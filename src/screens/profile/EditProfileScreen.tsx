import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { useProfile } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  const initial = splitName(user?.name ?? '');
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = 'Tên không được để trống';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    updateProfile.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Hồ sơ đã được cập nhật.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
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
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(firstName[0] ?? user?.name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.form}>
            <Input
              label="Tên"
              placeholder="Nguyễn"
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
              }}
              autoCapitalize="words"
              error={errors.firstName}
              leftIcon={<Text style={styles.inputIcon}>👤</Text>}
            />

            <Input
              label="Họ (và tên đệm)"
              placeholder="Văn A"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              leftIcon={<Text style={styles.inputIcon}>👤</Text>}
            />

            <Input
              label="Số điện thoại (tuỳ chọn)"
              placeholder="0901 234 567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Text style={styles.inputIcon}>📞</Text>}
            />
          </View>

          {updateProfile.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(updateProfile.error, 'Cập nhật thất bại. Vui lòng thử lại.')}
              </Text>
            </View>
          )}

          <Button
            label="Lưu thay đổi"
            onPress={handleSave}
            loading={updateProfile.isPending}
            style={styles.ctaBtn}
          />

          <Button
            label="Hủy"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelBtn}
          />
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
    marginBottom: 28,
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
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
  cancelBtn: { marginTop: 12 },
});
