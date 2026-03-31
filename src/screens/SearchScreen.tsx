import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCategories, useInfiniteProducts } from '@hooks/useHome';
import { ProductCard } from '@components/product/ProductCard';
import { Colors } from '@constants/theme';
import type { Category, Product } from '@typings/product';
import type { GetProductsParams } from '@services/productService';
import { resolveCategoryIonIcon } from '@utils/categoryIonIcon';

// ─── Layout ───────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const CARD_MX = 12;
const GAP     = 12;
const CARD_W  = (W - CARD_MX * 2 - GAP) / 2;

const C = Colors;

// ─── Sort options ─────────────────────────────────────

type SortKey = NonNullable<GetProductsParams['sort']> | 'popular';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular',    label: 'Phổ biến nhất'  },
  { key: 'newest',     label: 'Mới nhất'        },
  { key: 'rating',     label: 'Đánh giá cao'    },
  { key: 'price_asc',  label: 'Giá thấp → cao' },
  { key: 'price_desc', label: 'Giá cao → thấp' },
];

type IonName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Skeleton ─────────────────────────────────────────

const SK = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
});

function Bone({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) {
  return (
    <View
      style={{ width: (w as number) ?? '100%', height: h, borderRadius: r, backgroundColor: '#E5E7EB' }}
    />
  );
}

function SkeletonGrid() {
  return (
    <View style={{
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: CARD_MX, gap: GAP, paddingTop: 10,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[SK.card, { width: CARD_W }]}>
          <Bone h={CARD_W * 0.9} r={0} />
          <View style={{ padding: 12, gap: 7 }}>
            <Bone w="40%" h={9} />
            <Bone h={13} />
            <Bone w="55%" h={11} />
            <Bone w="35%" h={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <View style={S.empty}>
      <View style={S.emptyIconBox}>
        <Ionicons name={'search-outline' as IonName} size={32} color="#D1D5DB" />
      </View>
      <Text style={S.emptyTitle}>Không tìm thấy sản phẩm</Text>
      <Text style={S.emptySub}>Thử thay đổi từ khóa hoặc xóa bộ lọc</Text>
      <TouchableOpacity style={S.emptyClearBtn} onPress={onClear} activeOpacity={0.8}>
        <Text style={S.emptyClearText}>Xóa bộ lọc</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Active Filter Tags ───────────────────────────────

interface ActiveTagsProps {
  query: string;
  catName: string | null;
  minPrice: string;
  maxPrice: string;
  sort: SortKey;
  onRemoveQuery: () => void;
  onRemoveCat: () => void;
  onRemovePrice: () => void;
  onRemoveSort: () => void;
  onClearAll: () => void;
}

function ActiveTags({
  query, catName, minPrice, maxPrice, sort,
  onRemoveQuery, onRemoveCat, onRemovePrice, onRemoveSort, onClearAll,
}: ActiveTagsProps) {
  const tags: { label: string; onRemove: () => void }[] = [];
  if (query)                tags.push({ label: `"${query}"`,   onRemove: onRemoveQuery });
  if (catName)              tags.push({ label: catName,         onRemove: onRemoveCat  });
  if (minPrice || maxPrice) tags.push({
    label: `${minPrice ? Number(minPrice).toLocaleString('vi') : '0'}đ – ${maxPrice ? Number(maxPrice).toLocaleString('vi') : '∞'}đ`,
    onRemove: onRemovePrice,
  });
  if (sort !== 'popular') tags.push({
    label: SORT_OPTIONS.find((o) => o.key === sort)?.label ?? sort,
    onRemove: onRemoveSort,
  });

  if (!tags.length) return null;

  return (
    <View style={S.tagsRow}>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.tagsScroll}
        keyboardShouldPersistTaps="handled"
      >
        {tags.map((t) => (
          <TouchableOpacity key={t.label} style={S.tag} onPress={t.onRemove} activeOpacity={0.75}>
            <Text style={S.tagText} numberOfLines={1}>{t.label}</Text>
            <Ionicons name={'close' as IonName} size={12} color={C.primary} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={S.tagClear} onPress={onClearAll} activeOpacity={0.75}>
          <Text style={S.tagClearText}>Xóa tất cả</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Sort Menu (slide-up sheet) ───────────────────────

function SortMenu({
  visible, current, onSelect, onClose,
}: {
  visible: boolean;
  current: SortKey;
  onSelect: (k: SortKey) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={S.sortOverlay} activeOpacity={1} onPress={onClose} />
      <View style={S.sortSheet}>
        <View style={S.sheetHandle} />
        <Text style={S.sortTitle}>Sắp xếp theo</Text>
        {SORT_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={S.sortItem}
            onPress={() => { onSelect(o.key); onClose(); }}
            activeOpacity={0.75}
          >
            <Text style={[S.sortItemText, o.key === current && S.sortItemActive]}>
              {o.label}
            </Text>
            {o.key === current && (
              <Ionicons name={'checkmark-circle' as IonName} size={18} color={C.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ─── Filter Bottom Sheet ──────────────────────────────

interface FilterValues {
  catId: string | null;
  minPrice: string;
  maxPrice: string;
}

function FilterSheet({
  visible, categories, initial, onApply, onClose,
}: {
  visible: boolean;
  categories: Category[];
  initial: FilterValues;
  onApply: (v: FilterValues) => void;
  onClose: () => void;
}) {
  const [catId, setCatId]       = useState(initial.catId);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);

  useEffect(() => {
    if (visible) {
      setCatId(initial.catId);
      setMinPrice(initial.minPrice);
      setMaxPrice(initial.maxPrice);
    }
  }, [visible, initial.catId, initial.minPrice, initial.maxPrice]);

  function handleReset() {
    setCatId(null);
    setMinPrice('');
    setMaxPrice('');
  }

  const activeCount = [catId, minPrice || maxPrice].filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={FS.wrap}>
        <TouchableOpacity style={FS.overlay} activeOpacity={1} onPress={onClose} />

        <View style={FS.sheet}>
          <View style={FS.handle} />

          {/* Header */}
          <View style={FS.header}>
            <Text style={FS.title}>Bộ lọc</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={'close' as IonName} size={22} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Danh mục */}
            <View style={FS.section}>
              <Text style={FS.secTitle}>Danh mục</Text>
              {categories.map((cat) => {
                const active = catId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={FS.checkRow}
                    onPress={() => setCatId(active ? null : cat.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[FS.checkbox, active && FS.checkboxActive]}>
                      {active && (
                        <Ionicons name={'checkmark' as IonName} size={13} color="#FFF" />
                      )}
                    </View>
                    <View style={FS.checkIconWrap}>
                      <Ionicons
                        name={resolveCategoryIonIcon(cat.icon, cat.slug)}
                        size={18}
                        color={active ? C.primary : C.textSub}
                      />
                    </View>
                    <Text
                      style={[FS.checkLabel, active && FS.checkLabelActive]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    {cat.productCount > 0 && (
                      <Text style={FS.checkCount}>{cat.productCount}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Khoảng giá */}
            <View style={FS.section}>
              <Text style={FS.secTitle}>Khoảng giá</Text>
              <View style={FS.priceRow}>
                <View style={FS.priceInput}>
                  <Text style={FS.priceLabel}>Từ</Text>
                  <TextInput
                    style={FS.priceField}
                    placeholder="0"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <Text style={FS.priceSuffix}>đ</Text>
                </View>
                <View style={FS.priceDash} />
                <View style={FS.priceInput}>
                  <Text style={FS.priceLabel}>Đến</Text>
                  <TextInput
                    style={FS.priceField}
                    placeholder="∞"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                  <Text style={FS.priceSuffix}>đ</Text>
                </View>
              </View>

              {/* Quick presets */}
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginTop: 12, paddingBottom: 4 }}
              >
                {[
                  { label: 'Dưới 100k', min: '',        max: '100000'  },
                  { label: '100k–500k', min: '100000',  max: '500000'  },
                  { label: '500k–1tr',  min: '500000',  max: '1000000' },
                  { label: 'Trên 1tr',  min: '1000000', max: ''        },
                ].map((p) => {
                  const active = minPrice === p.min && maxPrice === p.max;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[FS.preset, active && FS.presetActive]}
                      onPress={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[FS.presetText, active && FS.presetTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={FS.footer}>
            <TouchableOpacity style={FS.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={FS.resetText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={FS.applyBtn}
              onPress={() => onApply({ catId, minPrice, maxPrice })}
              activeOpacity={0.88}
            >
              <Text style={FS.applyText}>
                {activeCount > 0 ? `Áp dụng (${activeCount})` : 'Áp dụng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── SearchScreen ─────────────────────────────────────

export function SearchScreen() {
  const [search, setSearch]         = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [catId, setCatId]           = useState<string | null>(null);
  const [sort, setSort]             = useState<SortKey>('popular');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible]     = useState(false);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 380);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories = [] } = useCategories();

  const queryParams = useMemo(
    (): Omit<GetProductsParams, 'page' | 'limit'> => ({
      search:   debouncedQ || undefined,
      category: catId      || undefined,
      sort:     sort === 'popular' ? undefined : sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [debouncedQ, catId, sort, minPrice, maxPrice],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts(queryParams);

  const products = useMemo<Product[]>(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const catName = useMemo(
    () => categories.find((c) => c.id === catId)?.name ?? null,
    [categories, catId],
  );

  const filterCount = [catId, minPrice || maxPrice, sort !== 'popular' ? sort : null]
    .filter(Boolean).length;

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Sắp xếp';

  function clearAll() {
    setSearch(''); setDebouncedQ('');
    setCatId(null);
    setSort('popular');
    setMinPrice(''); setMaxPrice('');
  }

  function applyFilter(v: FilterValues) {
    setCatId(v.catId);
    setMinPrice(v.minPrice);
    setMaxPrice(v.maxPrice);
    setFilterVisible(false);
  }

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} width={CARD_W} />,
    [],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ══ STICKY TOP ══════════════════════════════ */}
      <View style={S.stickyTop}>

        {/* Search bar */}
        <View style={S.searchWrap}>
          <View style={S.searchBar}>
            <Ionicons name={'search-outline' as IonName} size={16} color={C.primary} />
            <TextInput
              style={S.searchInput}
              placeholder="Tìm sản phẩm, thương hiệu..."
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearch(''); setDebouncedQ(''); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={'close-circle' as IonName} size={17} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter + Sort bar */}
        <View style={S.controlBar}>
          {/* Bộ lọc */}
          <TouchableOpacity
            style={[S.ctrlBtn, filterCount > 0 && S.ctrlBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={'options-outline' as IonName} size={15}
              color={filterCount > 0 ? C.primary : C.textSub}
            />
            <Text style={[S.ctrlBtnText, filterCount > 0 && S.ctrlBtnTextActive]}>
              Bộ lọc
            </Text>
            {filterCount > 0 && (
              <View style={S.ctrlBadge}>
                <Text style={S.ctrlBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={S.sep} />

          {/* Sắp xếp */}
          <TouchableOpacity
            style={S.sortBtn}
            onPress={() => setSortVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name={'swap-vertical-outline' as IonName} size={15} color={C.textSub} />
            <Text style={S.sortBtnText} numberOfLines={1}>{sortLabel}</Text>
            <Ionicons name={'chevron-down' as IonName} size={13} color={C.textMuted} />
          </TouchableOpacity>

          {/* Count */}
          {total > 0 && (
            <>
              <View style={S.sep} />
              <Text style={S.countText}>{products.length}/{total}</Text>
            </>
          )}
        </View>

        {/* Active tags */}
        <ActiveTags
          query={debouncedQ}
          catName={catName}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          onRemoveQuery={() => { setSearch(''); setDebouncedQ(''); }}
          onRemoveCat={() => setCatId(null)}
          onRemovePrice={() => { setMinPrice(''); setMaxPrice(''); }}
          onRemoveSort={() => setSort('popular')}
          onClearAll={clearAll}
        />
      </View>
      {/* ══ END STICKY TOP ══════════════════════════ */}

      {/* ══ PRODUCT LIST ════════════════════════════ */}
      {isLoading ? (
        <SkeletonGrid />
      ) : (
        <FlatList
          data={products}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={S.columnWrapper}
          contentContainerStyle={S.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState onClear={clearAll} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={S.footerLoad}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={S.footerLoadText}>Đang tải thêm...</Text>
              </View>
            ) : !hasNextPage && products.length > 0 ? (
              <View style={S.footerEnd}>
                <Text style={S.footerEndText}>
                  Đã hiển thị tất cả {total} sản phẩm
                </Text>
              </View>
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* ══ MODALS ══════════════════════════════════ */}
      <SortMenu
        visible={sortVisible}
        current={sort}
        onSelect={setSort}
        onClose={() => setSortVisible(false)}
      />

      <FilterSheet
        visible={filterVisible}
        categories={categories}
        initial={{ catId, minPrice, maxPrice }}
        onApply={applyFilter}
        onClose={() => setFilterVisible(false)}
      />

    </SafeAreaView>
  );
}

// ─── Main Styles ──────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // ── Sticky top ────────────────────────────────────────

  stickyTop: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 6, zIndex: 10,
  },

  searchWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 10,
    paddingLeft: 12, paddingRight: 8, paddingVertical: 10,
    gap: 8, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text, padding: 0 },

  // ── Control bar ──────────────────────────────────────

  controlBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 10, gap: 8,
  },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 8, backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border,
  },
  ctrlBtnActive:     { backgroundColor: C.primaryLight, borderColor: C.primary },
  ctrlBtnText:       { fontSize: 12, fontWeight: '600', color: C.textSub },
  ctrlBtnTextActive: { color: C.primary },
  ctrlBadge: {
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  ctrlBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  sep: { width: 1, height: 16, backgroundColor: C.border },

  sortBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 8, backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border,
  },
  sortBtnText: { flex: 1, fontSize: 12, fontWeight: '500', color: C.textSub },

  countText: { fontSize: 11, color: C.textMuted, flexShrink: 0 },

  // ── Active tags ──────────────────────────────────────

  tagsRow:   { paddingBottom: 8 },
  tagsScroll:{ paddingHorizontal: 14, gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16, maxWidth: 160,
  },
  tagText:  { fontSize: 11, fontWeight: '600', color: C.primary },
  tagClear: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16,
    backgroundColor: C.dangerLight, borderWidth: 1, borderColor: C.dangerBorder,
  },
  tagClearText: { fontSize: 11, fontWeight: '600', color: C.danger },

  // ── Product list ────────────────────────────────────

  listContent:   { paddingTop: 10, paddingBottom: 32 },
  columnWrapper: { paddingHorizontal: CARD_MX, gap: GAP, marginBottom: GAP },

  // ── Empty ────────────────────────────────────────────

  empty: {
    alignItems: 'center', paddingTop: 60, paddingBottom: 40,
    gap: 12, paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub:      { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyClearBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, backgroundColor: C.primary,
  },
  emptyClearText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // ── Footer ───────────────────────────────────────────

  footerLoad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 20,
  },
  footerLoadText: { fontSize: 12, color: C.textMuted },
  footerEnd:      { alignItems: 'center', paddingVertical: 20 },
  footerEndText:  { fontSize: 12, color: C.textMuted },

  // ── Sort sheet ───────────────────────────────────────

  sortOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sortSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginVertical: 12,
  },
  sortTitle: {
    fontSize: 13, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },
  sortItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sortItemText:   { fontSize: 15, color: C.text, fontWeight: '500' },
  sortItemActive: { color: C.primary, fontWeight: '700' },
});

// ─── Filter Sheet Styles ──────────────────────────────

const FS = StyleSheet.create({
  wrap:    { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 17, fontWeight: '800', color: C.text },

  section: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  secTitle: {
    fontSize: 12, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12,
  },

  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive:   { backgroundColor: C.primary, borderColor: C.primary },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  checkLabel:       { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  checkLabelActive: { color: C.primary, fontWeight: '700' },
  checkCount:       { fontSize: 12, color: C.textMuted },

  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border, gap: 4,
  },
  priceLabel:  { fontSize: 11, color: C.textMuted },
  priceField:  { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  priceSuffix: { fontSize: 12, color: C.textMuted },
  priceDash:   { width: 10, height: 1.5, backgroundColor: C.border },

  preset: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
  },
  presetActive:     { backgroundColor: C.primaryLight, borderColor: C.primary },
  presetText:       { fontSize: 12, color: C.textSub, fontWeight: '500' },
  presetTextActive: { color: C.primary, fontWeight: '700' },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  resetBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  resetText: { fontSize: 14, fontWeight: '700', color: C.textSub },
  applyBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  applyText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
