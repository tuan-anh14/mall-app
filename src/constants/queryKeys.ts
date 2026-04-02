// ─── Centralized query keys for React Query ───────────────────────────────────

export const QUERY_KEYS = {
  categories:    ['categories'] as const,
  promotions:    ['promotions'] as const,
  products:      ['products'] as const,
  profile:       ['profile'] as const,
  addresses:     ['profile', 'addresses'] as const,
  settings:      ['profile', 'settings'] as const,
  cart:          ['cart'] as const,
  notifications: (filter?: string) => ['notifications', filter ?? 'all'] as const,
  product:       (id: string) => ['product', id] as const,
  reviews:       (productId: string, page?: number) => ['reviews', productId, page ?? 1] as const,
  wishlist:      ['wishlist'] as const,
  wishlistCheck: (productId: string) => ['wishlist', 'check', productId] as const,
  orders:        (status?: string) => ['orders', status ?? 'all'] as const,
  order:         (id: string) => ['order', id] as const,
  wallet:        ['wallet'] as const,
  walletTxns:    (page: number) => ['wallet', 'txns', page] as const,
  walletStats:   ['wallet', 'stats'] as const,
  related:       (productId: string) => ['related', productId] as const,
  similar:       (productId: string) => ['similar', productId] as const,
} as const;
