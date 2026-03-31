import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  RefreshControl,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@hooks/useAuth';
import { useCategories, usePromotions, useProducts } from '@hooks/useHome';
import { ProductCard } from '@components/product/ProductCard';
import { Colors } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import type { TabParamList } from '@app/navigation/types';
import type { Product, Category, Promotion } from '@typings/product';
import { formatVnd } from '@utils/index';

/** Ngưỡng gợi ý miễn phí vận chuyển (đồng). */
const FREE_SHIPPING_FROM_VND = 1_200_000;

// ─── Layout constants ─────────────────────────────────

const { width: W } = Dimensions.get('window');
const CARD_MX  = 12;   // card horizontal margin
const H_PAD    = 16;   // padding inside cards
const GAP      = 12;   // grid gap
const INNER_W  = W - CARD_MX * 2 - H_PAD * 2;
const CARD_W   = (INNER_W - GAP) / 2;
const PROMO_W  = INNER_W;

const C = Colors;

const POPUP_KEY   = 'promo_popup_last_date';
const CAROUSEL_MS = 5000;

const TRUST_BADGES = [
  { icon: 'car-outline'                as const, label: 'Miễn phí vận chuyển' },
  { icon: 'shield-checkmark-outline'   as const, label: 'Thanh toán an toàn'  },
  { icon: 'flash-outline'              as const, label: 'Giao hàng nhanh'     },
  { icon: 'headset-outline'            as const, label: 'Hỗ trợ 24/7'         },
];

const PROMO_THEMES = [
  { bg: '#1A56DB' },
  { bg: '#4F46E5' },
  { bg: '#0E7490' },
  { bg: '#065F46' },
];

type IonName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Skeleton ─────────────────────────────────────────

const SK = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
});

function Bone({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) {
  return (
    <View style={{ width: (w as number) ?? '100%', height: h, borderRadius: r, backgroundColor: '#E5E7EB' }} />
  );
}

function SkeletonCard({ width }: { width: number }) {
  return (
    <View style={[SK.card, { width }]}>
      <Bone h={width * 0.9} r={0} />
      <View style={{ padding: 12, gap: 7 }}>
        <Bone w="40%" h={9} />
        <Bone h={13} />
        <Bone w="55%" h={11} />
        <Bone w="35%" h={16} />
      </View>
    </View>
  );
}

function SkeletonGrid() {
  return (
    <View style={{ gap: GAP }}>
      {[0, 1].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: GAP }}>
          <SkeletonCard width={CARD_W} />
          <SkeletonCard width={CARD_W} />
        </View>
      ))}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────

