import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { viewHistoryService, type ViewHistoryItem } from '@services/viewHistoryService';
import { formatVnd } from '@utils/index';
import type { RootStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_LIMIT = 20;

function HistoryCard({
  item,
  onPress,
  onRemove,
}: {
  item: ViewHistoryItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const { product } = item;

  return (
    <TouchableOpacity style={HC.container} onPress={onPress} activeOpacity={0.82}>
      <View style={HC.imgWrap}>
        {product.image && !imgError ? (
          <Image
            source={{ uri: product.image }}
            style={HC.img}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={HC.imgPlaceholder}>
            <Ionicons name="image-outline" size={28} color="#CBD5E1" />
          </View>
        )}
        {product.discount != null && product.discount > 0 && (
          <View style={HC.discountBadge}>
            <Text style={HC.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>

      <View style={HC.info}>
        <Text style={HC.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={HC.price}>{formatVnd(product.price)}</Text>
        {product.rating != null && (
          <View style={HC.ratingRow}>
            <Ionicons name="star" size={12} color={Colors.star} />
            <Text style={HC.rating}>{product.rating.toFixed(1)}</Text>
          </View>
        )}
        <Text style={HC.viewedAt}>
          Đã xem:{' '}
          {new Date(item.viewedAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <TouchableOpacity
        style={HC.removeBtn}
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function ViewHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [page] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.viewHistory(page),
    queryFn: () => viewHistoryService.getHistory({ page, limit: PAGE_LIMIT }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => viewHistoryService.deleteItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.viewHistory(page) });
    },
  });

  const clearMutation = useMutation({
    mutationFn: viewHistoryService.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.viewHistory(page) });
    },
  });

  function handleClearAll() {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có muốn xóa toàn bộ lịch sử xem không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => clearMutation.mutate(),
        },
      ],
    );
  }

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <Header
          onBack={() => navigation.goBack()}
          count={0}
          onClear={handleClearAll}
          clearPending={false}
        />
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <Header
          onBack={() => navigation.goBack()}
          count={0}
          onClear={handleClearAll}
          clearPending={false}
        />
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={S.errorText}>Không thể tải lịch sử</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        count={data?.total ?? 0}
        onClear={handleClearAll}
        clearPending={clearMutation.isPending}
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onPress={() =>
              navigation.navigate('ProductDetail', {
                productId: item.productId,
              })
            }
            onRemove={() => removeMutation.mutate(item.productId)}
          />
        )}
        contentContainerStyle={
          items.length === 0 ? S.emptyContent : S.listContent
        }
        ListEmptyComponent={
          <View style={S.emptyWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="time-outline" size={56} color={Colors.primary} />
            </View>
            <Text style={S.emptyTitle}>Chưa có lịch sử xem</Text>
            <Text style={S.emptySub}>
              Các sản phẩm bạn đã xem sẽ hiển thị tại đây
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={S.separator} />}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

function Header({
  onBack,
  count,
  onClear,
  clearPending,
}: {
  onBack: () => void;
  count: number;
  onClear: () => void;
  clearPending: boolean;
}) {
  return (
    <View style={S.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <View style={S.headerMid}>
        <Text style={S.headerTitle}>Đã xem gần đây</Text>
        {count > 0 && (
          <Text style={S.headerCount}>{count} sản phẩm</Text>
        )}
      </View>
      {count > 0 && (
        <TouchableOpacity onPress={onClear} disabled={clearPending}>
          {clearPending ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Text style={S.clearText}>Xóa tất cả</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── HistoryCard styles ───────────────────────────────────
const HC = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  imgWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
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
  info: { flex: 1, gap: 4 },
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 12,
    color: Colors.textSub,
    fontWeight: '600',
  },
  viewedAt: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  removeBtn: {
    padding: 4,
  },
});

// ─── ViewHistoryScreen styles ─────────────────────────────
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
  headerMid: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
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
});
