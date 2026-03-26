import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { useCategories, usePromotions, useProducts } from '@hooks/useHome';
import { ProductCard, TrendingCard } from '@components/product/ProductCard';
import type { Product, Category, Promotion } from '@types/product';

const { width: W } = Dimensions.get('window');
const H_PAD = 20;
const GRID_GAP = 12;
const CARD_W = (W - H_PAD * 2 - GRID_GAP) / 2;

const PROMO_PALETTE = [
  { bg: '#1A56DB', accent: 'rgba(255,255,255,0.18)', text: '#fff', sub: 'rgba(255,255,255,0.75)' },
  { bg: '#7C3AED', accent: 'rgba(255,255,255,0.15)', text: '#fff', sub: 'rgba(255,255,255,0.75)' },
  { bg: '#047857', accent: 'rgba(255,255,255,0.15)', text: '#fff', sub: 'rgba(255,255,255,0.75)' },
  { bg: '#B45309', accent: 'rgba(255,255,255,0.15)', text: '#fff', sub: 'rgba(255,255,255,0.75)' },
];

// ─────────────────── Skeleton ───────────────────────

function Skeleton({ w, h, radius = 10 }: { w?: number | string; h: number; radius?: number }) {
  return (
    <View
      style={{
        width: (w as number) ?? '100%',
        height: h,
        borderRadius: radius,
        backgroundColor: '#E9ECF0',
      }}
    />
  );
}