function SectionHeader({
  icon, title, count, onMore,
}: {
  icon: IonName; title: string; count?: number; onMore?: () => void;
}) {
  return (
    <View style={S.secRow}>
      <View style={S.secLeft}>
        <View style={S.secIconBox}>
          <Ionicons name={icon} size={14} color={C.primary} />
        </View>
        <View style={{ gap: 1 }}>
          <Text style={S.secTitle}>{title}</Text>
          {count != null && count > 0 && (
            <Text style={S.secCount}>{count} sản phẩm</Text>
          )}
        </View>
      </View>
      {onMore && (
        <TouchableOpacity
          onPress={onMore}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={S.secMoreBtn}
        >
          <Text style={S.secMoreText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={12} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Hero Carousel ────────────────────────────────────

const CAROUSEL_H = 200;

function HeroCarousel({ products }: { products: Product[] }) {
  const flatRef   = useRef<FlatList>(null);
  const [idx, setIdx] = useState(0);
  const idxRef    = useRef(0);
  const slides    = products.filter((p) => p.image);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      const next = (idxRef.current + 1) % slides.length;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      idxRef.current = next;
      setIdx(next);
    }, CAROUSEL_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== idxRef.current) { idxRef.current = i; setIdx(i); }
  }

  if (!slides.length) return null;

  return (
    <View style={S.carouselWrap}>
      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(p) => p.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={W} snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll} scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.94} style={S.slide}>
            <Image
              source={{ uri: item.image! }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={S.slideGrad} />
            <View style={S.slideInfo}>
              {(item.badge || item.discount) ? (
                <View style={S.slidePill}>
                  <Text style={S.slidePillText}>
                    {item.badge ?? `−${item.discount}%`}
                  </Text>
                </View>
              ) : null}
              <Text style={S.slideName} numberOfLines={1}>{item.name}</Text>
              <Text style={S.slidePrice}>{formatVnd(item.price)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {slides.length > 1 && (
        <View style={S.dotRow}>
          {slides.map((_, i) => (
            <View key={i} style={[S.dot, i === idx && S.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Hero Banner (fallback) ───────────────────────────

function HeroBanner({ firstName }: { firstName?: string }) {
  return (
    <View style={S.heroBanner}>
      <View style={S.heroCircle1} />
      <View style={S.heroCircle2} />
      <View style={{ flex: 1, gap: 6, zIndex: 1 }}>
        <Text style={S.heroTitle}>
          {firstName ? `Xin chào, ${firstName}!` : 'Chào mừng đến MALL!'}
        </Text>
        <Text style={S.heroSub}>Hàng ngàn sản phẩm từ các thương hiệu uy tín.</Text>
        <View style={S.heroBadge}>
          <Ionicons name="car-outline" size={12} color={C.primary} />
          <Text style={S.heroBadgeText}>
            Miễn phí vận chuyển từ {formatVnd(FREE_SHIPPING_FROM_VND)}
          </Text>
        </View>
      </View>
      <Ionicons
        name="storefront-outline" size={56} color={C.primary}
        style={{ opacity: 0.15, zIndex: 1 }}
      />
    </View>
  );
}

// ─── Trust Badges ─────────────────────────────────────

function TrustBadges() {
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={S.trustScroll}
    >
      {TRUST_BADGES.map((b) => (
        <View key={b.label} style={S.trustItem}>
          <View style={S.trustIconBox}>
            <Ionicons name={b.icon} size={17} color={C.primary} />
          </View>
          <Text style={S.trustLabel}>{b.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Category Card ────────────────────────────────────

function CategoryCard({
  cat, selected, onPress,
}: { cat: Category; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[S.catCard, selected && S.catCardActive]}
      onPress={onPress} activeOpacity={0.75}
    >
      <Text style={S.catEmoji}>{cat.icon || '🛍️'}</Text>
      <Text style={[S.catName, selected && S.catNameActive]} numberOfLines={1}>
        {cat.name}
      </Text>
      {cat.productCount > 0 && (
        <Text style={[S.catCount, selected && S.catCountActive]}>
          {cat.productCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Product Grid ─────────────────────────────────────

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <View style={{ gap: GAP }}>
      {Array.from({ length: Math.ceil(products.length / 2) }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: GAP }}>
          <ProductCard product={products[r * 2]} width={CARD_W} />
          {products[r * 2 + 1]
            ? <ProductCard product={products[r * 2 + 1]} width={CARD_W} />
            : <View style={{ width: CARD_W }} />}
        </View>
      ))}
    </View>
  );
}

// ─── Promo Banner Card ────────────────────────────────

function PromoBannerCard({
  promo, index, onShop,
}: { promo: Promotion; index: number; onShop: () => void }) {
  const bg   = PROMO_THEMES[index % PROMO_THEMES.length].bg;
  const isPct = promo.type === 'PERCENTAGE';
  const label = isPct
    ? `${promo.value}%`
    : formatVnd(Number(promo.value));

  return (
    <View style={[S.promoBanner, { backgroundColor: bg, width: PROMO_W }]}>
      {/* decorative circles */}
      <View style={[S.promoCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
      <View style={[S.promoCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

      <View style={S.promoBody}>
        {/* code pill */}
        <View style={S.promoCodePill}>
          <Ionicons name="ticket-outline" size={11} color={bg} />
          <Text style={[S.promoCode, { color: bg }]}>{promo.code}</Text>
        </View>
        <Text style={S.promoDesc} numberOfLines={2}>
          {promo.description || (isPct
            ? `Giảm ${promo.value}% cho tất cả đơn hàng`
            : `Tiết kiệm ${formatVnd(Number(promo.value))} ngay hôm nay`)}
        </Text>
        {promo.validUntil && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.6)" />
            <Text style={S.promoExpiry}>
              HSD: {new Date(promo.validUntil).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
        <TouchableOpacity style={S.promoBtn} onPress={onShop} activeOpacity={0.85}>
          <Text style={[S.promoBtnText, { color: bg }]}>Mua ngay</Text>
          <Ionicons name="arrow-forward" size={12} color={bg} />
        </TouchableOpacity>
      </View>

      {/* big discount number */}
      <View style={S.promoAside}>
        <Text style={S.promoValue}>{label}</Text>
        <Text style={S.promoOff}>OFF</Text>
      </View>
    </View>
  );
}

// ─── Promo Section (auto-scroll) ──────────────────────

function PromoSection({ promotions, onShop }: { promotions: Promotion[]; onShop: () => void }) {
  const flatRef   = useRef<FlatList>(null);
  const [idx, setIdx] = useState(0);
  const idxRef    = useRef(0);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const t = setInterval(() => {
      const next = (idxRef.current + 1) % promotions.length;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      idxRef.current = next;
      setIdx(next);
    }, 3800);
    return () => clearInterval(t);
  }, [promotions.length]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / PROMO_W);
    if (i !== idxRef.current) { idxRef.current = i; setIdx(i); }
  }

  return (
    <>
      <FlatList
        ref={flatRef}
        data={promotions}
        keyExtractor={(p) => p.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={PROMO_W} snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll} scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <PromoBannerCard promo={item} index={index} onShop={onShop} />
        )}
        getItemLayout={(_, i) => ({ length: PROMO_W, offset: PROMO_W * i, index: i })}
      />
      {promotions.length > 1 && (
        <View style={[S.dotRow, { marginTop: 10 }]}>
          {promotions.map((_, i) => (
            <View key={i} style={[S.dot, i === idx && S.dotActive]} />
          ))}
        </View>
      )}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: IonName; title: string; sub?: string }) {
  return (
    <View style={S.empty}>
      <View style={S.emptyBox}>
        <Ionicons name={icon} size={28} color="#D1D5DB" />
      </View>
      <Text style={S.emptyTitle}>{title}</Text>
      {sub && <Text style={S.emptySub}>{sub}</Text>}
    </View>
  );
}

// ─── Promo Popup (1 lần/ngày) ─────────────────────────

function PromoPopup({ promo, onClose, onShop }: {
  promo: Promotion; onClose: () => void; onShop: () => void;
}) {
  const isPct  = promo.type === 'PERCENTAGE';
  const label = isPct
    ? `${promo.value}% OFF`
    : `${formatVnd(Number(promo.value))} OFF`;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={PP.overlay}>
        <View style={PP.card}>
          <TouchableOpacity
            style={PP.closeBtn} onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={C.textMuted} />
          </TouchableOpacity>

          <View style={PP.iconWrap}>
            <Ionicons name="gift-outline" size={28} color="#FFF" />
          </View>

          <Text style={PP.heading}>Ưu đãi hôm nay!</Text>
          <Text style={PP.discount}>{label}</Text>
          <Text style={PP.desc} numberOfLines={3}>
            {promo.description || (isPct
              ? `Giảm ${promo.value}% cho tất cả đơn hàng`
              : `Tiết kiệm ${formatVnd(Number(promo.value))} ngay hôm nay`)}
          </Text>

          <View style={PP.codePill}>
            <Ionicons name="ticket-outline" size={14} color={C.primary} />
            <Text style={PP.code}>{promo.code}</Text>
          </View>

          <View style={PP.meta}>
            {promo.minOrderAmount != null && (
              <Text style={PP.metaText}>
                Đơn tối thiểu {formatVnd(Number(promo.minOrderAmount))}
              </Text>
            )}
            {promo.validUntil && (
              <Text style={PP.metaText}>
                HSD: {new Date(promo.validUntil).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </View>

          <TouchableOpacity style={PP.cta} onPress={onShop} activeOpacity={0.88}>
            <Text style={PP.ctaText}>Mua ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ paddingVertical: 8 }}>
            <Text style={PP.skip}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── HomeScreen ───────────────────────────────────────

export function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();

  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const isFiltered = debouncedSearch.length > 0 || selectedCat !== null;

  const { data: categories } = useCategories();
  const { data: promotions, isLoading: promoLoading } = usePromotions();

  const { data: featuredData, isLoading: featuredLoading } = useProducts(
    { featured: true, limit: 4 }, !isFiltered,
  );
  const { data: trendingData, isLoading: trendingLoading } = useProducts(
    { trending: true, limit: 4 }, !isFiltered,
  );
  const { data: recoData, isLoading: recoLoading } = useProducts(
    { sort: 'popular', limit: 6 }, !isFiltered && isAuthenticated,
  );
  const { data: filteredData, isLoading: filteredLoading } = useProducts(
    { search: debouncedSearch || undefined, category: selectedCat || undefined, limit: 20 },
    isFiltered,
  );

  // promo popup — once per day
  useEffect(() => {
    async function checkPopup() {
      if (!promotions?.length) return;
      const today  = new Date().toISOString().slice(0, 10);
      const stored = await SecureStore.getItemAsync(POPUP_KEY).catch(() => null);
      if (stored !== today) {
        setPopupVisible(true);
        await SecureStore.setItemAsync(POPUP_KEY, today).catch(() => {});
      }
    }
    checkPopup();
  }, [promotions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.promotions }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  function handleCatPress(id: string) {
    setSelectedCat((p) => (p === id ? null : id));
    setSearch('');
    setDebounced('');
  }

  function goToSearch() { nav.navigate('Search'); }

  const firstName    = user?.name?.split(' ')[0];
  const featuredList = featuredData?.products ?? [];
  const hasCarousel  = featuredList.some((p) => p.image);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={S.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.primary} colors={[C.primary]}
          />
        }
      >

        {/* ══ 1. HEADER (sticky) ══════════════════════ */}
        <View style={S.header}>
          {/* Row: logo + greeting + actions */}
          <View style={S.hRow}>
            <View style={S.logoMark}>
              <Text style={S.logoText}>M</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={S.greetName} numberOfLines={1}>
                {firstName ? `Xin chào, ${firstName}` : 'Xin chào, bạn'}
              </Text>
              <Text style={S.greetSub}>Hôm nay bạn muốn mua gì?</Text>
            </View>
          </View>

          {/* Search bar */}
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
              <View style={S.filterSep}>
                <View style={S.filterLine} />
                <TouchableOpacity style={S.filterBtn} onPress={goToSearch}>
                  <Ionicons name="options-outline" size={15} color={C.primary} />
                  <Text style={S.filterLabel}>Lọc</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {/* ══ END HEADER ══════════════════════════════ */}


        {isFiltered ? (

          /* ══ FILTER MODE ══════════════════════════════ */
          <>
            {/* Category filter chips */}
            {categories && categories.length > 0 && (
              <View style={S.card}>
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={S.chipScroll}
                >
                  {selectedCat !== null && (
                    <TouchableOpacity
                      style={[S.chip, S.chipActive]}
                      onPress={() => setSelectedCat(null)}
                      activeOpacity={0.72}
                    >
                      <Ionicons name="close-outline" size={13} color={C.primary} />
                      <Text style={[S.chipLabel, S.chipLabelActive]}>Tất cả</Text>
                    </TouchableOpacity>
                  )}
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[S.chip, selectedCat === cat.id && S.chipActive]}
                      onPress={() => handleCatPress(cat.id)}
                      activeOpacity={0.72}
                    >
                      <Text style={S.chipEmoji}>{cat.icon || '🛍️'}</Text>
                      <Text
                        style={[S.chipLabel, selectedCat === cat.id && S.chipLabelActive]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Results */}
            <View style={S.cardPad}>
              <SectionHeader
                icon="search-outline"
                title={debouncedSearch ? `"${debouncedSearch}"` : 'Kết quả lọc'}
                count={filteredData?.total}
              />
              <View style={{ height: 14 }} />
              {filteredLoading
                ? <SkeletonGrid />
                : !filteredData?.products?.length
                  ? <EmptyState icon="search-outline" title="Không tìm thấy kết quả" sub="Thử từ khóa hoặc danh mục khác" />
                  : <ProductGrid products={filteredData.products} />}
            </View>
          </>

        ) : (

          /* ══ HOME MODE ════════════════════════════════ */
          <>

            {/* ── 2. HERO CAROUSEL ─────────────────────── */}
            {featuredLoading ? (
              <View style={{ height: CAROUSEL_H + 26, backgroundColor: '#E5E7EB' }} />
            ) : hasCarousel ? (
              <HeroCarousel products={featuredList} />
            ) : (
              <View style={S.cardPad}>
                <HeroBanner firstName={firstName} />
              </View>
            )}

            {/* ── 3. TRUST BADGES ──────────────────────── */}
            <View style={S.card}>
              <TrustBadges />
            </View>

            {/* ── 4. DANH MỤC ──────────────────────────── */}
            {categories && categories.length > 0 && (
              <View style={S.card}>
                <View style={S.secRowPad}>
                  <SectionHeader icon="grid-outline" title="Danh mục" onMore={goToSearch} />
                </View>
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={S.catScroll}
                >
                  {categories.map((cat) => (
                    <CategoryCard
                      key={cat.id} cat={cat}
                      selected={selectedCat === cat.id}
                      onPress={() => handleCatPress(cat.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── 5. SẢN PHẨM NỔI BẬT ─────────────────── */}
            <View style={S.cardPad}>
              <SectionHeader
                icon="star-outline"
                title="Sản phẩm nổi bật"
                count={featuredData?.total}
                onMore={goToSearch}
              />
              <View style={{ height: 14 }} />
              {featuredLoading
                ? <SkeletonGrid />
                : !featuredData?.products?.length
                  ? <EmptyState icon="cube-outline" title="Chưa có sản phẩm nổi bật" />
                  : <ProductGrid products={featuredList.slice(0, 4)} />}
            </View>

            {/* ── 6. BANNER KHUYẾN MÃI ─────────────────── */}
            {!promoLoading && promotions && promotions.length > 0 && (
              <View style={S.cardPad}>
                <SectionHeader icon="ticket-outline" title="Ưu đãi đặc biệt" />
                <View style={{ height: 14 }} />
                <PromoSection promotions={promotions} onShop={goToSearch} />
              </View>
            )}

            {/* ── 7. GỢI Ý CHO BẠN (chỉ khi đã đăng nhập) */}
            {isAuthenticated && (
              <View style={S.card}>
                <View style={S.secRowPad}>
                  <SectionHeader
                    icon="sparkles-outline"
                    title="Gợi ý cho bạn"
                    onMore={goToSearch}
                  />
                </View>
                {recoLoading ? (
                  <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[S.recoScroll, { gap: 12 }]}
                  >
                    {[0, 1, 2].map((i) => <SkeletonCard key={i} width={CARD_W} />)}
                  </ScrollView>
                ) : recoData?.products?.length ? (
                  <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={S.recoScroll}
                  >
                    {recoData.products.map((p) => (
                      <ProductCard key={p.id} product={p} width={CARD_W} />
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            )}

            {/* ── 9. XU HƯỚNG HIỆN TẠI ─────────────────── */}
            <View style={S.cardPad}>
              <SectionHeader
                icon="trending-up-outline"
                title="Xu hướng hiện tại"
                onMore={goToSearch}
              />
              <View style={{ height: 14 }} />
              {trendingLoading
                ? <SkeletonGrid />
                : !trendingData?.products?.length
                  ? <EmptyState icon="trending-up-outline" title="Chưa có sản phẩm xu hướng" />
                  : <ProductGrid products={trendingData.products.slice(0, 4)} />}
            </View>

          </>
        )}
      </ScrollView>

      {/* ── POPUP KHUYẾN MÃI ─────────────────────────── */}
      {popupVisible && promotions && promotions.length > 0 && (
        <PromoPopup
          promo={promotions[0]}
          onClose={() => setPopupVisible(false)}
          onShop={() => { setPopupVisible(false); goToSearch(); }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const CARD_SHADOW = {
  shadowColor: '#000' as string,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
};

const S = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 32 },

  // ── HEADER ────────────────────────────────────────────

  header: {
    backgroundColor: C.surface,
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    ...CARD_SHADOW,
    zIndex: 10,
  },

  hRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoMark: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  logoText:  { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, includeFontPadding: false },
  greetName: { fontSize: 14, fontWeight: '700', color: C.text, includeFontPadding: false },
  greetSub:  { fontSize: 11, color: C.textMuted, includeFontPadding: false },

  hActions:  { flexDirection: 'row', gap: 8 },
  hIconBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.danger, borderWidth: 1.5, borderColor: C.surface,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 10,
    paddingLeft: 12, paddingRight: 6, paddingVertical: 10,
    gap: 8, borderWidth: 1, borderColor: C.border,
  },
  searchInput:  { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  filterSep:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLine:   { width: 1, height: 14, backgroundColor: C.border },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7,
    backgroundColor: C.primaryLight,
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: C.primary },

  // ── CARDS (section containers) ────────────────────────

  // White card — scrollable content (no h-padding, scroll provides its own)
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginHorizontal: CARD_MX,
    marginTop: 10,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },

  // White card — padded content (grid, text)
  cardPad: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginHorizontal: CARD_MX,
    marginTop: 10,
    padding: H_PAD,
    ...CARD_SHADOW,
  },

  // Padding wrapper inside a `card` for the section header
  secRowPad: {
    paddingHorizontal: H_PAD,
    paddingTop: H_PAD,
    paddingBottom: 10,
  },

  // ── SECTION HEADER ────────────────────────────────────

  secRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  secTitle:   { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  secCount:   { fontSize: 10, color: C.textMuted },
  secMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  secMoreText: { fontSize: 12, fontWeight: '600', color: C.primary },

  // ── HERO CAROUSEL ─────────────────────────────────────

  carouselWrap: { backgroundColor: C.bg },
  slide: {
    width: W, height: CAROUSEL_H,
    backgroundColor: '#E5E7EB', overflow: 'hidden',
  },
  slideGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 96,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  slideInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14, gap: 3,
  },
  slidePill: {
    alignSelf: 'flex-start', backgroundColor: '#EF4444',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginBottom: 3,
  },
  slidePillText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  slideName:     { fontSize: 14, fontWeight: '700', color: '#FFF', lineHeight: 20 },
  slidePrice:    { fontSize: 15, fontWeight: '900', color: '#FFF' },

  // ── DOTS ──────────────────────────────────────────────

  dotRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 5, paddingVertical: 8,
  },
  dot:       { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D1D5DB' },
  dotActive: { width: 18, height: 5, borderRadius: 2.5, backgroundColor: C.primary },

  // ── HERO BANNER (fallback) ─────────────────────────────

  heroBanner: {
    backgroundColor: C.primaryLight, borderRadius: 12,
    padding: 18, flexDirection: 'row', alignItems: 'center',
    gap: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#BFDBFE',
  },
  heroCircle1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: -20, top: -35, backgroundColor: 'rgba(26,86,219,0.06)' },
  heroCircle2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, left: -10, bottom: -20, backgroundColor: 'rgba(26,86,219,0.05)' },
  heroTitle:   { fontSize: 14, fontWeight: '800', color: C.text, lineHeight: 20 },
  heroSub:     { fontSize: 12, color: C.textSub, lineHeight: 18 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: '#DBEAFE',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '600', color: C.primaryDark },

  // ── TRUST BADGES ──────────────────────────────────────

  trustScroll: {
    paddingHorizontal: H_PAD, paddingVertical: 14, gap: 10,
  },
  trustItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.inputBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  trustIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  trustLabel: { fontSize: 12, fontWeight: '600', color: C.text, flexShrink: 1 },

  // ── CATEGORY ──────────────────────────────────────────

  catScroll: {
    paddingHorizontal: H_PAD, paddingBottom: H_PAD, gap: 8,
  },
  catCard: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.inputBg,
    minWidth: 72,
  },
  catCardActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  catEmoji:      { fontSize: 24 },
  catName:       { fontSize: 10, fontWeight: '600', color: C.textSub, textAlign: 'center' },
  catNameActive: { color: C.primary },
  catCount:      { fontSize: 10, color: C.textMuted },
  catCountActive: { color: C.primary, fontWeight: '600' },

  // ── FILTER CHIPS ──────────────────────────────────────

  chipScroll: {
    paddingHorizontal: H_PAD, paddingVertical: 12, gap: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingLeft: 8, paddingRight: 11, paddingVertical: 6,
    borderRadius: 20, backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border,
  },
  chipActive:     { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipEmoji:      { fontSize: 13 },
  chipLabel:      { fontSize: 12, fontWeight: '500', color: C.textSub },
  chipLabelActive:{ color: C.primary, fontWeight: '700' },

  // ── PROMO BANNER ──────────────────────────────────────

  promoBanner: {
    height: 136, borderRadius: 14, padding: 18,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  promoCircle1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: -25, top: -40 },
  promoCircle2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, right: 40, bottom: -48 },
  promoBody: { flex: 1, gap: 4, zIndex: 1 },
  promoCodePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: '#FFF',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  promoCode:   { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  promoDesc:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
  promoExpiry: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
  },
  promoBtnText: { fontSize: 11, fontWeight: '800' },
  promoAside:  { alignItems: 'center', zIndex: 1, minWidth: 56 },
  promoValue:  { fontSize: 30, fontWeight: '900', color: '#FFF', lineHeight: 34, letterSpacing: -1 },
  promoOff:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 3 },

  // ── RECO SCROLL ───────────────────────────────────────

  recoScroll: {
    paddingHorizontal: H_PAD, paddingBottom: H_PAD, gap: 12,
  },

  // ── EMPTY ─────────────────────────────────────────────

  empty:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyBox:  { width: 56, height: 56, borderRadius: 16, backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: 13, fontWeight: '700', color: C.text },
  emptySub:  { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});

// ── Popup Styles ──────────────────────────────────────

const PP = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', backgroundColor: C.surface,
    borderRadius: 24, padding: 24, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 16,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 10, elevation: 7,
  },
  heading:  { fontSize: 17, fontWeight: '800', color: C.text },
  discount: { fontSize: 32, fontWeight: '900', color: C.primary, letterSpacing: -0.5, lineHeight: 38 },
  desc:     { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 19 },
  codePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: '#BFDBFE',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, marginTop: 4,
  },
  code:     { fontSize: 15, fontWeight: '900', color: C.primary, letterSpacing: 1.5 },
  meta:     { alignItems: 'center', gap: 2, marginTop: 2 },
  metaText: { fontSize: 11, color: C.textMuted },
  cta: {
    width: '100%', backgroundColor: C.primary,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  ctaText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  skip:    { fontSize: 12, color: C.textMuted, textDecorationLine: 'underline' },
});
