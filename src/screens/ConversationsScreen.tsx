import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { chatService } from '@services/chatService';
import type { Conversation } from '@typings/chat';
import type { RootStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function ConversationRow({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) {
  const initials = item.sellerName
    ? item.sellerName[0].toUpperCase()
    : '?';

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.75}>
      <View style={S.avatarWrap}>
        {item.sellerAvatar ? (
          <Image source={{ uri: item.sellerAvatar }} style={S.avatar} />
        ) : (
          <View style={S.avatarFallback}>
            <Text style={S.avatarLetter}>{initials}</Text>
          </View>
        )}
        <View style={S.onlineDot} />
      </View>

      <View style={S.rowContent}>
        <View style={S.rowTop}>
          <Text style={S.sellerName} numberOfLines={1}>
            {item.sellerName}
          </Text>
          {item.lastMessageAt && (
            <Text style={S.time}>{timeAgo(item.lastMessageAt)}</Text>
          )}
        </View>
        <View style={S.rowBottom}>
          <Text style={S.lastMsg} numberOfLines={1}>
            {item.lastMessage ?? 'Chưa có tin nhắn'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={S.unreadBadge}>
              <Text style={S.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ConversationsScreen() {
  const navigation = useNavigation<Nav>();

  const { data: conversations = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: chatService.getConversations,
    refetchInterval: 15_000,
  });

  const unifiedConversations = useMemo(() => {
    const map = new Map<string, Conversation>();

    conversations.forEach((conv) => {
      // If we are a buyer, otherUser is the seller. 
      // The backend returns c.otherUser.id mapped to sellerId in mapConversation.
      const existing = map.get(conv.sellerId);
      
      if (
        !existing ||
        (conv.lastMessageAt &&
          (!existing.lastMessageAt ||
            new Date(conv.lastMessageAt) > new Date(existing.lastMessageAt)))
      ) {
        // This is a newer thread or the first one we found for this seller
        const totalUnread = (existing?.unreadCount || 0) + conv.unreadCount;
        map.set(conv.sellerId, {
          ...conv,
          unreadCount: totalUnread,
        });
      } else {
        // This is an older thread, we just add its unread count to the summary
        existing.unreadCount += conv.unreadCount;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    });
  }, [conversations]);

  const handleOpen = useCallback(
    (conv: Conversation) => {
      navigation.navigate('ChatRoom', {
        conversationId: conv.id,
        sellerName: conv.sellerName,
        sellerAvatar: conv.sellerAvatar,
      });
    },
    [navigation],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={S.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={S.errorText}>Không thể tải hộp thư</Text>
          <TouchableOpacity style={S.retryBtn} onPress={() => refetch()}>
            <Text style={S.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <Header onBack={() => navigation.goBack()} />
      <FlatList
        data={unifiedConversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow item={item} onPress={() => handleOpen(item)} />
        )}
        ItemSeparatorComponent={() => <View style={S.separator} />}
        contentContainerStyle={
          unifiedConversations.length === 0 ? S.emptyContent : S.listContent
        }
        ListEmptyComponent={
          <View style={S.emptyWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons
                name="chatbubbles-outline"
                size={56}
                color={Colors.primary}
              />
            </View>
            <Text style={S.emptyTitle}>Chưa có cuộc trò chuyện</Text>
            <Text style={S.emptySub}>
              Trò chuyện với người bán từ trang sản phẩm
            </Text>
          </View>
        }
        refreshing={false}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={S.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={S.headerTitle}>Hộp thư</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bg,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: {
    fontSize: 13,
    color: Colors.textSub,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 80,
  },
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
