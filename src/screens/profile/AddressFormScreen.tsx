import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAddressesQuery, useProfileMutations } from '@hooks/useProfile';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import { getApiErrorMessage } from '@utils/index';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'AddressForm'>;
type Route = RouteProp<ProfileStackParamList, 'AddressForm'>;

type FormErrors = Partial<
  Record<'firstName' | 'lastName' | 'street' | 'city' | 'state' | 'zip', string>
>;

export function AddressFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { addressId } = route.params;
  const isEditing = !!addressId;

  const { data: addresses = [] } = useAddressesQuery();
  const { createAddress, updateAddress } = useProfileMutations();
  const existing = addresses.find((a) => a.id === addressId);

  const [label, setLabel] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('Việt Nam');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill form when editing
  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setPhone(existing.phone ?? '');
      setStreet(existing.street);
      setCity(existing.city);
      setState(existing.state);
      setZip(existing.zip);
      setCountry(existing.country);
      setIsDefault(existing.isDefault);
    }
  }, [existing]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = 'Tên không được để trống';
    if (!lastName.trim()) next.lastName = 'Họ không được để trống';
    if (!street.trim()) next.street = 'Địa chỉ không được để trống';
    if (!city.trim()) next.city = 'Thành phố không được để trống';
    if (!state.trim()) next.state = 'Tỉnh/Thành không được để trống';
    if (!zip.trim()) next.zip = 'Mã bưu chính không được để trống';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const data = {
      label: label.trim() || 'Nhà',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      country: country.trim() || 'Việt Nam',
      isDefault,
    };

    if (isEditing && addressId) {
      updateAddress.mutate(
        { id: addressId, data },
        {
          onSuccess: () => {
            Alert.alert('Thành công', 'Địa chỉ đã được cập nhật.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      );
    } else {
      createAddress.mutate(data, {
        onSuccess: () => {
          Alert.alert('Thành công', 'Địa chỉ đã được thêm.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      });
    }
  }

  const mutation = isEditing ? updateAddress : createAddress;
  const isPending = mutation.isPending;
  const isError = mutation.isError;
  const error = mutation.error;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={isEditing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.card}>
          <View style={styles.form}>
            <Input
              label="Nhãn (tùy chọn)"
              placeholder="Nhà, Văn phòng..."
              value={label}
              onChangeText={setLabel}
              leftIcon={<Text style={styles.icon}>🏷️</Text>}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="Tên *"
                  placeholder="Văn"
                  value={firstName}
                  onChangeText={(v) => {
                    setFirstName(v);
                    if (errors.firstName)
                      setErrors((e) => ({ ...e, firstName: undefined }));
                  }}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.flex}>
                <Input
                  label="Họ *"
                  placeholder="Nguyễn"
                  value={lastName}
                  onChangeText={(v) => {
                    setLastName(v);
                    if (errors.lastName)
                      setErrors((e) => ({ ...e, lastName: undefined }));
                  }}
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label="Số điện thoại (tùy chọn)"
              placeholder="0901 234 567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Text style={styles.icon}>📞</Text>}
            />

            <Input
              label="Địa chỉ *"
              placeholder="123 Đường Lê Lợi"
              value={street}
              onChangeText={(v) => {
                setStreet(v);
                if (errors.street)
                  setErrors((e) => ({ ...e, street: undefined }));
              }}
              error={errors.street}
              leftIcon={<Text style={styles.icon}>📍</Text>}
            />

            <Input
              label="Thành phố *"
              placeholder="Hà Nội"
              value={city}
              onChangeText={(v) => {
                setCity(v);
                if (errors.city)
                  setErrors((e) => ({ ...e, city: undefined }));
              }}
              error={errors.city}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="Tỉnh/Thành *"
                  placeholder="Hà Nội"
                  value={state}
                  onChangeText={(v) => {
                    setState(v);
                    if (errors.state)
                      setErrors((e) => ({ ...e, state: undefined }));
                  }}
                  error={errors.state}
                />
              </View>
              <View style={styles.flex}>
                <Input
                  label="Mã bưu chính *"
                  placeholder="10000"
                  value={zip}
                  onChangeText={(v) => {
                    setZip(v);
                    if (errors.zip)
                      setErrors((e) => ({ ...e, zip: undefined }));
                  }}
                  keyboardType="number-pad"
                  error={errors.zip}
                />
              </View>
            </View>

            <Input
              label="Quốc gia"
              placeholder="Việt Nam"
              value={country}
              onChangeText={setCountry}
              leftIcon={<Text style={styles.icon}>🌏</Text>}
            />

            {/* Default toggle */}
            <View style={styles.defaultRow}>
              <View style={styles.defaultInfo}>
                <Text style={styles.defaultLabel}>Đặt làm địa chỉ mặc định</Text>
                <Text style={styles.defaultHint}>
                  Địa chỉ này sẽ được chọn tự động khi đặt hàng
                </Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={isDefault ? '#1A56DB' : '#9CA3AF'}
              />
            </View>
          </View>

          {isError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {getApiErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại.')}
              </Text>
            </View>
          )}

          <Button
            label={isEditing ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            onPress={handleSave}
            loading={isPending}
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  form: { gap: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
  icon: { fontSize: 16 },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    marginTop: 4,
  },
  defaultInfo: { flex: 1 },
  defaultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  defaultHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  ctaBtn: { marginTop: 20 },
  cancelBtn: { marginTop: 10 },
});
