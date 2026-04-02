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
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Notifications: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  ProductDetail: { productId: string };
  OrderDetail: { orderId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
