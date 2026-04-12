import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { chatService } from '@services/chatService';
import { useAuthStore } from '@store/authStore';
import type { ChatMessage } from '@typings/chat';
import type { RootStackParamList } from '@app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ChatRoom'>;

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({
  msg,
  isMine,
  onLongPress,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onLongPress: () => void;
}) {
  return (
    <View style={[MB.wrapper, isMine ? MB.wrapperRight : MB.wrapperLeft]}>
      {!isMine && (
        <View style={MB.avatarWrap}>
          {msg.senderAvatar ? (
            <Image source={{ uri: msg.senderAvatar }} style={MB.avatar} />
          ) : (
            <View style={MB.avatarFallback}>
              <Text style={MB.avatarLetter}>
                {msg.senderName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>
      )}
      <TouchableOpacity
        style={[MB.bubble, isMine ? MB.bubbleMine : MB.bubbleOther]}
        onLongPress={onLongPress}
        activeOpacity={0.85}
      >
        {msg.attachmentUrl && msg.attachmentType?.startsWith('image') && (
          <Image
            source={{ uri: msg.attachmentUrl }}
            style={MB.attachImage}
            resizeMode="cover"
          />
        )}
        {msg.text ? (
          <Text style={[MB.text, isMine ? MB.textMine : MB.textOther]}>
            {msg.text}
          </Text>
        ) : null}
        <Text style={[MB.time, isMine ? MB.timeMine : MB.timeOther]}>
          {timeLabel(msg.createdAt)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { conversationId, sellerName, sellerAvatar } = route.params;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.messages(conversationId),
    queryFn: () => chatService.getMessages(conversationId),
    refetchInterval: 5_000,
  });

  const messages = data?.messages ?? [];

  // No need for scrollToEnd effect with 'inverted' list

  const sendMutation = useMutation({
    mutationFn: (msgText: string) =>
      chatService.sendMessage(conversationId, { text: msgText }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
  
  const uploadAndSendMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      const filename = asset.uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      setIsUploading(true);
      try {
        const uploadRes = await chatService.uploadImage({
          uri: asset.uri,
          name: filename,
          type: type,
        });

        const imageUrl = uploadRes.urls[0];
        return chatService.sendMessage(conversationId, {
          text: '📷 Hình ảnh',
          attachmentUrl: imageUrl,
          attachmentType: 'image',
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
    onError: (err) => {
      console.error('Chat image upload error:', err);
      Alert.alert('Lỗi', 'Không thể gửi ảnh lúc này. Vui lòng thử lại.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      chatService.deleteMessage(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(conversationId),
      });
    },
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText('');
    sendMutation.mutate(trimmed);
  }

  function handleLongPress(msg: ChatMessage, isMine: boolean) {
    if (!isMine) return;
    Alert.alert('Tin nhắn', 'Bạn muốn làm gì với tin nhắn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(msg.id),
      },
    ]);
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện để gửi ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      uploadAndSendMutation.mutate(result.assets[0]);
    }
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
        <View style={S.headerMid}>
          <View style={S.headerAvatar}>
            {sellerAvatar ? (
              <Image source={{ uri: sellerAvatar }} style={S.headerAvatarImg} />
            ) : (
              <Text style={S.headerAvatarLetter}>
                {sellerName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            )}
          </View>
          <View>
            <Text style={S.headerName} numberOfLines={1}>
              {sellerName}
            </Text>
            <Text style={S.headerStatus}>Người bán</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={S.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {isLoading ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : isError ? (
          <View style={S.center}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={Colors.danger}
            />
            <Text style={S.errorText}>Không thể tải tin nhắn</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const isMine = item.senderId === currentUser?.id;
              return (
                <MessageBubble
                  msg={item}
                  isMine={isMine}
                  onLongPress={() => handleLongPress(item, isMine)}
                />
              );
            }}
            contentContainerStyle={S.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[S.emptyWrap, { transform: [{ scaleY: -1 }] }]}>
                <Ionicons
                  name="chatbubble-outline"
                  size={40}
                  color={Colors.textMuted}
                />
                <Text style={S.emptyText}>Hãy bắt đầu cuộc trò chuyện!</Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View style={[S.inputBar, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 10 }]}>
          <TouchableOpacity 
            style={S.attachBtn} 
            onPress={handlePickImage}
            disabled={isUploading || sendMutation.isPending}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
          <TextInput
            style={S.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="default"
            editable={!isUploading}
          />
          <TouchableOpacity
            style={[S.sendBtn, (!text.trim() || sendMutation.isPending || isUploading) && S.sendBtnDim]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending || isUploading}
            activeOpacity={0.85}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── MessageBubble styles ─────────────────────────────────
const MB = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  wrapperRight: { justifyContent: 'flex-end' },
  wrapperLeft: { justifyContent: 'flex-start' },
  avatarWrap: {
    width: 32,
    height: 32,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.card,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: { color: '#fff' },
  textOther: { color: Colors.text },
  time: { fontSize: 10 },
  timeMine: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  timeOther: { color: Colors.textMuted },
  attachImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
});

// ─── ChatScreen styles ────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerMid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: 38,
    height: 38,
  },
  headerAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.success,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { fontSize: 15, color: Colors.textSub },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: Colors.inputBg,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  sendBtnDim: { opacity: 0.5 },
});
