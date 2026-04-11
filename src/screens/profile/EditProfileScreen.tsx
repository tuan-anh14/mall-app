import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StatusBar,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileQuery, useProfileMutations } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { IonIconGlyph } from '@components/ui/IonIconGlyph';
import { useAuth } from '@hooks/useAuth';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();
  const { updateProfile, uploadAvatar } = useProfileMutations();

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

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập',
          'Vui lòng cho phép truy cập thư viện ảnh để đổi ảnh đại diện.',
        );
        return;
      }

      // Ensure keyboard is closed to avoid layout shifts
      Keyboard.dismiss();

      // Temporarily hide status bar to prevent overlay issues on some devices
      StatusBar.setHidden(true, 'fade');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Slightly lower than 1 to ensure smoother processing on both platforms
        selectionLimit: 1,
        allowsMultipleSelection: false,
      });

      // Restore status bar
      StatusBar.setHidden(false, 'fade');

      if (!result.canceled) {
        const asset = result.assets[0];

        // Format for React Native FormData
        const file = {
          uri: asset.uri,
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        };

        uploadAvatar.mutate(file, {
          onError: (err) => {
            Alert.alert(
              'Lỗi',
              getApiErrorMessage(err, 'Không thể tải lên ảnh đại diện.'),
            );
          },
        });
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi chọn ảnh.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Chỉnh sửa hồ sơ" onBack={() => navigation.goBack()} />

        <Text style={styles.screenDescription}>
          Cập nhật thông tin tài khoản và thông tin liên hệ của bạn để hoàn thiện hồ sơ.
        </Text>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploadAvatar.isPending}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {uploadAvatar.isPending ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {(firstName[0] ?? profile?.firstName?.[0] ?? '?').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.editIconBadge}>
              <IonIconGlyph name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
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
  screenDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    resizeMode: 'cover',
  },
  editIconBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#1A56DB',
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F0F5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
