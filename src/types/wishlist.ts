export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  badge: string | null;
  featured: boolean;
  trending: boolean;
  ratingAverage: number;
  reviewCount: number;
  category: string | null;
  brand: string;
  image: string | null;
  images: string[];
  colors: string[];
  sizes: string[];
  seller: {
    id: string;
    storeName: string;
    storeSlug: string;
    userId: string;
  } | null;
}

export interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

export interface WishlistResponse {
  items: WishlistItem[];
}
