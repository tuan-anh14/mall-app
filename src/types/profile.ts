export interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  userType: 'BUYER' | 'SELLER' | 'ADMIN';
  isEmailVerified: boolean;
  memberSince: string;
  createdAt: string;
}

export interface ShippingAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressDto {
  label?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  label?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  isDefault?: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  priceDropAlerts: boolean;
  pushNotifications: boolean;
  language: string;
  currency: string;
  darkMode: boolean;
  showRecommendations: boolean;
  twoFactorEnabled: boolean;
}

export interface UpdateSettingsDto {
  emailNotifications?: boolean;
  orderUpdates?: boolean;
  promotionalEmails?: boolean;
  priceDropAlerts?: boolean;
  pushNotifications?: boolean;
  language?: string;
  currency?: string;
  darkMode?: boolean;
  showRecommendations?: boolean;
  twoFactorEnabled?: boolean;
}
