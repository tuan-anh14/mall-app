import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { blogService } from '@services/blogService';
import { Blog, BlogCategory } from '@typings/blog';
import { RootStackParamList } from '@app/navigation/types';
import { Colors } from '@constants/theme';

const H_PAD = 16;
const C = Colors;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function BlogScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p = 1, shouldRefresh = false) => {
    if (p === 1) setLoading(true);
    try {
      const res = await blogService.getPublished({
        page: p,
        limit: 10,
        search: search || undefined,
        category: activeCategory || undefined,
      });
      
      if (shouldRefresh || p === 1) {
        setBlogs(res.blogs);
      } else {
        setBlogs(prev => [...prev, ...res.blogs]);
      }
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    blogService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(1, true);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1, true);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      const next = page + 1;
      setPage(next);
      fetchData(next);
    }
  };

  const renderBlogCard = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })}
      style={S.card}
    >
      <View style={S.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={S.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[S.thumbnail, S.thumbnailPlaceholder]}>
            <Ionicons name="book-outline" size={40} color={C.primaryLight} />
          </View>
        )}
        <View style={S.categoryBadge}>
          <Text style={S.categoryBadgeText}>{item.category.name}</Text>
        </View>
      </View>
      
      <View style={S.cardBody}>
        <Text style={S.title} numberOfLines={2}>{item.title}</Text>
        {item.summary && (
          <Text style={S.summary} numberOfLines={2}>{item.summary}</Text>
        )}
        
        <View style={S.metaRow}>
          <View style={S.authorRow}>
            <View style={S.authorAvatar}>
              {item.author?.avatar ? (
                <Image source={{ uri: item.author.avatar }} style={S.avatar} />
              ) : (
                <Text style={S.avatarText}>{item.author?.name?.charAt(0) ?? 'A'}</Text>
              )}
            </View>
            <Text style={S.authorName}>{item.author?.name}</Text>
          </View>
          
          <View style={S.metaInfo}>
            <View style={S.metaItem}>
              <Ionicons name="time-outline" size={12} color={C.textMuted} />
              <Text style={S.metaText}>{item.readTime}m</Text>
            </View>
            <View style={S.metaItem}>
              <Ionicons name="eye-outline" size={12} color={C.textMuted} />
              <Text style={S.metaText}>{item.views.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.container} edges={['bottom']}>
      <FlatList
        data={blogs}
        keyExtractor={(item) => item.id}
        renderItem={renderBlogCard}
        contentContainerStyle={S.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={S.hero}>
              <View style={S.heroCircle1} />
              <View style={S.heroCircle2} />
              <View style={S.heroContent}>
                <View style={S.heroBadge}>
                  <Ionicons name="book" size={12} color="#fff" />
                  <Text style={S.heroBadgeText}>Blog & Insights</Text>
                </View>
                <Text style={S.heroTitle}>Khám phá Kiến thức &{"\n"}Tin tức Mua sắm</Text>
                
                <View style={S.searchContainer}>
                  <Ionicons name="search" size={18} color={C.textMuted} style={S.searchIcon} />
                  <TextInput
                    placeholder="Tìm kiếm bài viết..."
                    placeholderTextColor="#9CA3AF"
                    style={S.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={() => fetchData(1, true)}
                  />
                </View>
              </View>
            </View>

            {/* Categories */}
            <View style={S.categoryBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catScroll}>
                <TouchableOpacity
                  style={[S.catChip, !activeCategory && S.catChipActive]}
                  onPress={() => setActiveCategory('')}
                >
                  <Text style={[S.catChipText, !activeCategory && S.catChipTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[S.catChip, activeCategory === cat.slug && S.catChipActive]}
                    onPress={() => setActiveCategory(cat.slug)}
                  >
                    <Text style={[S.catChipText, activeCategory === cat.slug && S.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={S.loading}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : (
            <View style={S.empty}>
              <Ionicons name="book-outline" size={64} color={C.inputBg} />
              <Text style={S.emptyTitle}>Chưa có bài viết</Text>
              <Text style={S.emptySub}>Thử tìm kiếm với từ khóa khác hoặc danh mục khác.</Text>
            </View>
          )
        }
        ListFooterComponent={
          page < totalPages ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  hero: {
    backgroundColor: '#1E3A8A',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: H_PAD,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -50,
    right: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -30,
    left: -20,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  searchContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
  },
  categoryBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  catScroll: {
    paddingHorizontal: H_PAD,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  catChipActive: {
    backgroundColor: C.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },
  catChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: H_PAD,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  summary: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 18,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: C.textMuted,
  },
  loading: {
    paddingVertical: 50,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
