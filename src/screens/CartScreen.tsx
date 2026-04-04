import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { cartService } from '@services/cartService';
import { useCartStore } from '@store/cartStore';
import { formatVnd } from '@utils/index';
import type { CartItem, CouponInfo } from '@typings/cart';
import type { RootStackParamList } from '@app/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const FREE_SHIPPING_THRESHOLD = 1_200_000;
const SHIPPING_FEE = 30_000;
const TAX_RATE = 0.1;

const { width: W } = Dimensions.get('window');
const PROGRESS_W = W - 64;

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── CartItemRow ──────────────────────────────────────

interface CartItemRowProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  isUpdating,
  isRemoving,
}: CartItemRowProps) {
  const [imgError, setImgError] = useState(false);
  const { product } = item;
  const lineTotal = product.price * item.quantity;

  return (
    <View style={[IR.container, isRemoving && IR.containerFading]}>
      {/* Image */}
      <View style={IR.imgWrap}>
        {product.image && !imgError ? (
          <Image
            source={{ uri: product.image }}
            style={IR.img}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={IR.imgPlaceholder}>
            <Ionicons name="image-outline" size={26} color="#CBD5E1" />
          </View>
        )}
        {product.discount != null && product.discount > 0 && (
          <View style={IR.discountBadge}>
            <Text style={IR.discountText}>−{product.discount}%</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={IR.info}>
        {/* Top row: name + trash */}
        <View style={IR.topRow}>
          <Text style={IR.name} numberOfLines={2}>
            {product.name}
          </Text>
          <TouchableOpacity
            style={IR.deleteBtn}
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isRemoving}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Category badge */}
        {product.badge ? (
          <View style={IR.categoryBadge}>
            <Text style={IR.categoryBadgeText}>{product.badge}</Text>
          </View>
        ) : null}

        {/* Variants */}
        {(item.selectedColor || item.selectedSize) && (
          <View style={IR.variantRow}>
            {item.selectedColor ? (
              <View style={IR.variantChip}>
                <Text style={IR.variantText}>Màu: {item.selectedColor}</Text>
              </View>
            ) : null}
            {item.selectedSize ? (
              <View style={IR.variantChip}>
                <Text style={IR.variantText}>Cỡ: {item.selectedSize}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bottom row: stepper + price */}
        <View style={IR.bottomRow}>
          <View style={[IR.stepper, isUpdating && IR.stepperFading]}>
            <TouchableOpacity
              style={[IR.stepBtn, item.quantity <= 1 && IR.stepBtnDim]}
              onPress={onDecrease}
              disabled={isUpdating || item.quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={13}
                color={item.quantity <= 1 ? Colors.textMuted : Colors.text}
              />
            </TouchableOpacity>
            <Text style={IR.qty}>{item.quantity}</Text>
            <TouchableOpacity
              style={[
                IR.stepBtn,
                item.quantity >= product.stock && IR.stepBtnDim,
              ]}
              onPress={onIncrease}
              disabled={isUpdating || item.quantity >= product.stock}
            >
              <Ionicons
                name="add"
                size={13}
                color={
                  item.quantity >= product.stock
                    ? Colors.textMuted
                    : Colors.text
                }
              />
            </TouchableOpacity>
          </View>

          <View style={IR.priceWrap}>
            <Text style={IR.lineTotal}>{formatVnd(lineTotal)}</Text>
            {item.quantity > 1 && (
              <Text style={IR.unitPrice}>{formatVnd(product.price)}/sp</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── CartScreen ───────────────────────────────────────

export function CartScreen() {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.cart,
    queryFn: cartService.getCart,
  });

  const cart = data?.cart;
  const items = cart?.items ?? [];

  useEffect(() => {
    if (cart != null) {
      setItemCount(cart.itemCount);
    }
  }, [cart, setItemCount]);

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: (res) => {
      queryClient.setQueryData(QUERY_KEYS.cart, res);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: (res) => {
      queryClient.setQueryData(QUERY_KEYS.cart, res);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    },
  });

  const couponMutation = useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (res) => {
      setAppliedCoupon(res.coupon);
      setCouponDiscount(res.discount);
      setCouponError('');
      setCouponCode('');
      queryClient.setQueryData(QUERY_KEYS.cart, { cart: res.cart });
    },
    onError: (err: unknown) => {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      const msg =
        apiErr?.response?.data?.error?.message ?? 'Mã giảm giá không hợp lệ';
      setCouponError(msg);
    },
  });

  function handleQuantity(item: CartItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.product.stock) {
      Alert.alert(
        'Không đủ hàng',
        `Chỉ còn ${item.product.stock} sản phẩm trong kho`,
      );
      return;
    }
    updateMutation.mutate({ itemId: item.id, quantity: newQty });
  }

  function handleRemove(item: CartItem) {
    Alert.alert(
      'Xóa sản phẩm',
      `Bỏ "${item.product.name}" khỏi giỏ hàng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => removeMutation.mutate(item.id),
        },
      ],
    );
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    couponMutation.mutate(couponCode.trim().toUpperCase());
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }

  // ── Calculations ──
  const subtotal = cart?.subtotal ?? 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = subtotal * TAX_RATE;
  const total = subtotal - couponDiscount + shipping + tax;
  const shippingLeft = FREE_SHIPPING_THRESHOLD - subtotal;
  const progressPct = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <View style={S.header}>
          <Text style={S.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <View style={S.header}>
          <Text style={S.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={S.errorText}>Không thể tải giỏ hàng</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty ──
  if (items.length === 0) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <View style={S.header}>
          <Text style={S.headerTitle}>Giỏ hàng</Text>
        </View>
        <View style={S.center}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="bag-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={S.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={S.emptySub}>Thêm sản phẩm để bắt đầu mua sắm</Text>
          <TouchableOpacity
            style={S.exploreBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Search' })}
          >
            <Ionicons name="compass-outline" size={17} color="#fff" />
            <Text style={S.exploreBtnText}>Khám phá cửa hàng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Content ──
  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Giỏ hàng</Text>
        <Text style={S.headerCount}>{cart?.itemCount ?? 0} sản phẩm</Text>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Free shipping bar */}
        <View style={S.shippingCard}>
          <View style={S.shippingRow}>
            <Ionicons
              name="car-outline"
              size={16}
              color={shippingLeft <= 0 ? Colors.success : Colors.primary}
            />
            {shippingLeft <= 0 ? (
              <Text style={S.shippingFreeText}>
                Bạn được <Text style={S.shippingFreeBold}>miễn phí vận chuyển</Text>!
              </Text>
            ) : (
              <Text style={S.shippingText}>
                Mua thêm{' '}
                <Text style={S.shippingBold}>{formatVnd(shippingLeft)}</Text>
                {' '}để được miễn phí vận chuyển
              </Text>
            )}
          </View>
          <View style={S.progressTrack}>
            <View
              style={[S.progressFill, { width: progressPct * PROGRESS_W }]}
            />
          </View>
        </View>

        {/* Items */}
        <View style={S.itemsSection}>
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrease={() => handleQuantity(item, 1)}
              onDecrease={() => handleQuantity(item, -1)}
              onRemove={() => handleRemove(item)}
              isUpdating={
                updateMutation.isPending &&
                updateMutation.variables?.itemId === item.id
              }
              isRemoving={
                removeMutation.isPending && removeMutation.variables === item.id
              }
            />
          ))}
        </View>

        {/* Coupon */}
        <View style={S.couponSection}>
          <Text style={S.couponLabel}>Mã giảm giá</Text>
          {appliedCoupon ? (
            <View style={S.couponApplied}>
              <Ionicons name="pricetag" size={15} color={Colors.success} />
              <Text style={S.couponCode}>{appliedCoupon.code}</Text>
              <Text style={S.couponSaving}>−{formatVnd(couponDiscount)}</Text>
              <TouchableOpacity
                onPress={handleRemoveCoupon}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={S.couponRow}>
                <TextInput
                  style={S.couponInput}
                  placeholder="Nhập mã giảm giá"
                  placeholderTextColor={Colors.textMuted}
                  value={couponCode}
                  onChangeText={(t) => {
                    setCouponCode(t);
                    setCouponError('');
                  }}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleApplyCoupon}
                />
                <TouchableOpacity
                  style={[
                    S.couponBtn,
                    (!couponCode.trim() || couponMutation.isPending) &&
                      S.couponBtnDim,
                  ]}
                  onPress={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponMutation.isPending}
                >
                  {couponMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={S.couponBtnText}>Áp dụng</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponError ? (
                <Text style={S.couponError}>{couponError}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Order summary */}
        <View style={S.summary}>
          <Text style={S.summaryTitle}>Tóm tắt đơn hàng</Text>

          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Tạm tính</Text>
            <Text style={S.summaryValue}>
              {items.length} sản phẩm · {formatVnd(subtotal)}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Giảm giá</Text>
              <Text style={[S.summaryValue, S.saving]}>
                −{formatVnd(couponDiscount)}
              </Text>
            </View>
          )}

          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Vận chuyển</Text>
            {shipping === 0 ? (
              <View style={S.freeBadge}>
                <Text style={S.freeBadgeText}>MIỄN PHÍ</Text>
              </View>
            ) : (
              <Text style={S.summaryValue}>{formatVnd(shipping)}</Text>
            )}
          </View>

          <View style={S.summaryRow}>
            <Text style={S.summaryLabel}>Thuế (10%)</Text>
            <Text style={S.summaryValue}>{formatVnd(tax)}</Text>
          </View>

          <View style={S.divider} />

          <View style={S.summaryRow}>
            <Text style={S.totalLabel}>Tổng cộng</Text>
            <Text style={S.totalValue}>{formatVnd(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky checkout */}
      <View style={S.checkoutBar}>
        <TouchableOpacity
          style={S.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.85}
        >
          <Text style={S.checkoutBtnText}>Tiến hành thanh toán</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles: CartItemRow ──────────────────────────────

const IR = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    ...Shadows.card,
  },
  containerFading: {
    opacity: 0.5,
  },
  imgWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.danger,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  variantChip: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variantText: {
    fontSize: 10,
    color: Colors.textSub,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepperFading: {
    opacity: 0.6,
  },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDim: {
    opacity: 0.4,
  },
  qty: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  priceWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  unitPrice: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

// ─── Styles: CartScreen ───────────────────────────────

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerCount: {
    fontSize: 13,
    color: Colors.textSub,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSub,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    ...Shadows.button,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Free shipping
  shippingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    ...Shadows.card,
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shippingText: {
    fontSize: 13,
    color: Colors.textSub,
    flex: 1,
  },
  shippingBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  shippingFreeText: {
    fontSize: 13,
    color: Colors.success,
    flex: 1,
  },
  shippingFreeBold: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  // Items
  itemsSection: {
    marginBottom: 12,
  },

  // Coupon
  couponSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    ...Shadows.card,
  },
  couponLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  couponCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  couponSaving: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  couponBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBtnDim: {
    opacity: 0.5,
  },
  couponBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  couponError: {
    fontSize: 12,
    color: Colors.danger,
  },

  // Summary
  summary: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSub,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  saving: {
    color: Colors.success,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Checkout bar
  checkoutBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.card,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 15,
    ...Shadows.button,
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
