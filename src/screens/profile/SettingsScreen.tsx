import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsQuery, useProfileMutations } from '@hooks/useProfile';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { UpdateSettingsDto, UserSettings } from '@typings/profile';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

function SettingToggle({
  label,
  hint,
  value,
  onToggle,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint && <Text style={styles.toggleHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={value ? '#1A56DB' : '#9CA3AF'}
      />
    </View>
  );
}

function OptionSelector({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionButtons}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            style={[
              styles.optionBtn,
              value === opt.value && styles.optionBtnActive,
            ]}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionBtnText,
                value === opt.value && styles.optionBtnTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: settings, isLoading: settingsLoading } = useSettingsQuery();
  const { updateSettings } = useProfileMutations();

  function toggle(field: keyof UpdateSettingsDto, current: boolean) {
    updateSettings.mutate({ [field]: !current });
  }

  function select(field: keyof UpdateSettingsDto, value: string) {
    updateSettings.mutate({ [field]: value });
  }

  const s = settings as UserSettings | undefined;
  const disabled = updateSettings.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Cài đặt" onBack={() => navigation.goBack()} bordered />

      {settingsLoading || !s ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông báo</Text>
            <View style={styles.card}>
              <SettingToggle
                label="Thông báo email"
                hint="Nhận thông báo qua email"
                value={s.emailNotifications}
                onToggle={() => toggle('emailNotifications', s.emailNotifications)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <SettingToggle
                label="Cập nhật đơn hàng"
                hint="Thông báo khi đơn hàng thay đổi trạng thái"
                value={s.orderUpdates}
                onToggle={() => toggle('orderUpdates', s.orderUpdates)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <SettingToggle
                label="Email khuyến mãi"
                hint="Nhận ưu đãi và deal đặc biệt"
                value={s.promotionalEmails}
                onToggle={() => toggle('promotionalEmails', s.promotionalEmails)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <SettingToggle
                label="Cảnh báo giảm giá"
                hint="Khi sản phẩm trong wishlist giảm giá"
                value={s.priceDropAlerts}
                onToggle={() => toggle('priceDropAlerts', s.priceDropAlerts)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <SettingToggle
                label="Thông báo đẩy"
                hint="Thông báo trực tiếp trên thiết bị"
                value={s.pushNotifications}
                onToggle={() => toggle('pushNotifications', s.pushNotifications)}
                disabled={disabled}
              />
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tùy chọn</Text>
            <View style={styles.card}>
              <OptionSelector
                label="Ngôn ngữ"
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'vi', label: 'VI' },
                  { value: 'fr', label: 'FR' },
                  { value: 'de', label: 'DE' },
                ]}
                value={s.language}
                onChange={(v) => select('language', v)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <OptionSelector
                label="Tiền tệ"
                options={[
                  { value: 'usd', label: 'USD' },
                  { value: 'eur', label: 'EUR' },
                  { value: 'gbp', label: 'GBP' },
                  { value: 'jpy', label: 'JPY' },
                ]}
                value={s.currency}
                onChange={(v) => select('currency', v)}
                disabled={disabled}
              />
              <View style={styles.divider} />
              <SettingToggle
                label="Gợi ý sản phẩm"
                hint="Hiển thị sản phẩm được đề xuất cho bạn"
                value={s.showRecommendations}
                onToggle={() => toggle('showRecommendations', s.showRecommendations)}
                disabled={disabled}
              />
            </View>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bảo mật</Text>
            <View style={styles.card}>
              <SettingToggle
                label="Xác thực 2 bước"
                hint="Tăng cường bảo mật tài khoản"
                value={s.twoFactorEnabled}
                onToggle={() => toggle('twoFactorEnabled', s.twoFactorEnabled)}
                disabled={disabled}
              />
            </View>
          </View>

          {updateSettings.isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                Lưu cài đặt thất bại. Vui lòng thử lại.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  optionRow: {
    paddingVertical: 14,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 10,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionBtnTextActive: {
    color: '#1A56DB',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
});
