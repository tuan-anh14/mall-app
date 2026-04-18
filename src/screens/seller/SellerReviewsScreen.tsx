import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerReviewService } from '@services/sellerReviewService';
import type { SellerReview } from '@typings/seller';
import type { SellerStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<SellerStackParamList>;

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={Colors.star}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  onReply,
  onDelete,
  isReplyPending,
}: {
  review: SellerReview;
  onReply: (text: string) => void;
  onDelete: () => void;
  isReplyPending: boolean;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [imgError, setImgError] = useState(false);
  const buyerName = `${review.user.firstName} ${review.user.lastName}`;
  const productImage = review.product.images?.[0]?.url;

  return (
    <View style={RC.card}>
      {/* Reviewer */}
      <View style={RC.topRow}>
        <View style={RC.avatarWrap}>
          {review.user.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={RC.avatar} />
          ) : (
            <View style={RC.avatarFallback}>
              <Text style={RC.avatarLetter}>
                {review.user.firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={RC.userInfo}>
          <Text style={RC.buyerName}>{buyerName}</Text>
          <Stars rating={review.rating} />
        </View>
        <Text style={RC.date}>
          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      {/* Product Info */}
      <View style={RC.productRow}>
        <View style={RC.productImgWrap}>
          {productImage && !imgError ? (
            <Image
              source={{ uri: productImage }}
              style={RC.productImg}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={RC.productImgFallback}>
              <Ionicons name="cube-outline" size={16} color={Colors.textMuted} />
            </View>
          )}
        </View>
        <Text style={RC.productName} numberOfLines={1}>
          Sản phẩm: {review.product.name}
        </Text>
      </View>

      <Text style={RC.comment}>{review.comment}</Text>

      {/* Existing reply */}
      {review.reply && (
        <View style={RC.replyBox}>
          <View style={RC.replyHeader}>
            <Ionicons name="chatbubble-outline" size={13} color={Colors.primary} />
            <Text style={RC.replyLabel}>Phản hồi của bạn</Text>
          </View>
          <Text style={RC.replyText}>{review.reply.text}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={RC.actions}>
        {!review.reply && (
          <TouchableOpacity
            style={RC.replyBtn}
            onPress={() => setShowReplyInput((v) => !v)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.primary} />
            <Text style={RC.replyBtnText}>Phản hồi</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={RC.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={14} color={Colors.danger} />
          <Text style={RC.deleteBtnText}>Xóa</Text>
        </TouchableOpacity>
      </View>

      {showReplyInput && !review.reply && (
        <View style={RC.replyInputWrap}>
          <TextInput
            style={RC.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Nhập phản hồi..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <View style={RC.replyBtns}>
            <TouchableOpacity
              style={RC.cancelBtn}
              onPress={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
            >
              <Text style={RC.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[RC.sendBtn, (!replyText.trim() || isReplyPending) && RC.sendBtnDim]}
              onPress={() => {
                if (replyText.trim()) {
                  onReply(replyText.trim());
                  setShowReplyInput(false);
                  setReplyText('');
                }
              }}
              disabled={!replyText.trim() || isReplyPending}
            >
              {isReplyPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={RC.sendBtnText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export function SellerReviewsScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const FILTER_OPTS = [
    { key: '', label: 'Tất cả' },
    { key: 'replied', label: 'Đã phản hồi' },
    { key: 'unreplied', label: 'Chưa phản hồi' },
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.sellerReviews(`${filter}-${search}`),
    queryFn: () =>
      sellerReviewService.getReviews({
        filter: filter || undefined,
        search: search || undefined,
      }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: string; text: string }) =>
      sellerReviewService.replyToReview(reviewId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'reviews'] });
    },
    onError: () => Alert.alert('Lỗi', 'Không thể gửi phản hồi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => sellerReviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'reviews'] });
    },
    onError: () => Alert.alert('Lỗi', 'Không thể xóa đánh giá.'),
  });

  function handleDelete(review: SellerReview) {
    Alert.alert(
      'Xóa đánh giá',
      'Bạn có chắc muốn xóa đánh giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(review.id),
        },
      ],
    );
  }

  const reviews = data?.reviews ?? [];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Đánh giá</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={S.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={S.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo sản phẩm..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => refetch()}
        />
      </View>

      <FlatList
        horizontal
        style={{ flexGrow: 0, flexShrink: 0 }}
        data={FILTER_OPTS}
        keyExtractor={(f) => f.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[S.filterChip, filter === item.key && S.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[S.filterChipText, filter === item.key && S.filterChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={S.filterRow}
        showsHorizontalScrollIndicator={false}
      />

      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Text style={S.errorText}>Không thể tải đánh giá</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onReply={(text) =>
                replyMutation.mutate({ reviewId: item.id, text })
              }
              onDelete={() => handleDelete(item)}
              isReplyPending={
                replyMutation.isPending &&
                (replyMutation.variables as { reviewId: string })?.reviewId === item.id
              }
            />
          )}
          contentContainerStyle={
            reviews.length === 0 ? S.emptyContent : S.listContent
          }
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <Ionicons name="star-outline" size={56} color={Colors.textMuted} />
              <Text style={S.emptyTitle}>Chưa có đánh giá</Text>
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

const RC = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1, gap: 3 },
  buyerName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bg,
    padding: 8,
    borderRadius: 10,
  },
  productImgWrap: {},
  productImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  productImgFallback: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  comment: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  replyBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  replyText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  replyBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: Colors.danger },
  replyInputWrap: { gap: 8 },
  replyInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 13, color: Colors.textSub, fontWeight: '600' },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    minWidth: 60,
    alignItems: 'center',
  },
  sendBtnDim: { opacity: 0.5 },
  sendBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterChipText: { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, color: Colors.textSub },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: 16, gap: 12 },
  emptyContent: { flex: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSub },
});
