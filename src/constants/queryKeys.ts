// ─── Centralized query keys for React Query ───────────────────────────────────

export const QUERY_KEYS = {
  categories: ['categories'] as const,
  promotions: ['promotions'] as const,
  products:   ['products'] as const,
  profile:    ['profile'] as const,
  addresses:  ['profile', 'addresses'] as const,
  settings:   ['profile', 'settings'] as const,
} as const;
