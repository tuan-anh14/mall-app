import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileQuery, useProfileMutations } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { IonIconGlyph } from '@components/ui/IonIconGlyph';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();
  const { updateProfile } = useProfileMutations();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  // Pre-fill once profile loads
  useEffect(() => {
    if (profile && !hydrated) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? '');
      setHydrated(true);
    }
  }, [profile, hydrated]);

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
        <ScreenHeader title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(firstName[0] ?? profile?.firstName?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {profileLoading && !hydrated ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1A56DB" />
              <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label="Tên"
                placeholder="Nguyễn"
                value={firstName}
                onChangeText={(v) => {
                  setFirstName(v);
                  if (errors.firstName)
                    setErrors((e) => ({ ...e, firstName: undefined }));
                }}
                autoCapitalize="words"
                error={errors.firstName}
                leftIcon={<IonIconGlyph name="person-outline" />}
              />

              <Input
                label="Họ (và tên đệm)"
                placeholder="Văn A"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                leftIcon={<IonIconGlyph name="person-outline" />}
              />

              <Input
                label="Số điện thoại (tùy chọn)"
                placeholder="0901 234 567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon={<IonIconGlyph name="call-outline" />}
              />
            </View>
          )}

          {updateProfile.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(
                  updateProfile.error,
                  'Cập nhật thất bại. Vui lòng thử lại.',
                )}
              </Text>
            </View>
          )}

          <Button
            label="Lưu thay đổi"
            onPress={handleSave}
            loading={updateProfile.isPending}
            disabled={profileLoading && !hydrated}
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
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
  cancelBtn: { marginTop: 12 },
});
