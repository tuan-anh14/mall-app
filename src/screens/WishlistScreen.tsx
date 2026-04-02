import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { wishlistService } from '@services/wishlistService';
import { cartService } from '@services/cartService';
import { useCartStore } from '@store/cartStore';
import { formatVnd } from '@utils/index';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { RootStackParamList } from '@app/navigation/types';
import type { WishlistItem } from '@typings/wishlist';

// ─── Layout ───────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const GAP    = 12;
const PAD    = 12;
const CARD_W = (W - PAD * 2 - GAP) / 2;

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Empty ────────────────────────────────────────────

function EmptyWishlist() {
  return (
    <View style={S.empty}>
      <View style={S.emptyIcon}>
        <Ionicons name="heart-outline" size={52} color={Colors.danger} />
      </View>
      <Text style={S.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
      <Text style={S.emptySub}>Nhấn biểu tượng ❤ trên sản phẩm để lưu vào đây</Text>
    </View>
  );
}

// ─── Skeleton card ────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={[S.card, { width: CARD_W }]}>
      <View style={[S.cardImg, { backgroundColor: '#E5E7EB' }]} />
      <View style={S.cardBody}>
        <View style={{ height: 11, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 6, width: '50%' }} />
        <View style={{ height: 13, backgroundColor: '#E5E7EB', borderRadius: 6, marginBottom: 4 }} />
        <View style={{ height: 13, backgroundColor: '#E5E7EB', borderRadius: 6, width: '80%', marginBottom: 8 }} />
        <View style={{ height: 15, backgroundColor: '#E5E7EB', borderRadius: 6, width: '45%' }} />
      </View>
    </View>
  );
}

// ─── Item card ────────────────────────────────────────

interface ItemCardProps {
  item: WishlistItem;
  onNavigate: (id: string) => void;
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  removingId: string | null;
  addingId: string | null;
}

function ItemCard({ item, onNavigate, onRemove, onAddToCart, removingId, addingId }: ItemCardProps) {
  const { product } = item;
  const hasDiscount = product.originalPrice != null && product.originalPrice > product.price;
  const isRemoving  = removingId === item.productId;
  const isAdding    = addingId === item.productId;
  const isOOS       = product.status === 'OUT_OF_STOCK';

  return (
    <TouchableOpacity
      style={[S.card, { width: CARD_W }]}
      activeOpacity={0.92}
      onPress={() => onNavigate(product.id)}
    >
      {/* Image */}
      <View style={S.cardImg}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={S.imgPlaceholder}>
            <Ionicons name="image-outline" size={28} color="#CBD5E1" />
          </View>
        )}

        {product.discount != null && product.discount > 0 && (
          <View style={S.discBadge}>
            <Text style={S.discText}>−{product.discount}%</Text>
          </View>
        )}

        {isOOS && (
          <View style={S.oosBadge}>
            <Text style={S.oosText}>Hết hàng</Text>
          </View>
        )}

        <TouchableOpacity
          style={S.removeBtn}
          onPress={() => onRemove(item.productId)}
          disabled={isRemoving}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {isRemoving
            ? <ActivityIndicator size="small" color={Colors.danger} />
            : <Ionicons name="heart" size={18} color={Colors.danger} />}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={S.cardBody}>
        {product.category ? (
          <Text style={S.catText} numberOfLines={1}>{product.category}</Text>
        ) : null}
        <Text style={S.nameText} numberOfLines={2}>{product.name}</Text>
        <View style={S.priceRow}>
          <Text style={S.price}>{formatVnd(product.price)}</Text>
          {hasDiscount && (
            <Text style={S.originalPrice}>{formatVnd(product.originalPrice!)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[S.addBtn, (isOOS || isAdding) && S.addBtnDim]}
          onPress={() => onAddToCart(item.productId)}
          disabled={isOOS || isAdding}
          activeOpacity={0.8}
        >
          {isAdding
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Ionicons name="cart-outline" size={13} color="#fff" />
                <Text style={S.addBtnText}>{isOOS ? 'Hết hàng' : 'Thêm giỏ'}</Text>
              </>
            )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────

export function WishlistScreen() {
  const nav = useNavigation<Nav>();
  const qc  = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId,   setAddingId]   = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.wishlist,
    queryFn:  wishlistService.getWishlist,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.removeItem(productId),
    onMutate:   (id) => setRemovingId(id),
    onSettled:  () => setRemovingId(null),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
    },
    onError: () => Alert.alert('Lỗi', 'Không thể xóa khỏi danh sách yêu thích'),
  });

  const addCartMutation = useMutation({
    mutationFn: (productId: string) => cartService.addItem(productId, 1),
    onMutate:   (id) => setAddingId(id),
    onSettled:  () => setAddingId(null),
    onSuccess:  (res) => {
      setItemCount(res.cart.itemCount);
      Alert.alert('Đã thêm', 'Sản phẩm đã được thêm vào giỏ hàng');
    },
    onError: () => Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng'),
  });

  const items = data?.items ?? [];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScreenHeader
        title={`Yêu thích${items.length > 0 ? ` (${items.length})` : ''}`}
        onBack={() => nav.goBack()}
      />

      {isLoading ? (
        <View style={S.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : items.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={S.row}
          contentContainerStyle={S.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onNavigate={(id) => nav.navigate('ProductDetail', { productId: id })}
              onRemove={(id) => removeMutation.mutate(id)}
              onAddToCart={(id) => addCartMutation.mutate(id)}
              removingId={removingId}
              addingId={addingId}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: Colors.textSub, textAlign: 'center', lineHeight: 19 },

  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GAP, padding: PAD,
  },
  listContent: { padding: PAD, paddingBottom: 32 },
  row:         { gap: GAP, marginBottom: GAP },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardImg: {
    width: '100%',
    height: CARD_W,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  imgPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  discBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: Colors.danger,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
  },
  discText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  oosBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  oosText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  cardBody:  { padding: 10, gap: 4 },
  catText:   { fontSize: 10, fontWeight: '600', color: Colors.primary, textTransform: 'uppercase' },
  nameText:  { fontSize: 12, fontWeight: '600', color: Colors.text, lineHeight: 17 },
  priceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  price:     { fontSize: 14, fontWeight: '800', color: Colors.primary },
  originalPrice: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: 4,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 7,
  },
  addBtnDim:  { opacity: 0.5 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
