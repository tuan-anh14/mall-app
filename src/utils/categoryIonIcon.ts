import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type CategoryIonName = NonNullable<ComponentProps<typeof Ionicons>['name']>;

/** Slug chuẩn hóa: chữ thường, gạch ngang. */
function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, '-');
}

/** Tên icon Lucide / từ API → khóa tra cứu (kebab). */
function normalizeIconKey(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Theo slug danh mục (tiếng Anh / thường gặp). */
const SLUG_TO_ICON: Record<string, CategoryIonName> = {
  electronics: 'hardware-chip-outline',
  'dien-tu': 'hardware-chip-outline',
  fashion: 'shirt-outline',
  'thoi-trang': 'shirt-outline',
  clothing: 'shirt-outline',
  apparel: 'shirt-outline',
  'home-garden': 'home-outline',
  home: 'home-outline',
  'nha-cua': 'home-outline',
  'doi-song': 'home-outline',
  garden: 'leaf-outline',
  furniture: 'bed-outline',
  'noi-that': 'bed-outline',
  beauty: 'sparkles-outline',
  'lam-dep': 'sparkles-outline',
  cosmetics: 'color-palette-outline',
  'my-pham': 'color-palette-outline',
  sports: 'basketball-outline',
  'the-thao': 'basketball-outline',
  fitness: 'fitness-outline',
  books: 'book-outline',
  sach: 'book-outline',
  toys: 'game-controller-outline',
  'do-choi': 'game-controller-outline',
  baby: 'happy-outline',
  'me-va-be': 'happy-outline',
  food: 'restaurant-outline',
  'thuc-pham': 'restaurant-outline',
  grocery: 'cart-outline',
  'bach-hoa': 'cart-outline',
  automotive: 'car-outline',
  'o-to': 'car-outline',
  'xe-co': 'car-outline',
  vehicles: 'car-outline',
  health: 'medical-outline',
  'suc-khoe': 'medical-outline',
  jewelry: 'diamond-outline',
  'trang-suc': 'diamond-outline',
  watches: 'watch-outline',
  'dong-ho': 'watch-outline',
  office: 'briefcase-outline',
  'van-phong': 'briefcase-outline',
  pets: 'paw-outline',
  'thu-cung': 'paw-outline',
  music: 'musical-notes-outline',
  camera: 'camera-outline',
  default: 'grid-outline',
};

/** Theo trường `icon` kiểu Lucide / tên ngắn. */
const ICON_KEY_TO_ICON: Record<string, CategoryIonName> = {
  laptop: 'laptop-outline',
  computer: 'desktop-outline',
  desktop: 'desktop-outline',
  smartphone: 'phone-portrait-outline',
  mobile: 'phone-portrait-outline',
  phone: 'call-outline',
  tablet: 'tablet-portrait-outline',
  shirt: 'shirt-outline',
  shoe: 'footsteps-outline',
  shoes: 'footsteps-outline',
  bag: 'bag-handle-outline',
  handbag: 'bag-handle-outline',
  house: 'home-outline',
  sparkles: 'sparkles-outline',
  star: 'star-outline',
  book: 'book-outline',
  game: 'game-controller-outline',
  toy: 'cube-outline',
  car: 'car-outline',
  apple: 'nutrition-outline',
  heart: 'heart-outline',
  gift: 'gift-outline',
  image: 'image-outline',
  watch: 'watch-outline',
  diamond: 'diamond-outline',
  leaf: 'leaf-outline',
  flower: 'leaf-outline',
  baby: 'happy-outline',
  paw: 'paw-outline',
  dumbbell: 'barbell-outline',
  bicycle: 'bicycle-outline',
  plane: 'airplane-outline',
  ship: 'boat-outline',
  wrench: 'construct-outline',
  tools: 'hammer-outline',
  package: 'cube-outline',
  box: 'cube-outline',
  tag: 'pricetag-outline',
  headphones: 'headset-outline',
  keyboard: 'keypad-outline',
  mouse: 'hardware-chip-outline',
  monitor: 'tv-outline',
  tv: 'tv-outline',
  fridge: 'cube-outline',
  bed: 'bed-outline',
  chair: 'cube-outline',
  lamp: 'bulb-outline',
  utensil: 'restaurant-outline',
};

function iconFromSlug(ns: string): CategoryIonName | null {
  if (SLUG_TO_ICON[ns]) return SLUG_TO_ICON[ns];
  for (const part of ns.split('-')) {
    if (part && SLUG_TO_ICON[part]) return SLUG_TO_ICON[part];
  }
  return null;
}

/**
 * Chọn Ionicons cho danh mục. API có thể gửi tên Lucide trong `icon` và/hoặc `slug` tiếng Anh.
 */
export function resolveCategoryIonIcon(
  icon: string | null | undefined,
  slug: string,
): CategoryIonName {
  const fromSlug = iconFromSlug(normalizeSlug(slug));
  if (fromSlug) return fromSlug;

  const key = normalizeIconKey(icon);
  if (key && ICON_KEY_TO_ICON[key]) return ICON_KEY_TO_ICON[key];

  return SLUG_TO_ICON.default;
}
