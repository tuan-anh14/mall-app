export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURNED';

export type RevenueStatus = 'UNPAID' | 'PENDING' | 'RELEASED' | 'REFUNDED';

export interface OrderTrackingStep {
  status: string;
  label: string;
  description: string | null;
  date: string | null;
  completed: boolean;
  isCurrent: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  sellerOrderId?: string;
  sellerId?: string;
  sellerName?: string;
  quantity: number;
  price: number;
  selectedColor: string | null;
  selectedSize: string | null;
  productName: string;
  productImage: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    status: string;
  } | null;
}

export interface OrderShippingAddress {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponDiscount: number | null;
  revenueStatus?: RevenueStatus;
  seller?: {
    id: string;
    storeName: string;
  };
  paymentMethod: string;
  paymentRef: string | null;
  shippingAddress: OrderShippingAddress;
  estimatedDelivery: string | null;
  notes: string | null;
  items: OrderItem[];
  tracking: {
    current: string;
    steps: OrderTrackingStep[];
  };
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
