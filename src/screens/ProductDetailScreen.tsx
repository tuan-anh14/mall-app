import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  Share,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { productService } from '@services/productService';
import { reviewService } from '@services/reviewService';
import { wishlistService } from '@services/wishlistService';
import { viewHistoryService } from '@services/viewHistoryService';
import { cartService } from '@services/cartService';
import { chatService } from '@services/chatService';
import { useCartStore } from '@store/cartStore';
import { formatVnd } from '@utils/index';
import { ProductCard } from '@components/product/ProductCard';
import type { RootStackParamList } from '@app/navigation/types';
import type { Review } from '@typings/review';

// ─── Constants ────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const IMAGE_H = W;
const CARD_W = (W - 12 * 2 - 12) / 2;
const EMOJIS = ['😍', '🥰', '😊', '😐', '😔'];

const TRUST_ITEMS = [
  { icon: 'car-outline',               title: 'Miễn phí vận chuyển', sub: 'Đơn > 500.000 ₫' },
  { icon: 'shield-checkmark-outline',  title: 'Thanh toán an toàn',  sub: 'Bảo mật SSL 256-bit' },
  { icon: 'refresh-circle-outline',    title: 'Đổi trả 30 ngày',     sub: 'Hoàn tiền nhanh' },
  { icon: 'headset-outline',           title: 'Hỗ trợ 24/7',         sub: 'Chat trực tiếp' },
] as const;

// ─── Helpers ──────────────────────────────────────────

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} ngày trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Sub-components ───────────────────────────────────

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.floor(rating) ? 'star' : s - rating < 1 ? 'star-half' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? count / total : 0;
  return (
    <View style={RB.row}>
      <Text style={RB.label}>{star}</Text>
      <Ionicons name="star" size={11} color="#F59E0B" />
      <View style={RB.track}>
        <View style={[RB.fill, { width: `${pct * 100}%` as `${number}%` }]} />
      </View>
      <Text style={RB.count}>{count}</Text>
    </View>
  );
}

const RB = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  label: { width: 10, fontSize: 12, color: Colors.textSub, textAlign: 'right' },
  track: { flex: 1, height: 6, backgroundColor: Colors.bg, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 6, backgroundColor: '#F59E0B', borderRadius: 3 },
  count: { width: 28, fontSize: 11, color: Colors.textMuted },
});

function BlinkDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706', opacity }}
    />
  );
}

interface ReviewCardProps {
  review: Review;
  onHelpful: () => void;
  onReply: () => void;
  isReplying: boolean;
  replyText: string;
  onReplyChange: (t: string) => void;
  onReplySubmit: () => void;
  isSubmittingReply: boolean;
  replyModError?: string | null;
  onClearReplyError?: () => void;
}

