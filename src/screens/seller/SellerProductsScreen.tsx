import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerProductService } from '@services/sellerProductService';
import { formatVnd } from '@utils/index';
import type { SellerProduct } from '@typings/seller';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  ACTIVE:      { text: '#059669', bg: '#ECFDF5' },
  INACTIVE:    { text: '#6B7280', bg: '#F3F4F6' },
  OUT_OF_STOCK:{ text: '#D97706', bg: '#FFFBEB' },
  DRAFT:       { text: '#6B7280', bg: '#F3F4F6' },
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang bán',
  INACTIVE: 'Tạm ngừng',
  OUT_OF_STOCK: 'Hết hàng',
  DRAFT: 'Nháp',
};

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: SellerProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const mainImage =
    (product.images as any)?.find((img: any) => img.isPrimary)?.url ??
    (product.images as any)?.[0]?.url ??
    null;
  const statusStyle = STATUS_COLORS[product.status] ?? STATUS_COLORS.DRAFT;

  return (
    <View style={PR.container}>
      <View style={PR.imgWrap}>
        {mainImage && !imgError ? (
          <Image
            source={{ uri: mainImage }}
            style={PR.img}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={PR.imgPlaceholder}>
            <Ionicons name="image-outline" size={26} color="#CBD5E1" />
          </View>
        )}
      </View>

      <View style={PR.info}>
        <Text style={PR.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={PR.price}>{formatVnd(product.price)}</Text>
        <View style={PR.metaRow}>
          <View style={[PR.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[PR.statusText, { color: statusStyle.text }]}>
              {STATUS_LABEL[product.status] ?? product.status}
            </Text>
          </View>
          <Text style={PR.stock}>Kho: {product.stock}</Text>
        </View>
      </View>

      <View style={PR.actions}>
        <TouchableOpacity
          style={PR.editBtn}
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={PR.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SellerProductsScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.sellerProducts(debouncedSearch),
    queryFn: () => sellerProductService.getProducts(debouncedSearch || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sellerProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerProducts() });
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
    },
  });

  function handleDelete(product: SellerProduct) {
    Alert.alert(
      'Xóa sản phẩm',
      `Bạn có chắc muốn xóa "${product.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(product.id),
        },
      ],
    );
  }

  function handleSearchSubmit() {
    setDebouncedSearch(search);
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Sản phẩm</Text>
        <TouchableOpacity
          style={S.addBtn}
          onPress={() => navigation.navigate('SellerProductForm', {})}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={S.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={S.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm sản phẩm..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        {search ? (
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              setDebouncedSearch('');
            }}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={S.errorText}>Không thể tải sản phẩm</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onEdit={() =>
                navigation.navigate('SellerProductForm', { productId: item.id })
              }
              onDelete={() => handleDelete(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={S.separator} />}
          contentContainerStyle={
            products.length === 0 ? S.emptyContent : S.listContent
          }
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}>
                <Ionicons name="cube-outline" size={56} color={Colors.primary} />
              </View>
              <Text style={S.emptyTitle}>Chưa có sản phẩm</Text>
              <Text style={S.emptySub}>Thêm sản phẩm đầu tiên để bắt đầu bán hàng</Text>
              <TouchableOpacity
                style={S.emptyAddBtn}
                onPress={() => navigation.navigate('SellerProductForm', {})}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={S.emptyAddText}>Thêm sản phẩm</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={false}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const PR = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  imgWrap: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 5 },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stock: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actions: {
    gap: 10,
    paddingTop: 4,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { fontSize: 15, color: Colors.textSub },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { paddingVertical: 8 },
  emptyContent: { flex: 1 },
  separator: { height: 1, backgroundColor: Colors.border },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSub,
    textAlign: 'center',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    ...Shadows.button,
  },
  emptyAddText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
