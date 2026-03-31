import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAddressesQuery, useProfileMutations } from '@hooks/useProfile';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { ShippingAddress } from '@typings/profile';
import type { ProfileStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Addresses'>;

function AddressCard({
  address,
  onEdit,
  onDelete,
  deleting,
}: {
  address: ShippingAddress;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <View style={styles.addressCard}>
      <View style={styles.addressCardTop}>
        <View style={styles.addressLabelRow}>
          <View style={styles.labelBadge}>
            <Text style={styles.labelBadgeText}>{address.label}</Text>
          </View>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Mặc định</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionBtnText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            disabled={deleting}
            style={[styles.actionBtn, styles.deleteBtn]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {deleting ? (
              <ActivityIndicator size={12} color="#EF4444" />
            ) : (
              <Text style={styles.deleteBtnText}>Xóa</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.addressName}>
        {address.firstName} {address.lastName}
      </Text>
      {address.phone && (
        <Text style={styles.addressDetail}>{address.phone}</Text>
      )}
      <Text style={styles.addressDetail}>{address.street}</Text>
      <Text style={styles.addressDetail}>
        {address.city}, {address.state} {address.zip}
      </Text>
      <Text style={styles.addressDetail}>{address.country}</Text>
    </View>
  );
}

export function AddressesScreen() {
  const navigation = useNavigation<Nav>();
  const { data: addresses = [], isLoading: addressesLoading } = useAddressesQuery();
  const { deleteAddress } = useProfileMutations();

  function handleDelete(address: ShippingAddress) {
    Alert.alert(
      'Xóa địa chỉ',
      `Bạn có chắc muốn xóa địa chỉ "${address.label}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteAddress.mutate(address.id),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Địa chỉ giao hàng"
        onBack={() => navigation.goBack()}
        bordered
        rightContent={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddressForm', {})}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+ Thêm</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {addressesLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1A56DB" />
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptyText}>
              Thêm địa chỉ giao hàng để đặt hàng nhanh hơn.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddressForm', {})}
              style={styles.emptyAddBtn}
            >
              <Text style={styles.emptyAddBtnText}>+ Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() =>
                  navigation.navigate('AddressForm', { addressId: addr.id })
                }
                onDelete={() => handleDelete(addr)}
                deleting={
                  deleteAddress.isPending &&
                  deleteAddress.variables === addr.id
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A56DB',
  },
  scroll: { padding: 20, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  list: { gap: 12 },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  labelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minWidth: 36,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A56DB',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1A56DB',
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
