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
import { Colors, Shadows } from '@constants/theme';
import { Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');
const H_PAD = 16;
const C = Colors;
const S_CARD = Shadows.card;

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

  // Components
  const SectionHeader = ({ title, onMore }: { title: string; onMore?: () => void }) => (
    <View style={S.secRow}>
      <Text style={S.secTitle}>{title}</Text>
      {onMore && (
        <TouchableOpacity onPress={onMore} style={S.secMoreBtn}>
          <Text style={S.secMoreText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const FeaturedCarousel = ({ items }: { items: Blog[] }) => {
    if (!items.length) return null;
    return (
      <View style={S.carouselContainer}>
        <SectionHeader title="Tiêu biểu" />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={W - (H_PAD * 2) + 12}
          decelerationRate="fast"
          contentContainerStyle={S.carouselScroll}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })}
              style={S.featuredCard}
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail ?? undefined }} style={S.featuredImage} />
              ) : (
                <View style={[S.featuredCard, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="image-outline" size={48} color={C.textMuted} />
                </View>
              )}
              <View style={S.featuredOverlay} />
              <View style={S.featuredContent}>
                <View style={S.featuredBadge}>
                  <Text style={S.featuredBadgeText}>{item.category.name}</Text>
                </View>
                <Text style={S.featuredTitle} numberOfLines={2}>{item.title}</Text>
                <View style={S.featuredMeta}>
                  <Text style={S.featuredMetaText}>{item.author?.name} • {item.readTime} phút đọc</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const BlogSkeleton = () => (
    <View style={{ paddingHorizontal: H_PAD, gap: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={S.skeletonCard}>
          <View style={S.skeletonThumb} />
          <View style={{ padding: 12, gap: 8 }}>
            <View style={[S.skeletonLine, { width: '40%' }]} />
            <View style={S.skeletonLine} />
            <View style={[S.skeletonLine, { width: '60%' }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderBlogCard = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })}
      style={S.card}
    >
      <View style={S.cardRow}>
        <View style={S.cardInfo}>
          <View style={S.cardBadge}>
            <Text style={S.cardBadgeText}>{item.category.name}</Text>
          </View>
          <Text style={S.title} numberOfLines={2}>{item.title}</Text>
          <View style={S.metaRow}>
            <Text style={S.metaText}>{item.author?.name} • {item.readTime}m</Text>
          </View>
        </View>
        <View style={S.thumbnailWrap}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail ?? undefined }} style={S.thumbnail} />
          ) : (
            <View style={[S.thumbnail, S.thumbnailPlaceholder]}>
              <Ionicons name="image-outline" size={24} color={C.textMuted} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      {/* Search Header */}
      <View style={S.header}>
        <View style={S.searchArea}>
          <Ionicons name="search-outline" size={18} color={C.primary} style={S.searchIcon} />
          <TextInput
            placeholder="Tìm bài viết, kiến thức..."
            placeholderTextColor={C.textMuted}
            style={S.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchData(1, true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchData(1, true); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={blogs}
        keyExtractor={(item) => item.id}
        renderItem={renderBlogCard}
        contentContainerStyle={S.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <>
            {!search && activeCategory === '' && blogs.length > 0 && (
              <FeaturedCarousel items={blogs.slice(0, 3)} />
            )}

            {/* Categories */}
            <View style={S.categorySection}>
              <SectionHeader title="Danh mục" />
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
                    <Ionicons 
                      name="folder-outline" 
                      size={14} 
                      color={activeCategory === cat.slug ? '#fff' : C.primary} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[S.catChipText, activeCategory === cat.slug && S.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: H_PAD, marginTop: 24, marginBottom: 8 }}>
              <SectionHeader title={search ? `Kết quả cho "${search}"` : "Bài viết mới nhất"} />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <BlogSkeleton />
          ) : (
            <View style={S.empty}>
              <Ionicons name="document-text-outline" size={64} color={C.border} />
              <Text style={S.emptyTitle}>Chưa có bài viết</Text>
              <Text style={S.emptySub}>Thử tìm kiếm với từ khóa khác hoặc danh mục khác.</Text>
            </View>
          )
        }
        ListFooterComponent={
          page < totalPages ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 20 }} />
          ) : <View style={{ height: 40 }} />
        }
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
  },
  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  secMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  carouselContainer: {
    paddingVertical: 20,
    paddingHorizontal: H_PAD,
  },
  carouselScroll: {
    gap: 12,
  },
  featuredCard: {
    width: W - (H_PAD * 2),
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    ...S_CARD,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  categorySection: {
    paddingHorizontal: H_PAD,
    marginTop: 10,
  },
  catScroll: {
    gap: 8,
    paddingRight: 20,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  catChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSub,
  },
  catChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: H_PAD,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    ...S_CARD,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: C.textMuted,
  },
  thumbnailWrap: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  skeletonThumb: {
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
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
