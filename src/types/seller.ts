export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  averageRating: number;
  totalReviews: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  images: string[];
  status: string;
  category: { id: string; name: string } | null;
  categoryId: string | null;
  discount: number | null;
  rating: number | null;
  totalReviews: number;
  colors: string[];
  sizes: string[];
  brand: string | null;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: string;
  images?: string[];
  discount?: number;
  colors?: string[];
  sizes?: string[];
  brand?: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface SellerOrderItem {
  productName: string;
  quantity: number;
  price: number;
  selectedColor: string | null;
  selectedSize: string | null;
  productImage: string | null;
}

export interface SellerOrder {
  id: string;
  date: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  paymentMethod: string;
  buyerName: string;
  buyerEmail: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string | null;
  };
  items: SellerOrderItem[];
}

export interface SellerOrdersResponse {
  orders: SellerOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SellerCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CreateCouponDto {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
}

export type UpdateCouponDto = Partial<CreateCouponDto> & { isActive?: boolean };

export interface SellerReviewReply {
  id: string;
  text: string;
  createdAt: string;
}

export interface SellerReview {
  id: string;
  rating: number;
  comment: string;
  emoji: string | null;
  buyerName: string;
  buyerAvatar: string | null;
  productName: string;
  productId: string;
  createdAt: string;
  reply: SellerReviewReply | null;
}

export interface SellerReviewsResponse {
  reviews: SellerReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
