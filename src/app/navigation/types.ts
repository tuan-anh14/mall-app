import { type NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  BecomeSeller: undefined;
  Addresses: undefined;
  AddressForm: { addressId?: string };
  Settings: undefined;
  Orders: undefined;
  Wishlist: undefined;
  Wallet: undefined;
  ViewHistory: undefined;
  Conversations: undefined;
};

export type SellerStackParamList = {
  SellerDashboard: undefined;
  SellerProducts: undefined;
  SellerProductForm: { productId?: string };
  SellerOrders: undefined;
  SellerReviews: undefined;
  SellerCoupons: undefined;
  SellerStore: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Notifications: undefined;
  Blog: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  ProductDetail: { productId: string };
  OrderDetail: { orderId: string };
  Checkout: undefined;
  Payment: { paymentUrl: string; orderId: string };
  BlogDetail: { slug: string };
  ChatRoom: { conversationId: string; sellerName: string; sellerAvatar?: string | null };
  Seller: NavigatorScreenParams<SellerStackParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
