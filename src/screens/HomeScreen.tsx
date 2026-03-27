import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { useCategories, usePromotions, useProducts } from '@hooks/useHome';
import { ProductCard, TrendingCard } from '@components/product/ProductCard';
import type { Product, Category, Promotion } from '@types/product';

const { width: W } = Dimensions.get('window');
const H_PAD   = 16;
const GAP     = 12;
const CARD_W  = (W - H_PAD * 2 - GAP) / 2;
const PROMO_W = W - H_PAD * 2;

// ─── Design tokens — mall-fe globals.css ──────────────
const C = {
  primary:       '#1A56DB',
  primaryDark:   '#1E3A8A',
  primaryLight:  '#EFF6FF',
  bg:            '#F3F4F6',   // --muted
  surface:       '#FFFFFF',
  inputBg:       '#F9FAFB',   // --input-background
  border:        '#E5E7EB',   // --border
  text:          '#1F2937',   // --foreground
  textSub:       '#6B7280',   // --muted-foreground
  textMuted:     '#9CA3AF',
  danger:        '#EF4444',   // --destructive
  star:          '#F59E0B',   // --chart-1
  ring:          '#3B82F6',   // --ring
};

const PROMO_THEMES = [
  { bg: '#1A56DB', blob: 'rgba(255,255,255,0.10)' },
  { bg: '#4F46E5', blob: 'rgba(255,255,255,0.10)' },
  { bg: '#0E7490', blob: 'rgba(255,255,255,0.10)' },
  { bg: '#065F46', blob: 'rgba(255,255,255,0.10)' },
];

// Category → Ionicons name
const CAT_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'điện tử':   'phone-portrait-outline',
  'thời trang':'shirt-outline',
  'giày':      'footsteps-outline',
  'túi':       'bag-handle-outline',
  'mỹ phẩm':  'color-palette-outline',
  'gia dụng':  'home-outline',
  'thể thao':  'barbell-outline',
  'sách':      'book-outline',
  'đồ chơi':   'game-controller-outline',
  'thực phẩm': 'nutrition-outline',
};

function catIcon(name: string): React.ComponentProps<typeof Ionicons>['name'] {
  const lower = name.toLowerCase();
  for (const k of Object.keys(CAT_MAP)) if (lower.includes(k)) return CAT_MAP[k];
  return 'grid-outline';
}

// ─── Skeleton ─────────────────────────────────────────

function Bone({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) {
  return <View style={{ width: (w as number) ?? '100%', height: h, borderRadius: r, backgroundColor: '#E5E7EB' }} />;
}

function SkeletonCard({ width }: { width: number }) {
  return (
    <View style={[SK.card, { width }]}>
      <Bone h={width} r={0} />
      <View style={{ padding: 12, gap: 7 }}>
        <Bone w="42%" h={9} />
        <Bone h={13} />
        <Bone w="60%" h={11} />
        <Bone w="36%" h={16} />
      </View>
    </View>
  );
}
function SkeletonGrid({ rows = 2 }: { rows?: number }) {
  return (
    <View style={{ gap: GAP }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={S.gridRow}>
          <SkeletonCard width={CARD_W} />
          <SkeletonCard width={CARD_W} />
        </View>
      ))}
    </View>
  );
}
function SkeletonTrend() {
  return (
    <View style={SK.trend}>
      <Bone h={160} r={0} />
      <View style={{ padding: 10, gap: 6 }}>
        <Bone h={12} /><Bone w="55%" h={11} /><Bone w="40%" h={14} />
      </View>
    </View>
  );
}

const SK = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  trend: { width: 160, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', marginRight: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
});

// ─── Section Header ───────────────────────────────────

type IonName = React.ComponentProps<typeof Ionicons>['name'];

