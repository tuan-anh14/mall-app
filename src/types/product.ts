export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  brand: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  sku: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  featured: boolean;
  trending: boolean;
  badge: string | null;
  ratingAverage: number;
  reviewCount: number;
  image: string | null;
  seller: {
    id: string;
    storeName: string;
    isVerified: boolean;
    positiveRating: number;
  } | null;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  colors: Array<{ id: string; name: string; hexCode: string }>;
  sizes: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  validUntil: string | null;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