function ReviewCard({
  review,
  onHelpful,
  onReply,
  isReplying,
  replyText,
  onReplyChange,
  onReplySubmit,
  isSubmittingReply,
  replyModError,
  onClearReplyError,
}: ReviewCardProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const firstReply   = review.replies[0] ?? null;
  const extraReplies = review.replies.slice(1);

  return (
    <View style={RC.card}>
      {/* Header */}
      <View style={RC.header}>
        <View style={RC.avatarWrap}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={RC.avatar} />
          ) : (
            <View style={RC.avatarPlaceholder}>
              <Text style={RC.avatarText}>{initials(review.user?.name)}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={RC.name}>{review.user?.name ?? 'Người dùng ẩn danh'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StarRow rating={review.rating} size={12} />
            {review.emoji ? <Text style={{ fontSize: 14 }}>{review.emoji}</Text> : null}
          </View>
        </View>
        <Text style={RC.time}>{timeAgo(review.createdAt)}</Text>
      </View>

      {/* Comment */}
      {review.comment ? <Text style={RC.comment}>{review.comment}</Text> : null}

      {/* Images */}
      {review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {review.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={RC.reviewImg} />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Actions */}
      <View style={RC.actions}>
        <TouchableOpacity style={RC.actionBtn} onPress={onHelpful}>
          <Ionicons name="thumbs-up-outline" size={14} color={Colors.textSub} />
          <Text style={RC.actionText}>Hữu ích ({review.helpful})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={RC.actionBtn} onPress={onReply}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.textSub} />
          <Text style={RC.actionText}>Phản hồi</Text>
        </TouchableOpacity>
      </View>

      {/* First reply — always visible */}
      {firstReply && (
        <View style={RC.reply}>
          <View style={RC.replyAvatarWrap}>
            {firstReply.user?.avatar ? (
              <Image source={{ uri: firstReply.user.avatar }} style={RC.replyAvatar} />
            ) : (
              <View style={RC.replyAvatarPlaceholder}>
                <Text style={RC.replyAvatarText}>{initials(firstReply.user?.name)}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={RC.replyName}>{firstReply.user?.name ?? 'Ẩn danh'}</Text>
            <Text style={RC.replyComment}>{firstReply.comment}</Text>
            <Text style={RC.replyTime}>{timeAgo(firstReply.createdAt)}</Text>
          </View>
        </View>
      )}

      {/* Extra replies */}
      {showAllReplies && extraReplies.map((reply) => (
        <View key={reply.id} style={RC.reply}>
          <View style={RC.replyAvatarWrap}>
            {reply.user?.avatar ? (
              <Image source={{ uri: reply.user.avatar }} style={RC.replyAvatar} />
            ) : (
              <View style={RC.replyAvatarPlaceholder}>
                <Text style={RC.replyAvatarText}>{initials(reply.user?.name)}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={RC.replyName}>{reply.user?.name ?? 'Ẩn danh'}</Text>
            <Text style={RC.replyComment}>{reply.comment}</Text>
            <Text style={RC.replyTime}>{timeAgo(reply.createdAt)}</Text>
          </View>
        </View>
      ))}

      {/* Toggle extra replies */}
      {extraReplies.length > 0 && (
        <TouchableOpacity
          style={RC.showMoreBtn}
          onPress={() => setShowAllReplies((v) => !v)}
        >
          <Text style={RC.showMoreText}>
            {showAllReplies
              ? 'Ẩn bớt'
              : `Xem thêm ${extraReplies.length} phản hồi`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Reply form */}
      {isReplying && (
        <View style={RC.replyForm}>
          {replyModError && (
            <View style={RC.modErrorBanner}>
              <Ionicons name="warning-outline" size={14} color={Colors.danger} />
              <Text style={RC.modErrorText}>{replyModError}</Text>
            </View>
          )}
          <TextInput
            style={[RC.replyInput, replyModError ? RC.inputError : null]}
            placeholder="Viết phản hồi..."
            placeholderTextColor={Colors.textMuted}
            value={replyText}
            onChangeText={(t) => { onReplyChange(t); onClearReplyError?.(); }}
            multiline
          />
          <View style={RC.replyFormActions}>
            <TouchableOpacity onPress={onReply}>
              <Text style={RC.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[RC.sendBtn, (!replyText.trim() || isSubmittingReply) && RC.sendBtnDim]}
              onPress={onReplySubmit}
              disabled={!replyText.trim() || isSubmittingReply}
            >
              {isSubmittingReply
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={RC.sendText}>Gửi</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const RC = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  avatarWrap: { width: 38, height: 38 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  name: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  time: { fontSize: 11, color: Colors.textMuted },
  comment: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  reviewImg: { width: 72, height: 72, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Colors.textSub },
  reply: {
    flexDirection: 'row', gap: 8, marginTop: 10,
    paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.border,
  },
  replyAvatarWrap: { width: 28, height: 28 },
  replyAvatar: { width: 28, height: 28, borderRadius: 14 },
  replyAvatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  replyAvatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  replyName: { fontSize: 12, fontWeight: '700', color: Colors.text },
  replyComment: { fontSize: 12, color: Colors.textSub, lineHeight: 17 },
  replyTime: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  replyForm: { marginTop: 10, gap: 8 },
  replyInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 10, fontSize: 13, color: Colors.text, minHeight: 60,
  },
  replyFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, alignItems: 'center' },
  cancelText: { fontSize: 13, color: Colors.textSub },
  sendBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: Colors.primary, borderRadius: 8,
  },
  sendBtnDim: { opacity: 0.5 },
  sendText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  showMoreBtn: { marginTop: 6, paddingLeft: 12 },
  showMoreText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  inputError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  modErrorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  modErrorText: { flex: 1, fontSize: 12, color: Colors.danger, lineHeight: 17 },
});

// ─── ProductDetailScreen ──────────────────────────────

type RouteT = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavT   = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen() {
  const route     = useRoute<RouteT>();
  const nav       = useNavigation<NavT>();
  const insets    = useSafeAreaInsets();
  const qc        = useQueryClient();
  const { productId } = route.params;

  const HEADER_H   = insets.top + 52;
  const BOTTOM_H   = insets.bottom + 72;

  // ── Animated scroll ──
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerBg = scrollY.interpolate({
    inputRange: [0, IMAGE_H * 0.45],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [IMAGE_H * 0.4, IMAGE_H * 0.7],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── State ──
  const [activeImg, setActiveImg] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize]   = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [reviewPage, setReviewPage] = useState(1);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rFormRating, setRFormRating] = useState(5);
  const [rFormEmoji, setRFormEmoji]   = useState<string | null>(null);
  const [rFormText, setRFormText]     = useState('');
  const [reviewModError, setReviewModError] = useState<string | null>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText]   = useState('');
  const [replyModError, setReplyModError] = useState<string | null>(null);

  const imgListRef = useRef<FlatList>(null);
  const setItemCount = useCartStore((s) => s.setItemCount);

  // ── Queries ──
  const { data: product, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.product(productId),
    queryFn: () => productService.getProductById(productId),
  });

  const { data: wishlistData, refetch: refetchWishlist } = useQuery({
    queryKey: QUERY_KEYS.wishlistCheck(productId),
    queryFn: () => wishlistService.checkItem(productId),
    enabled: !!product,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: QUERY_KEYS.reviews(productId, reviewPage),
    queryFn: () => reviewService.getProductReviews(productId, { page: reviewPage, limit: 5 }),
    enabled: activeTab === 'reviews',
  });

  const { data: eligibility } = useQuery({
    queryKey: ['review-check', productId],
    queryFn: () => reviewService.checkUserReview(productId),
    enabled: activeTab === 'reviews',
  });

  const { data: relatedProducts } = useQuery({
    queryKey: QUERY_KEYS.related(productId),
    queryFn: () => productService.getRelatedProducts(productId),
    enabled: !!product,
  });

  const { data: similarProducts } = useQuery({
    queryKey: QUERY_KEYS.similar(productId),
    queryFn: () => productService.getSimilarProducts(productId),
    enabled: !!product,
  });

  // Track view history
  useEffect(() => {
    viewHistoryService.trackView(productId).catch(() => {});
  }, [productId]);

  const inWishlist = wishlistData?.inWishlist ?? false;

  // ── Mutations ──
  const addCartMutation = useMutation({
    mutationFn: () =>
      cartService.addItem(
        productId,
        qty,
        selectedColor ?? undefined,
        selectedSize ?? undefined,
      ),
    onSuccess: (res) => {
      setItemCount(res.cart.itemCount);
      Alert.alert('Đã thêm vào giỏ', `${product?.name} × ${qty}`);
      qc.setQueryData(QUERY_KEYS.cart, res);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Không thể thêm vào giỏ';
      Alert.alert('Lỗi', msg);
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () =>
      inWishlist
        ? wishlistService.removeItem(productId)
        : wishlistService.addItem(productId),
    onSuccess: () => refetchWishlist(),
  });

  const chatMutation = useMutation({
    mutationFn: (sellerId: string) => chatService.createConversation(sellerId),
    onSuccess: (conversation) => {
      nav.navigate('ChatRoom', {
        conversationId: conversation.id,
        sellerName: conversation.sellerName,
        sellerAvatar: conversation.sellerAvatar,
      });
    },
    onError: () => {
      Alert.alert('Lỗi', 'Không thể mở hộp thư. Vui lòng thử lại.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewService.createReview({
        productId,
        rating: rFormRating,
        emoji: rFormEmoji ?? undefined,
        comment: rFormText.trim() || undefined,
      }),
    onSuccess: () => {
      setShowReviewForm(false);
      setRFormRating(5);
      setRFormEmoji(null);
      setRFormText('');
      setReviewModError(null);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.reviews(productId, reviewPage) });
      qc.invalidateQueries({ queryKey: ['review-check', productId] });
    },
    onError: (err: any) => {
      const msg: string =
        err?.response?.data?.error?.message ?? err?.message ?? 'Không thể gửi đánh giá';
      if (msg.includes('vi phạm')) {
        setReviewModError(msg);
      } else {
        Alert.alert('Lỗi', msg);
      }
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: (id: string) => reviewService.markHelpful(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.reviews(productId, reviewPage) });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      reviewService.createReply(id, text),
    onSuccess: () => {
      setReplyingTo(null);
      setReplyText('');
      setReplyModError(null);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.reviews(productId, reviewPage) });
    },
    onError: (err: any) => {
      const msg: string =
        err?.response?.data?.error?.message ?? err?.message ?? 'Không thể gửi phản hồi';
      if (msg.includes('vi phạm')) {
        setReplyModError(msg);
      } else {
        Alert.alert('Lỗi', msg);
      }
    },
  });

  // ── Handlers ──
  const handleShare = useCallback(async () => {
    if (!product) return;
    await Share.share({ message: `Xem sản phẩm: ${product.name} — ${formatVnd(product.price)}` });
  }, [product]);

  function goToImage(idx: number) {
    setActiveImg(idx);
    imgListRef.current?.scrollToIndex({ index: idx, animated: true });
  }

  function handleAddToCart() {
    if (!product) return;
    if (product.colors.length > 0 && !selectedColor) {
      Alert.alert('Chọn màu', 'Vui lòng chọn màu sắc trước khi thêm vào giỏ.');
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      Alert.alert('Chọn kích cỡ', 'Vui lòng chọn kích cỡ trước khi thêm vào giỏ.');
      return;
    }
    addCartMutation.mutate();
  }

  function toggleReply(id: string) {
    setReplyingTo((prev) => (prev === id ? null : id));
    setReplyText('');
    setReplyModError(null);
  }

  // ── Loading/Error states ──
  if (isLoading) {
    return (
      <View style={[S.safe, { paddingTop: insets.top }]}>
        <TouchableOpacity style={S.backBtnFloat} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[S.safe, { paddingTop: insets.top }]}>
        <TouchableOpacity style={S.backBtnFloat} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={S.errorText}>Không tải được sản phẩm</Text>
        </View>
      </View>
    );
  }

  const allImages = product.images.length > 0
    ? product.images.map((i) => i.url)
    : product.image
      ? [product.image]
      : [];

  const hasDiscount = product.originalPrice != null && product.originalPrice > product.price;
  const isLowStock  = product.stock > 0 && product.stock < 10;

  const reviews   = reviewsData?.reviews ?? [];
  const summary   = reviewsData?.summary;

  // ── Render ──
  return (
    <View style={[S.safe, { backgroundColor: Colors.bg }]}>
      {/* ── Animated Header ── */}
      <Animated.View
        style={[S.header, { paddingTop: insets.top, height: HEADER_H, backgroundColor: headerBg }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={S.headerIconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        <Animated.Text style={[S.headerTitle, { opacity: titleOpacity }]} numberOfLines={1}>
          {product.name}
        </Animated.Text>

        <View style={S.headerRight}>
          <TouchableOpacity style={S.headerIconBtn} onPress={() => wishlistMutation.mutate()}>
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={20}
              color={inWishlist ? Colors.danger : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={S.headerIconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Main Scroll ── */}
      <Animated.ScrollView
        style={S.scroll}
        contentContainerStyle={[S.scrollContent, { paddingBottom: BOTTOM_H + 16 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* ── 1. Image Gallery ── */}
        <View style={S.galleryWrap}>
          {allImages.length > 0 ? (
            <FlatList
              ref={imgListRef}
              data={allImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onScrollToIndexFailed={() => {}}
              onMomentumScrollEnd={(e) => {
                setActiveImg(Math.round(e.nativeEvent.contentOffset.x / W));
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => setZoomVisible(true)}
                  style={{ width: W, height: IMAGE_H }}
                >
                  <Image source={{ uri: item }} style={S.mainImage} resizeMode="cover" />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={S.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#CBD5E1" />
            </View>
          )}

          {/* Discount badge */}
          {product.discount != null && product.discount > 0 && (
            <View style={S.discountBadge}>
              <Text style={S.discountText}>−{product.discount}%</Text>
            </View>
          )}

          {/* Image indicator dots */}
          {allImages.length > 1 && (
            <View style={S.dotsRow}>
              {allImages.map((_, i) => (
                <View key={i} style={[S.dot, i === activeImg && S.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <View style={S.thumbnailRow}>
            {allImages.slice(0, 4).map((uri, i) => (
              <TouchableOpacity
                key={i}
                style={[S.thumbnail, i === activeImg && S.thumbnailActive]}
                onPress={() => goToImage(i)}
              >
                <Image source={{ uri }} style={S.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 2. Basic Info ── */}
        <View style={S.card}>
          <View style={S.categoryBadgeRow}>
            <View style={S.categoryBadge}>
              <Text style={S.categoryBadgeText}>{product.category}</Text>
            </View>
            {product.badge && (
              <View style={S.productBadge}>
                <Text style={S.productBadgeText}>{product.badge}</Text>
              </View>
            )}
          </View>

          <Text style={S.productName}>{product.name}</Text>

          {product.brand ? (
            <Text style={S.brand}>bởi <Text style={S.brandName}>{product.brand}</Text></Text>
          ) : null}

          {product.description ? (
            <Text style={S.shortDesc} numberOfLines={3}>{product.description}</Text>
          ) : null}

          <View style={S.ratingRow}>
            <StarRow rating={product.ratingAverage} />
            <Text style={S.ratingValue}>{product.ratingAverage.toFixed(1)}</Text>
            <Text style={S.reviewCount}>({product.reviewCount} đánh giá)</Text>
            <View style={[S.stockBadge, product.status === 'OUT_OF_STOCK' && S.stockBadgeOut]}>
              <Text style={[S.stockText, product.status === 'OUT_OF_STOCK' && S.stockTextOut]}>
                {product.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Còn hàng'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Price ── */}
        <View style={S.card}>
          <View style={S.priceRow}>
            <Text style={S.price}>{formatVnd(product.price)}</Text>
            {hasDiscount && (
              <Text style={S.originalPrice}>{formatVnd(product.originalPrice!)}</Text>
            )}
            {hasDiscount && (
              <View style={S.saveBadge}>
                <Text style={S.saveText}>Tiết kiệm {formatVnd(product.originalPrice! - product.price)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 4. Variants ── */}
        <View style={S.card}>
          {/* Colors */}
          {product.colors.length > 0 && (
            <View style={S.variantSection}>
              <Text style={S.variantTitle}>
                Màu sắc{selectedColor ? <Text style={S.selectedLabel}> · {selectedColor}</Text> : null}
              </Text>
              <View style={S.chipRow}>
                {product.colors.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[S.colorChip, selectedColor === c.name && S.chipSelected]}
                    onPress={() => setSelectedColor((p) => p === c.name ? null : c.name)}
                  >
                    <View style={[S.colorDot, { backgroundColor: c.hexCode }]} />
                    <Text style={[S.chipText, selectedColor === c.name && S.chipTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <View style={S.variantSection}>
              <Text style={S.variantTitle}>
                Kích cỡ{selectedSize ? <Text style={S.selectedLabel}> · {selectedSize}</Text> : null}
              </Text>
              <View style={S.chipRow}>
                {product.sizes.map((sz) => (
                  <TouchableOpacity
                    key={sz}
                    style={[S.sizeChip, selectedSize === sz && S.chipSelected]}
                    onPress={() => setSelectedSize((p) => p === sz ? null : sz)}
                  >
                    <Text style={[S.chipText, selectedSize === sz && S.chipTextSelected]}>{sz}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Low stock warning */}
          {isLowStock && (
            <View style={S.lowStock}>
              <BlinkDot />
              <Text style={S.lowStockText}>Chỉ còn {product.stock} sản phẩm</Text>
            </View>
          )}

          {/* Quantity */}
          <View style={S.qtyRow}>
            <Text style={S.variantTitle}>Số lượng</Text>
            <View style={S.stepper}>
              <TouchableOpacity
                style={[S.stepBtn, qty <= 1 && S.stepBtnDim]}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Ionicons name="remove" size={16} color={qty <= 1 ? Colors.textMuted : Colors.text} />
              </TouchableOpacity>
              <Text style={S.qtyText}>{qty}</Text>
              <TouchableOpacity
                style={[S.stepBtn, qty >= product.stock && S.stepBtnDim]}
                onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
              >
                <Ionicons name="add" size={16} color={qty >= product.stock ? Colors.textMuted : Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={S.stockCount}>Còn {product.stock} sp</Text>
          </View>
        </View>

        {/* ── 5. Trust Badges ── */}
        <View style={S.card}>
          <View style={S.trustGrid}>
            {TRUST_ITEMS.map((t) => (
              <View key={t.title} style={S.trustItem}>
                <View style={S.trustIconWrap}>
                  <Ionicons name={t.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={S.trustTitle}>{t.title}</Text>
                <Text style={S.trustSub}>{t.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. Seller ── */}
        {product.seller && (
          <View style={S.card}>
            <View style={S.sellerRow}>
              <View style={S.sellerAvatarWrap}>
                {product.seller.avatar ? (
                  <Image source={{ uri: product.seller.avatar }} style={S.sellerAvatar} />
                ) : (
                  <View style={S.sellerAvatarPlaceholder}>
                    <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={S.sellerName}>{product.seller.storeName}</Text>
                  {product.seller.isVerified && (
                    <View style={S.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                      <Text style={S.verifiedText}>Đã xác minh</Text>
                    </View>
                  )}
                </View>
                <Text style={S.sellerRating}>
                  {product.seller.positiveRating}% tích cực
                </Text>
              </View>
              <TouchableOpacity
                style={[S.chatBtn, chatMutation.isPending && { opacity: 0.6 }]}
                onPress={() => {
                  if (product.seller?.userId) {
                    chatMutation.mutate(product.seller.userId);
                  }
                }}
                disabled={chatMutation.isPending || !product.seller?.userId}
              >
                {chatMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
                    <Text style={S.chatBtnText}>Nhắn tin</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 7. Tabs ── */}
        <View style={S.tabsCard}>
          {/* Tab bar */}
          <View style={S.tabBar}>
            {([
              { key: 'desc',    label: 'Mô tả' },
              { key: 'specs',   label: 'Thông số' },
              { key: 'reviews', label: `Đánh giá (${product.reviewCount})` },
            ] as const).map((t) => (
              <TouchableOpacity
                key={t.key}
                style={S.tabItem}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[S.tabText, activeTab === t.key && S.tabTextActive]}>
                  {t.label}
                </Text>
                {activeTab === t.key && <View style={S.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab: Description */}
          {activeTab === 'desc' && (
            <View style={S.tabContent}>
              <Text style={S.descText}>{product.description || 'Chưa có mô tả sản phẩm.'}</Text>
            </View>
          )}

          {/* Tab: Specs */}
          {activeTab === 'specs' && (
            <View style={S.tabContent}>
              {product.specifications.length === 0 ? (
                <Text style={S.emptyTabText}>Chưa có thông số kỹ thuật.</Text>
              ) : (
                product.specifications.map((sp, i) => (
                  <View key={i} style={[S.specRow, i % 2 === 0 && S.specRowEven]}>
                    <Text style={S.specKey}>{sp.key}</Text>
                    <Text style={S.specVal}>{sp.value}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab: Reviews */}
          {activeTab === 'reviews' && (
            <View style={S.tabContent}>
              {/* Rating summary */}
              {summary && (
                <View style={S.ratingSummary}>
                  <View style={S.ratingBig}>
                    <Text style={S.ratingBigNum}>{summary.ratingAverage.toFixed(1)}</Text>
                    <StarRow rating={summary.ratingAverage} size={18} />
                    <Text style={S.ratingBigCount}>{summary.reviewCount} đánh giá</Text>
                  </View>
                  <View style={S.ratingBars}>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <RatingBar
                        key={s}
                        star={s}
                        count={summary.breakdown[String(s)] ?? 0}
                        total={summary.reviewCount}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Review form */}
              {eligibility?.canReview && !showReviewForm && (
                <TouchableOpacity
                  style={S.writeReviewBtn}
                  onPress={() => setShowReviewForm(true)}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.primary} />
                  <Text style={S.writeReviewText}>Viết đánh giá của bạn</Text>
                </TouchableOpacity>
              )}

              {showReviewForm && (
                <View style={S.reviewForm}>
                  <Text style={S.reviewFormTitle}>Đánh giá sản phẩm</Text>
                  {/* Star selector */}
                  <View style={S.starSelector}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setRFormRating(s)}>
                        <Ionicons
                          name={s <= rFormRating ? 'star' : 'star-outline'}
                          size={32}
                          color="#F59E0B"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Emoji picker */}
                  <View style={S.emojiRow}>
                    {EMOJIS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={[S.emojiBtn, rFormEmoji === e && S.emojiBtnActive]}
                        onPress={() => setRFormEmoji((p) => p === e ? null : e)}
                      >
                        <Text style={S.emojiText}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Moderation error banner */}
                  {reviewModError && (
                    <View style={S.modErrorBanner}>
                      <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                      <Text style={S.modErrorText}>{reviewModError}</Text>
                    </View>
                  )}
                  {/* Comment */}
                  <TextInput
                    style={[S.reviewTextarea, reviewModError ? S.inputError : null]}
                    placeholder="Nhận xét của bạn về sản phẩm..."
                    placeholderTextColor={Colors.textMuted}
                    value={rFormText}
                    onChangeText={(t) => { setRFormText(t); setReviewModError(null); }}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={S.reviewFormBtns}>
                    <TouchableOpacity
                      style={S.reviewCancelBtn}
                      onPress={() => setShowReviewForm(false)}
                    >
                      <Text style={S.reviewCancelText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.reviewSubmitBtn, reviewMutation.isPending && S.btnDim]}
                      onPress={() => reviewMutation.mutate()}
                      disabled={reviewMutation.isPending}
                    >
                      {reviewMutation.isPending
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={S.reviewSubmitText}>Gửi đánh giá</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Review list */}
              {reviewsLoading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
              ) : reviews.length === 0 ? (
                <View style={S.emptyReviews}>
                  <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
                  <Text style={S.emptyTabText}>Chưa có đánh giá nào</Text>
                </View>
              ) : (
                <>
                  {reviews.map((rv) => (
                    <ReviewCard
                      key={rv.id}
                      review={rv}
                      onHelpful={() => helpfulMutation.mutate(rv.id)}
                      onReply={() => toggleReply(rv.id)}
                      isReplying={replyingTo === rv.id}
                      replyText={replyText}
                      onReplyChange={setReplyText}
                      onReplySubmit={() => replyMutation.mutate({ id: rv.id, text: replyText })}
                      isSubmittingReply={replyMutation.isPending && replyMutation.variables?.id === rv.id}
                      replyModError={replyingTo === rv.id ? replyModError : null}
                      onClearReplyError={() => setReplyModError(null)}
                    />
                  ))}
                  {reviewsData && reviewPage < reviewsData.totalPages && (
                    <TouchableOpacity
                      style={S.loadMoreBtn}
                      onPress={() => setReviewPage((p) => p + 1)}
                    >
                      <Text style={S.loadMoreText}>Xem thêm đánh giá</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>

        {/* ── 8. Related Products ── */}
        {(relatedProducts?.length ?? 0) > 0 && (
          <View style={S.sectionWrap}>
            <Text style={S.sectionTitle}>Sản phẩm liên quan</Text>
            <View style={S.productGrid}>
              {relatedProducts!.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  width={CARD_W}
                  onPress={() => nav.push('ProductDetail', { productId: p.id })}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── 9. Recommended (Có thể bạn thích) ── */}
        {(similarProducts?.length ?? 0) > 0 && (
          <View style={S.sectionWrap}>
            <Text style={S.sectionTitle}>Có thể bạn thích</Text>
            <View style={S.productGrid}>
              {similarProducts!.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  width={CARD_W}
                  onPress={() => nav.push('ProductDetail', { productId: p.id })}
                />
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[S.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[S.wishlistBtn, inWishlist && S.wishlistBtnActive]}
          onPress={() => wishlistMutation.mutate()}
        >
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={22}
            color={inWishlist ? Colors.danger : Colors.textSub}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            S.addCartBtn,
            product.status === 'OUT_OF_STOCK' && S.btnDim,
            addCartMutation.isPending && S.btnDim,
          ]}
          onPress={handleAddToCart}
          disabled={product.status === 'OUT_OF_STOCK' || addCartMutation.isPending}
          activeOpacity={0.85}
        >
          {addCartMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={S.addCartText}>
                {product.status === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Thêm vào giỏ'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={S.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={Colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* ── Full-screen Image Modal ── */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <View style={S.zoomModal}>
          <TouchableOpacity style={S.zoomClose} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {allImages[activeImg] ? (
            <Image
              source={{ uri: allImages[activeImg] }}
              style={S.zoomImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, color: Colors.textSub },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  headerIconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  backBtnFloat: {
    position: 'absolute',
    top: 56, left: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },

  // Gallery
  galleryWrap: {
    width: W, height: IMAGE_H,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  mainImage: { width: W, height: IMAGE_H },
  imagePlaceholder: {
    width: W, height: IMAGE_H,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  discountBadge: {
    position: 'absolute',
    top: 14, left: 14,
    backgroundColor: Colors.danger,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  dotsRow: {
    position: 'absolute',
    bottom: 10, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18, borderRadius: 3 },

  // Thumbnails
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumbnail: {
    width: 58, height: 58, borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: Colors.primary },
  thumbImg: { width: '100%', height: '100%' },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    ...Shadows.card,
  },

  // Info
  categoryBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },
  productBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  productBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  productName: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26, marginBottom: 6 },
  brand: { fontSize: 13, color: Colors.textSub, marginBottom: 6 },
  brandName: { fontWeight: '700', color: Colors.text },
  shortDesc: { fontSize: 13, color: Colors.textSub, lineHeight: 19, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  ratingValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  reviewCount: { fontSize: 12, color: Colors.textSub },
  stockBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  stockBadgeOut: { backgroundColor: Colors.dangerLight, borderColor: Colors.dangerBorder },
  stockText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  stockTextOut: { color: Colors.danger },

  // Price
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  originalPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },
  saveBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  saveText: { fontSize: 11, fontWeight: '700', color: '#D97706' },

  // Variants
  variantSection: { marginBottom: 14 },
  variantTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  selectedLabel: { fontWeight: '500', color: Colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sizeChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  chipTextSelected: { color: Colors.primary },
  colorDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: Colors.border },
  lowStock: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', padding: 10, borderRadius: 10, marginBottom: 12,
  },
  lowStockText: { fontSize: 13, fontWeight: '600', color: '#D97706' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, overflow: 'hidden',
  },
  stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepBtnDim: { opacity: 0.4 },
  qtyText: { minWidth: 32, textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.text },
  stockCount: { fontSize: 12, color: Colors.textMuted, flex: 1, textAlign: 'right' },

  // Trust
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trustItem: { width: (W - 12 * 2 - 16 * 2 - 12) / 2, alignItems: 'center', gap: 4 },
  trustIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  trustTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  trustSub:   { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  // Seller
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatarWrap: { width: 48, height: 48 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24 },
  sellerAvatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  sellerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  sellerRating: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary,
  },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Tabs
  tabsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.card,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 13, position: 'relative' },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2.5, borderRadius: 2, backgroundColor: Colors.primary,
  },
  tabContent: { padding: 16 },
  descText: { fontSize: 14, color: Colors.textSub, lineHeight: 22 },
  emptyTabText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },

  // Specs table
  specRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4 },
  specRowEven: { backgroundColor: Colors.bg, borderRadius: 8 },
  specKey: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textSub },
  specVal: { flex: 1.5, fontSize: 13, color: Colors.text },

  // Rating summary
  ratingSummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ratingBig: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 72 },
  ratingBigNum: { fontSize: 40, fontWeight: '900', color: Colors.text, lineHeight: 44 },
  ratingBigCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  ratingBars: { flex: 1, justifyContent: 'center' },

  // Review form
  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    marginBottom: 16,
  },
  writeReviewText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  reviewForm: {
    backgroundColor: Colors.bg,
    borderRadius: 12, padding: 14, marginBottom: 16, gap: 12,
  },
  reviewFormTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  starSelector: { flexDirection: 'row', gap: 8 },
  emojiRow: { flexDirection: 'row', gap: 10 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  emojiText: { fontSize: 22 },
  reviewTextarea: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top',
  },
  inputError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  modErrorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  modErrorText: { flex: 1, fontSize: 13, color: Colors.danger, lineHeight: 18 },
  reviewFormBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  reviewCancelBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  reviewCancelText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  reviewSubmitBtn: {
    paddingHorizontal: 20, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  reviewSubmitText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  emptyReviews: { alignItems: 'center', gap: 8, paddingVertical: 24 },

  // Load more
  loadMoreBtn: {
    alignItems: 'center', padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    marginTop: 8,
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Related/Similar products
  sectionWrap: { marginTop: 12, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.card,
  },
  wishlistBtn: {
    width: 48, height: 48,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  wishlistBtnActive: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  addCartBtn: {
    flex: 1, height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.button,
  },
  addCartText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  shareBtn: {
    width: 48, height: 48,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  btnDim: { opacity: 0.5 },

  // Zoom modal
  zoomModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  zoomClose: {
    position: 'absolute', top: 48, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  zoomImage: { width: W, height: W * 1.2 },
});