function SectionHeader({
  icon, title, count, onMore,
}: {
  icon: IonName; title: string; count?: number; onMore?: () => void;
}) {
  return (
    <View style={S.secRow}>
      <View style={S.secLeft}>
        <View style={S.secIconBox}>
          <Ionicons name={icon} size={13} color={C.primary} />
        </View>
        <View>
          <Text style={S.secTitle}>{title}</Text>
          {count != null && count > 0 && <Text style={S.secCount}>{count} sản phẩm</Text>}
        </View>
      </View>
      {onMore && (
        <TouchableOpacity onPress={onMore} style={S.secMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={S.secMoreText}>Xem thêm</Text>
          <Ionicons name="chevron-forward" size={13} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Promo Banner Card ────────────────────────────────

function PromoBannerCard({ promo, index }: { promo: Promotion; index: number }) {
  const theme = PROMO_THEMES[index % PROMO_THEMES.length];
  const isPct = promo.type === 'PERCENTAGE';
  const label = isPct ? `${promo.value}%` : `$${promo.value}`;

  return (
    <TouchableOpacity
      style={[S.promoBanner, { backgroundColor: theme.bg, width: PROMO_W }]}
      activeOpacity={0.88}
      onPress={() =>
        Alert.alert(
          promo.code,
          promo.description ||
            (isPct
              ? `Giảm ${promo.value}% tất cả đơn hàng${promo.minOrderAmount ? ` từ $${promo.minOrderAmount}` : ''}`
              : `Giảm $${promo.value}${promo.minOrderAmount ? ` cho đơn từ $${promo.minOrderAmount}` : ''}`),
          [{ text: 'Đóng' }],
        )
      }
    >
      <View style={[S.promoBlob1, { backgroundColor: theme.blob }]} />
      <View style={[S.promoBlob2, { backgroundColor: theme.blob }]} />

      {/* Left */}
      <View style={S.promoLeft}>
        <View style={S.promoCodePill}>
          <Ionicons name="ticket-outline" size={11} color={theme.bg} />
          <Text style={[S.promoCode, { color: theme.bg }]}>{promo.code}</Text>
        </View>
        <Text style={S.promoDesc} numberOfLines={2}>
          {promo.description || (isPct ? `Giảm ${promo.value}% cho tất cả đơn hàng` : `Tiết kiệm $${promo.value} ngay hôm nay`)}
        </Text>
        {promo.validUntil && (
          <View style={S.promoExpiry}>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.65)" />
            <Text style={S.promoExpiryText}>HSD: {new Date(promo.validUntil).toLocaleDateString('vi-VN')}</Text>
          </View>
        )}
        <View style={S.promoHint}>
          <Text style={S.promoHintText}>Nhấn để xem mã</Text>
          <Ionicons name="arrow-forward-outline" size={11} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {/* Right — big discount number */}
      <View style={S.promoRight}>
        <Text style={S.promoValue}>{label}</Text>
        <Text style={S.promoOff}>OFF</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Promo auto-scroll ────────────────────────────────

function PromoSection({ promotions }: { promotions: Promotion[] }) {
  const flatRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const idxRef = useRef(0);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const t = setInterval(() => {
      const next = (idxRef.current + 1) % promotions.length;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      idxRef.current = next;
      setActiveIdx(next);
    }, 3600);
    return () => clearInterval(t);
  }, [promotions.length]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / PROMO_W);
    if (i !== idxRef.current) { idxRef.current = i; setActiveIdx(i); }
  }

  return (
    <View style={S.promoSection}>
      <SectionHeader icon="ticket-outline" title="Ưu đãi đặc biệt" />
      <FlatList
        ref={flatRef}
        data={promotions}
        keyExtractor={(p) => p.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={PROMO_W} snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll} scrollEventThrottle={16}
        renderItem={({ item, index }) => <PromoBannerCard promo={item} index={index} />}
        getItemLayout={(_, i) => ({ length: PROMO_W, offset: PROMO_W * i, index: i })}
      />
      {promotions.length > 1 && (
        <View style={S.dots}>
          {promotions.map((_, i) => (
            <View key={i} style={[S.dot, i === activeIdx && S.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Hero Banner ──────────────────────────────────────

function HeroBanner({ firstName }: { firstName?: string }) {
  return (
    <View style={S.hero}>
      <View style={S.heroCircle1} />
      <View style={S.heroCircle2} />
      <View style={{ flex: 1, gap: 8, zIndex: 1 }}>
        <Text style={S.heroTitle}>{firstName ? `Chào mừng, ${firstName}!` : 'Chào mừng đến MALL!'}</Text>
        <Text style={S.heroSub}>Hàng ngàn sản phẩm chất lượng từ các thương hiệu uy tín.</Text>
        <View style={S.heroBadge}>
          <Ionicons name="car-outline" size={12} color={C.primary} />
          <Text style={S.heroBadgeText}>Miễn phí giao hàng từ $50</Text>
        </View>
      </View>
      <View style={S.heroIllust}>
        <Ionicons name="storefront-outline" size={52} color={C.primary} style={{ opacity: 0.18 }} />
      </View>
    </View>
  );
}

// ─── Category Chip ────────────────────────────────────

function CategoryChip({ cat, selected, onPress }: { cat: Category; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[S.chip, selected && S.chipActive]} onPress={onPress} activeOpacity={0.72}>
      <View style={[S.chipIcon, selected && S.chipIconActive]}>
        <Ionicons name={catIcon(cat.name)} size={14} color={selected ? '#FFF' : C.primary} />
      </View>
      <Text style={[S.chipLabel, selected && S.chipLabelActive]} numberOfLines={1}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

// ─── Product Grid ─────────────────────────────────────

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <View style={{ gap: GAP }}>
      {Array.from({ length: Math.ceil(products.length / 2) }).map((_, r) => (
        <View key={r} style={S.gridRow}>
          <ProductCard product={products[r * 2]} width={CARD_W} />
          {products[r * 2 + 1]
            ? <ProductCard product={products[r * 2 + 1]} width={CARD_W} />
            : <View style={{ width: CARD_W }} />}
        </View>
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: IonName; title: string; sub?: string }) {
  return (
    <View style={S.empty}>
      <View style={S.emptyBox}>
        <Ionicons name={icon} size={30} color="#D1D5DB" />
      </View>
      <Text style={S.emptyTitle}>{title}</Text>
      {sub && <Text style={S.emptySub}>{sub}</Text>}
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────

export function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const isFiltered = debouncedSearch.length > 0 || selectedCat !== null;

  const { data: categories }                               = useCategories();
  const { data: promotions, isLoading: promoLoading }      = usePromotions();
  const { data: featuredData, isLoading: featuredLoading } = useProducts({ featured: true, limit: 6 }, !isFiltered);
  const { data: trendingData, isLoading: trendingLoading } = useProducts({ trending: true, limit: 8 }, !isFiltered);
  const { data: filteredData, isLoading: filteredLoading } = useProducts(
    { search: debouncedSearch || undefined, category: selectedCat || undefined, limit: 20 },
    isFiltered,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['promotions'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  function handleCatPress(id: string) {
    setSelectedCat((p) => (p === id ? null : id));
    setSearch(''); setDebounced('');
  }

  const firstName = user?.name?.split(' ')[0];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />}
      >

        {/* ══════════════════ HEADER ══════════════════ */}
        <View style={S.header}>

          {/* Row 1 — Brand + Greeting + Actions */}
          <View style={S.hRow}>

            {/* Logo mark */}
            <View style={S.logoMark}>
              <Text style={S.logoText}>M</Text>
            </View>

            {/* Greeting */}
            <View style={S.hGreeting}>
              <Text style={S.greetLabel} numberOfLines={1}>
                {firstName ? `Xin chào, ${firstName}` : 'Xin chào, bạn'}
              </Text>
              <Text style={S.greetSub}>Hôm nay bạn muốn mua gì?</Text>
            </View>

            {/* Action icons */}
            <View style={S.hActions}>
              <TouchableOpacity style={S.hIconBtn}>
                <Ionicons name="cart-outline" size={20} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity style={S.hIconBtn}>
                <Ionicons name="notifications-outline" size={20} color={C.text} />
                <View style={S.notifBadge} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2 — Search */}
          <View style={S.searchBar}>
            <Ionicons name="search-outline" size={16} color={C.primary} />
            <TextInput
              style={S.searchInput}
              placeholder="Tìm sản phẩm, thương hiệu..."
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 ? (
              <TouchableOpacity
                onPress={() => { setSearch(''); setDebounced(''); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color={C.textMuted} />
              </TouchableOpacity>
            ) : (
              <View style={S.filterWrap}>
                <View style={S.filterDivider} />
                <TouchableOpacity style={S.filterBtn}>
                  <Ionicons name="options-outline" size={15} color={C.primary} />
                  <Text style={S.filterLabel}>Lọc</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {/* ═══════════════ END HEADER ═══════════════ */}


        {/* ── CATEGORIES ──────────────────────────────── */}
        {categories && categories.length > 0 && (
          <View style={S.catsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catsScroll}>
              {selectedCat !== null && (
                <TouchableOpacity
                  style={[S.chip, S.chipActive, S.chipReset]}
                  onPress={() => setSelectedCat(null)}
                  activeOpacity={0.72}
                >
                  <Ionicons name="close-outline" size={14} color={C.primary} />
                  <Text style={[S.chipLabel, S.chipLabelActive]}>Tất cả</Text>
                </TouchableOpacity>
              )}
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id} cat={cat}
                  selected={selectedCat === cat.id}
                  onPress={() => handleCatPress(cat.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {isFiltered ? (

          /* ── SEARCH RESULTS ─────────────────────────── */
          <View style={S.section}>
            <SectionHeader
              icon="search-outline"
              title={debouncedSearch ? `"${debouncedSearch}"` : 'Kết quả lọc'}
              count={filteredData?.total}
            />
            {filteredLoading
              ? <SkeletonGrid rows={3} />
              : !filteredData?.products?.length
                ? <EmptyState icon="search-outline" title="Không tìm thấy kết quả" sub="Thử từ khóa hoặc danh mục khác" />
                : <ProductGrid products={filteredData.products} />}
          </View>

        ) : (
          <>

            {/* ── PROMO / HERO ─────────────────────────── */}
            <View style={S.section}>
              {promoLoading ? (
                <View style={{ gap: 14 }}>
                  <Bone w="46%" h={17} />
                  <Bone h={130} r={16} />
                </View>
              ) : promotions && promotions.length > 0 ? (
                <PromoSection promotions={promotions} />
              ) : (
                <HeroBanner firstName={firstName} />
              )}
            </View>

            {/* ── FEATURED ─────────────────────────────── */}
            <View style={S.section}>
              <SectionHeader icon="star-outline" title="Nổi bật" count={featuredData?.total} onMore={() => {}} />
              {featuredLoading
                ? <SkeletonGrid rows={2} />
                : !featuredData?.products?.length
                  ? <EmptyState icon="cube-outline" title="Chưa có sản phẩm nổi bật" />
                  : <ProductGrid products={featuredData.products} />}
            </View>

            {/* ── TRENDING ─────────────────────────────── */}
            <View style={S.section}>
              <SectionHeader icon="trending-up-outline" title="Xu hướng" onMore={() => {}} />
              {trendingLoading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {[0, 1, 2, 3].map((i) => <SkeletonTrend key={i} />)}
                </ScrollView>
              ) : !trendingData?.products?.length ? (
                <EmptyState icon="trending-up-outline" title="Chưa có sản phẩm xu hướng" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
                  {trendingData.products.map((p) => <TrendingCard key={p.id} product={p} />)}
                </ScrollView>
              )}
            </View>

          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // ════ HEADER ════════════════════════════════════════

  header: {
    backgroundColor: C.surface,
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },

  // Row 1: logo + greeting + actions
  hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Logo mark
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },

  // Greeting
  hGreeting: {
    flex: 1,
    gap: 3,
  },
  greetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  greetSub: {
    fontSize: 12,
    color: C.textSub,
    includeFontPadding: false,
  },

  // Action buttons
  hActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  hIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
    borderWidth: 1.5,
    borderColor: C.surface,
  },

  // Row 2: search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    padding: 0,
    margin: 0,
  },
  filterWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterDivider: { width: 1, height: 16, backgroundColor: C.border },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
  },
  filterLabel: { fontSize: 12, fontWeight: '700', color: C.primary },

  // ════ CATEGORIES ════════════════════════════════════

  catsWrap: {
    backgroundColor: C.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  catsScroll: {
    paddingHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 7,
    paddingRight: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipReset: { paddingLeft: 10 },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconActive: { backgroundColor: C.primary },
  chipLabel: { fontSize: 12, fontWeight: '500', color: C.textSub, maxWidth: 88 },
  chipLabelActive: { color: C.primary, fontWeight: '700' },

  // ════ SECTIONS ══════════════════════════════════════

  section: { paddingTop: 22, paddingHorizontal: H_PAD },

  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  secLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  secIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  secCount: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  secMore: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingTop: 5 },
  secMoreText: { fontSize: 12, fontWeight: '600', color: C.primary },

  // ════ GRID ══════════════════════════════════════════
  gridRow: { flexDirection: 'row', gap: GAP },

  // ════ PROMO ═════════════════════════════════════════

  promoSection: { gap: 0 },
  promoBanner: {
    height: 136,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7,
  },
  promoBlob1: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, right: -30, top: -42,
  },
  promoBlob2: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, right: 48, bottom: -52,
  },
  promoLeft: { flex: 1, gap: 6, zIndex: 1 },
  promoCodePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', backgroundColor: '#FFF',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  promoCode: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  promoDesc: { fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 19 },
  promoExpiry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promoExpiryText: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  promoHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  promoHintText: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  promoRight: { alignItems: 'center', zIndex: 1, minWidth: 64 },
  promoValue: { fontSize: 34, fontWeight: '900', color: '#FFF', lineHeight: 38, letterSpacing: -1 },
  promoOff: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 12 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D1D5DB' },
  dotActive: { width: 20, height: 5, borderRadius: 2.5, backgroundColor: C.primary },

  // ════ HERO ══════════════════════════════════════════

  hero: {
    backgroundColor: C.primaryLight,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  heroCircle1: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, right: -30, top: -45,
    backgroundColor: 'rgba(26,86,219,0.06)',
  },
  heroCircle2: {
    position: 'absolute', width: 80, height: 80,
    borderRadius: 40, left: -15, bottom: -25,
    backgroundColor: 'rgba(26,86,219,0.05)',
  },
  heroTitle: { fontSize: 15, fontWeight: '800', color: C.text, lineHeight: 22, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: C.textSub, lineHeight: 19 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', backgroundColor: '#DBEAFE',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginTop: 2,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: C.primaryDark },
  heroIllust: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },

  // ════ EMPTY ══════════════════════════════════════════

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },
});
