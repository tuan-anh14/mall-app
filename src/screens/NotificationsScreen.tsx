import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { notificationService } from '@services/notificationService';
import { useNotificationStore } from '@store/notificationStore';
import type { Notification, NotificationType } from '@typings/notification';

// ─── Config ───────────────────────────────────────────

type Filter = 'all' | 'unread' | 'read';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',    label: 'Tất cả'    },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'read',   label: 'Đã đọc'   },
];

interface TypeMeta {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  label: string;
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  ORDER:     { icon: 'bag-handle-outline', color: Colors.primary, bg: Colors.primaryLight, label: 'Đơn hàng'  },
  SALE:      { icon: 'pricetag-outline',   color: Colors.danger,  bg: Colors.dangerLight,  label: 'Giảm giá'  },
  WISHLIST:  { icon: 'heart-outline',      color: '#EC4899',       bg: '#FDF2F8',           label: 'Yêu thích' },
  PROMOTION: { icon: 'gift-outline',       color: '#D97706',       bg: '#FFFBEB',           label: 'Ưu đãi'    },
  SYSTEM:    { icon: 'settings-outline',   color: Colors.textSub, bg: '#F1F5F9',           label: 'Hệ thống'  },
};

// ─── Helpers ──────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

// ─── NotificationRow ──────────────────────────────────

interface NotificationRowProps {
  item: Notification;
  onRead: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function NotificationRow({ item, onRead, onDelete, isDeleting }: NotificationRowProps) {
  const meta = TYPE_META[item.type];
  const unread = !item.isRead;

  return (
    <TouchableOpacity
      style={[NR.card, unread && NR.cardUnread, isDeleting && NR.cardFading]}
      onPress={onRead}
      activeOpacity={0.72}
    >
      {/* Icon column */}
      <View style={NR.iconCol}>
        <View style={[NR.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        {unread && <View style={NR.dot} />}
      </View>

      {/* Body */}
      <View style={NR.body}>
        {/* Row 1: badge + time */}
        <View style={NR.metaRow}>
          <View style={[NR.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[NR.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={NR.time}>{timeAgo(item.createdAt)}</Text>
        </View>

        {/* Row 2: title */}
        <Text
          style={[NR.title, unread && NR.titleBold]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* Row 3: message */}
        <Text style={NR.msg} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={NR.delBtn}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isDeleting}
      >
        {isDeleting
          ? <ActivityIndicator size="small" color={Colors.textMuted} />
          : <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
        }
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── NotificationsScreen ──────────────────────────────

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [filter, setFilter] = useState<Filter>('all');

  const queryParams =
    filter === 'unread' ? { isRead: false, limit: 50 }
    : filter === 'read'  ? { isRead: true,  limit: 50 }
    :                       { limit: 50 };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.notifications(filter),
    queryFn: () => notificationService.getNotifications(queryParams),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount   ?? 0;

  useEffect(() => { setUnreadCount(unreadCount); }, [unreadCount, setUnreadCount]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  function handleRead(item: Notification) {
    if (!item.isRead) markReadMutation.mutate(item.id);
  }

  // ── Render ──
  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Text style={S.title}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={S.unreadPill}>
              <Text style={S.unreadPillText}>
                {unreadCount > 99 ? '99+' : unreadCount} chưa đọc
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[S.markAllBtn, markAllMutation.isPending && S.btnDim]}
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={S.markAllText}>Đọc tất cả</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter tabs (underline style) ── */}
      <View style={S.tabBar}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={S.tabItem}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[S.tabText, active && S.tabTextActive]}>
                {f.label}
              </Text>
              {active && <View style={S.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={S.center}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
          </View>
          <Text style={S.emptyTitle}>Không thể tải thông báo</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={S.center}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="notifications-off-outline" size={44} color={Colors.textMuted} />
          </View>
          <Text style={S.emptyTitle}>
            {filter === 'unread' ? 'Không có thông báo chưa đọc'
             : filter === 'read'  ? 'Không có thông báo đã đọc'
             :                      'Chưa có thông báo nào'}
          </Text>
          <Text style={S.emptySub}>Các thông báo về đơn hàng và ưu đãi sẽ xuất hiện ở đây</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onRead={() => handleRead(item)}
              onDelete={() => deleteMutation.mutate(item.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles: NotificationRow ──────────────────────────

const NR = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardUnread: {
    backgroundColor: '#F0F5FF',
  },
  cardFading: {
    opacity: 0.4,
  },

  // Icon
  iconCol: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // Body
  body: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  titleBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  msg: {
    fontSize: 12,
    color: Colors.textSub,
    lineHeight: 17,
  },

  // Delete
  delBtn: {
    paddingTop: 2,
    width: 24,
    alignItems: 'center',
    flexShrink: 0,
  },
});

// ─── Styles: Screen ───────────────────────────────────

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  unreadPill: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  markAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minWidth: 90,
    alignItems: 'center',
  },
  btnDim: {
    opacity: 0.5,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Underline tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    backgroundColor: Colors.bg,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.card,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 4,
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

  // List
  list: {
    paddingBottom: 32,
    backgroundColor: Colors.bg,
  },
});
