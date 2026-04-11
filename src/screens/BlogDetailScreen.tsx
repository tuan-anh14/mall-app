import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHTML from 'react-native-render-html';
import { blogService } from '@services/blogService';
import { Blog } from '@typings/blog';
import { RootStackParamList } from '@app/navigation/types';
import { Colors } from '@constants/theme';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const { width: W } = Dimensions.get('window');
const H_PAD = 16;
const C = Colors;

type BlogDetailRouteProp = RouteProp<RootStackParamList, 'BlogDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function BlogDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BlogDetailRouteProp>();
  const { slug } = route.params;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService.getBlogBySlug(slug)
      .then(res => {
        setBlog(res.blog);
        setRelated(res.related);
      })
      .catch(err => console.error('Error fetching blog detail:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  const onShare = async () => {
    if (!blog) return;
    try {
      await Share.share({
        message: `${blog.title}\nXem thêm tại ShopMall!`,
        title: blog.title,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View style={S.loading}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={S.empty}>
        <Text>Không tìm thấy bài viết.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={S.headerImageContainer}>
          {blog.thumbnail ? (
            <Image source={{ uri: blog.thumbnail }} style={S.headerImage} />
          ) : (
            <View style={[S.headerImage, S.placeholder]}>
              <Ionicons name="image-outline" size={60} color={C.inputBg} />
            </View>
          )}
          <TouchableOpacity style={S.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={S.shareButton} onPress={onShare}>
            <Ionicons name="share-social-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={S.content}>
          {/* Badge & Meta */}
          <View style={S.metaRow}>
            <View style={S.categoryBadge}>
              <Text style={S.categoryBadgeText}>{blog.category.name}</Text>
            </View>
            <Text style={S.date}>
              {format(new Date(blog.createdAt), 'dd MMMM, yyyy', { locale: vi })}
            </Text>
          </View>

          {/* Title */}
          <Text style={S.title}>{blog.title}</Text>

          {/* Author */}
          <View style={S.authorCard}>
            <View style={S.authorInfo}>
              <View style={S.avatarContainer}>
                {blog.author?.avatar ? (
                  <Image source={{ uri: blog.author.avatar }} style={S.avatar} />
                ) : (
                  <Text style={S.avatarText}>{blog.author?.name?.charAt(0) ?? 'A'}</Text>
                )}
              </View>
              <View>
                <Text style={S.authorName}>{blog.author?.name}</Text>
                <Text style={S.authorRole}>{blog.author?.storeName ?? 'Biên tập viên'}</Text>
              </View>
            </View>
            <View style={S.readTimeRow}>
              <Ionicons name="time-outline" size={14} color={C.textMuted} />
              <Text style={S.readTimeText}>{blog.readTime} phút đọc</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={S.htmlContent}>
            <RenderHTML
              contentWidth={W - (H_PAD * 2)}
              source={{ html: blog.content }}
              baseStyle={{
                fontSize: 16,
                lineHeight: 24,
                color: '#374151',
              }}
              tagsStyles={{
                p: { marginBottom: 16 },
                h1: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
                h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
                img: { borderRadius: 12, marginVertical: 10 },
                li: { marginBottom: 8 },
              }}
            />
          </View>

          {/* Related Blogs */}
          {related.length > 0 && (
            <View style={S.relatedSection}>
              <View style={S.relatedHeader}>
                <Text style={S.relatedTitle}>Bài viết liên quan</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Blog' })}>
                  <Text style={S.viewAll}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.relatedScroll}>
                {related.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={S.relatedCard}
                    onPress={() => navigation.push('BlogDetail', { slug: item.slug })}
                  >
                    <Image
                      source={item.thumbnail ? { uri: item.thumbnail } : require('@assets/adaptive-icon.png')}
                      style={S.relatedThumbnail}
                    />
                    <Text style={S.relatedCardTitle} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: H_PAD,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    color: C.textMuted,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    lineHeight: 32,
    marginBottom: 20,
  },
  authorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 24,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  authorRole: {
    fontSize: 12,
    color: C.textMuted,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '500',
  },
  htmlContent: {
    marginBottom: 30,
  },
  relatedSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 24,
    paddingBottom: 20,
  },
  relatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  relatedScroll: {
    gap: 12,
  },
  relatedCard: {
    width: 160,
  },
  relatedThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  relatedCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    lineHeight: 18,
  },
});
