export interface CartProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  status: string;
  badge: string | null;
  image: string | null;
  colors: Array<{ id: string; name: string; hexCode: string }>;
  sizes: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedColor: string | null;
  selectedSize: string | null;
  product: CartProduct;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface CartResponse {
  cart: Cart;
}

export interface CouponInfo {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  sellerId: string | null;
  sellerName: string | null;
}

export interface ApplyCouponResponse {
  discount: number;
  coupon: CouponInfo;
  cart: Cart;
}