function SkeletonProductCard({ width }: { width: number }) {
  return (
    <View
      style={{
        width,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      <Skeleton h={width} radius={0} />
      <View style={{ padding: 10, gap: 7 }}>
        <Skeleton h={11} />
        <Skeleton w="65%" h={10} />
        <Skeleton w="45%" h={14} />
      </View>
    </View>
  );
}

function SkeletonTrendingCard() {
  return (
    <View
      style={{
        width: 148,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      <Skeleton h={148} radius={0} />
      <View style={{ padding: 10, gap: 7 }}>
        <Skeleton h={11} />
        <Skeleton w="55%" h={13} />
      </View>
    </View>
  );
}

// ─────────────────── Section Header ─────────────────

function SectionHeader({
  title,
  count,
  onMore,
}: {
  title: string;
  count?: number;
  onMore?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ gap: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null && count > 0 && (
          <Text style={styles.sectionCount}>{count} sản phẩm</Text>
        )}
      </View>
      {onMore && (
        <TouchableOpacity onPress={onMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeMore}>Xem thêm →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────── Promo Banner Card ──────────────

function PromoBannerCard({ promo, index }: { promo: Promotion; index: number }) {
  const palette = PROMO_PALETTE[index % PROMO_PALETTE.length];
  const isPercent = promo.type === 'PERCENTAGE';
  const discountLabel = isPercent ? `${promo.value}%` : `$${promo.value}`;

  function handlePress() {
    Alert.alert(
      '🎟️ Mã giảm giá',
      `${promo.code}\n\n${promo.description || (isPercent
        ? `Giảm ${promo.value}%${promo.minOrderAmount ? ` cho đơn từ $${promo.minOrderAmount}` : ''}`
        : `Giảm $${promo.value}${promo.minOrderAmount ? ` cho đơn từ $${promo.minOrderAmount}` : ''}`
      )}\n\nSao chép mã trên để dùng khi thanh toán.`,
      [{ text: 'Đóng', style: 'cancel' }],
    );
  }

  return (
    <TouchableOpacity
      style={[styles.promoBannerCard, { backgroundColor: palette.bg }]}
      activeOpacity={0.88}
      onPress={handlePress}
    >
      {/* Decorative circle */}
      <View
        style={[
          styles.promoDecorCircle,
          { backgroundColor: palette.accent },
        ]}
      />
      <View style={[styles.promoDecorCircle2, { backgroundColor: palette.accent }]} />

      <View style={styles.promoBody}>
        {/* Left */}
        <View style={styles.promoLeft}>
          <Text style={[styles.promoCode, { color: palette.text }]}>{promo.code}</Text>
          <Text style={[styles.promoDesc, { color: palette.sub }]} numberOfLines={2}>
            {promo.description ||
              (isPercent
                ? `Giảm ${promo.value}%${promo.minOrderAmount ? ` đơn từ $${promo.minOrderAmount}` : ''}`
                : `Giảm $${promo.value}${promo.minOrderAmount ? ` đơn từ $${promo.minOrderAmount}` : ''}`)}
          </Text>
          {promo.validUntil && (
            <Text style={[styles.promoExpiry, { color: palette.sub }]}>
              HSD: {new Date(promo.validUntil).toLocaleDateString('vi-VN')}
            </Text>
          )}
          <View style={[styles.tapHint, { borderColor: palette.text + '60' }]}>
            <Text style={[styles.tapHintText, { color: palette.text }]}>Nhấn xem mã</Text>
          </View>
        </View>

        {/* Right — discount value */}
        <View style={styles.promoRight}>
          <Text style={[styles.promoDiscountValue, { color: palette.text }]}>
            {discountLabel}
          </Text>
          <Text style={[styles.promoOffLabel, { color: palette.sub }]}>OFF</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────── Default Hero ───────────────────

function HeroBanner({ userName }: { userName?: string }) {
  return (
    <View style={styles.heroBanner}>
      <View style={styles.heroBannerDecor} />
      <View style={{ flex: 1, gap: 6, zIndex: 1 }}>
        <Text style={styles.heroTitle}>
          {userName ? `Xin chào, ${userName}! 👋` : 'Chào mừng đến MALL! 🛍️'}
        </Text>
        <Text style={styles.heroSubtitle}>
          Khám phá hàng ngàn sản phẩm chất lượng từ các thương hiệu uy tín.
        </Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>✨ Miễn phí giao hàng từ $50</Text>
        </View>
      </View>
      <Text style={styles.heroEmoji}>🏪</Text>
    </View>
  );
}

// ─────────────────── Category Chip ──────────────────

function CategoryChip({
  cat,
  selected,
  onPress,
}: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.catChip, selected && styles.catChipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {!!cat.icon && <Text style={styles.catIcon}>{cat.icon}</Text>}
      <Text style={[styles.catName, selected && styles.catNameSelected]}>{cat.name}</Text>
      {cat.productCount > 0 && (
        <View style={[styles.catBadge, selected && styles.catBadgeSelected]}>
          <Text style={[styles.catBadgeText, selected && styles.catBadgeTextSelected]}>
            {cat.productCount > 99 ? '99+' : cat.productCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────── Product Grid (2-col) ───────────

function ProductGrid({ products }: { products: Product[] }) {
  const rows: [Product, Product | null][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push([products[i], products[i + 1] ?? null]);
  }
  return (
    <View style={{ gap: GRID_GAP }}>
      {rows.map((pair, i) => (
        <View key={i} style={styles.gridRow}>
          <ProductCard product={pair[0]} width={CARD_W} />
          {pair[1] ? (
            <ProductCard product={pair[1]} width={CARD_W} />
          ) : (
            <View style={{ width: CARD_W }} />
          )}
        </View>
      ))}
    </View>
  );
}

function SkeletonProductGrid({ rows = 2 }: { rows?: number }) {
  return (
    <View style={{ gap: GRID_GAP }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.gridRow}>
          <SkeletonProductCard width={CARD_W} />
          <SkeletonProductCard width={CARD_W} />
        </View>
      ))}
    </View>
  );
}

// ─────────────────── Empty State ────────────────────

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─────────────────── HomeScreen ─────────────────────

export function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const isFiltered = debouncedSearch.length > 0 || selectedCat !== null;

  // Data queries
  const { data: categories } = useCategories();
  const { data: promotions, isLoading: promoLoading } = usePromotions();

  const { data: featuredData, isLoading: featuredLoading } = useProducts(
    { featured: true, limit: 6 },
    !isFiltered,
  );
  const { data: trendingData, isLoading: trendingLoading } = useProducts(
    { trending: true, limit: 8 },
    !isFiltered,
  );
  const { data: filteredData, isLoading: filteredLoading } = useProducts(
    {
      search: debouncedSearch || undefined,
      category: selectedCat || undefined,
      limit: 20,
    },
    isFiltered,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    await queryClient.invalidateQueries({ queryKey: ['promotions'] });
    setRefreshing(false);
  }, [queryClient]);

  function handleCatPress(id: string) {
    setSelectedCat((prev) => (prev === id ? null : id));
    setSearch('');
    setDebouncedSearch('');
  }

  function clearSearch() {
    setSearch('');
    setDebouncedSearch('');
  }

  const firstName = user?.name?.split(' ')[0];

  // ── render ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1A56DB"
            colors={['#1A56DB']}
          />
        }
      >
        {/* ════ STICKY HEADER ════ */}
        <View style={styles.stickyTop}>
          {/* Top row: greeting + logo */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting} numberOfLines={1}>
                {firstName ? `Xin chào, ${firstName} 👋` : 'Xin chào! 👋'}
              </Text>
              <Text style={styles.tagline}>Hôm nay bạn muốn mua gì?</Text>
            </View>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIconTxt}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ════ CATEGORIES ════ */}
        {categories && categories.length > 0 && (
          <View style={styles.catsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catsScroll}
            >
              {/* "Tất cả" reset chip */}
              {selectedCat !== null && (
                <TouchableOpacity
                  style={[styles.catChip, styles.catChipSelected]}
                  onPress={() => setSelectedCat(null)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catName, styles.catNameSelected]}>✕ Tất cả</Text>
                </TouchableOpacity>
              )}
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  cat={cat}
                  selected={selectedCat === cat.id}
                  onPress={() => handleCatPress(cat.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {isFiltered ? (
          /* ════ SEARCH / FILTER RESULTS ════ */
          <View style={styles.section}>
            <SectionHeader
              title={debouncedSearch ? `"${debouncedSearch}"` : 'Sản phẩm'}
              count={filteredData?.total}
            />
            {filteredLoading ? (
              <SkeletonProductGrid rows={3} />
            ) : !filteredData?.products.length ? (
              <EmptyState
                emoji="🔍"
                title="Không tìm thấy kết quả"
                subtitle="Thử từ khóa khác hoặc chọn danh mục khác"
              />
            ) : (
              <ProductGrid products={filteredData.products} />
            )}
          </View>
        ) : (
          <>
            {/* ════ PROMOTIONS / HERO ════ */}
            <View style={styles.section}>
              {promoLoading ? (
                <View style={styles.promoScroll}>
                  <Skeleton h={120} radius={20} />
                </View>
              ) : promotions && promotions.length > 0 ? (
                <>
                  <SectionHeader title="🎟️ Khuyến mãi" />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={W - H_PAD * 2 - 24 + 12}
                    snapToAlignment="start"
                    contentContainerStyle={styles.promoScroll}
                  >
                    {promotions.map((p, i) => (
                      <PromoBannerCard key={p.id} promo={p} index={i} />
                    ))}
                  </ScrollView>
                </>
              ) : (
                <HeroBanner userName={firstName} />
              )}
            </View>

            {/* ════ FEATURED ════ */}
            <View style={styles.section}>
              <SectionHeader title="⭐ Nổi bật" count={featuredData?.total} />
              {featuredLoading ? (
                <SkeletonProductGrid rows={2} />
              ) : !featuredData?.products.length ? (
                <EmptyState emoji="📦" title="Chưa có sản phẩm nổi bật" />
              ) : (
                <ProductGrid products={featuredData.products} />
              )}
            </View>

            {/* ════ TRENDING ════ */}
            <View style={styles.section}>
              <SectionHeader title="🔥 Xu hướng" />
              {trendingLoading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonTrendingCard key={i} />
                  ))}
                </ScrollView>
              ) : !trendingData?.products.length ? (
                <EmptyState emoji="📈" title="Chưa có sản phẩm xu hướng" />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingScroll}
                >
                  {trendingData.products.map((p) => (
                    <TrendingCard key={p.id} product={p} />
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}

        {/* Bottom space for tab bar */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FA' },

  // ── Sticky top ──────────────────────────────────
  stickyTop: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  logoLetter: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchIconTxt: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
    margin: 0,
  },
  clearTxt: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // ── Categories ───────────────────────────────────
  catsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  catsScroll: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: 'row',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1A56DB',
  },
  catIcon: { fontSize: 14 },
  catName: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  catNameSelected: { color: '#1A56DB', fontWeight: '700' },
  catBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  catBadgeSelected: { backgroundColor: '#BFDBFE' },
  catBadgeText: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  catBadgeTextSelected: { color: '#1A56DB' },

  // ── Sections ─────────────────────────────────────
  section: {
    paddingTop: 20,
    paddingHorizontal: H_PAD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  seeMore: {
    fontSize: 13,
    color: '#1A56DB',
    fontWeight: '600',
    marginTop: 3,
  },

  // ── Grid ─────────────────────────────────────────
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },

  // ── Promo banners ─────────────────────────────────
  promoScroll: {
    gap: 12,
    paddingBottom: 2,
  },
  promoBannerCard: {
    width: W - H_PAD * 2 - 24,
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  promoDecorCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -40,
    top: -40,
  },
  promoDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    right: 40,
    bottom: -50,
  },
  promoBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  promoLeft: { flex: 1, gap: 5, zIndex: 1 },
  promoCode: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  promoDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  promoExpiry: {
    fontSize: 11,
    marginTop: 2,
  },
  tapHint: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  tapHintText: { fontSize: 11, fontWeight: '600' },
  promoRight: {
    alignItems: 'center',
    zIndex: 1,
    minWidth: 70,
  },
  promoDiscountValue: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  promoOffLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── Hero Banner ───────────────────────────────────
  heroBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
    gap: 12,
  },
  heroBannerDecor: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(26,86,219,0.06)',
    right: -30,
    top: -40,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 23,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  heroEmoji: { fontSize: 52 },

  // ── Trending ──────────────────────────────────────
  trendingScroll: {
    paddingBottom: 2,
  },

  // ── Empty state ───────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
