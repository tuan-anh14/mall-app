// ─── Design tokens — synced with mall-fe globals.css ─────────────────────────

export const Colors = {
  primary:      '#1A56DB',
  primaryDark:  '#1E3A8A',
  primaryLight: '#EFF6FF',
  bg:           '#F3F4F6',
  surface:      '#FFFFFF',
  inputBg:      '#F9FAFB',
  border:       '#E5E7EB',
  text:         '#1F2937',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  danger:       '#EF4444',
  dangerLight:  '#FEF2F2',
  dangerBorder: '#FECACA',
  star:         '#F59E0B',
  success:      '#059669',
  successLight: '#ECFDF5',
  successBorder:'#6EE7B7',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000' as string,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: Colors.primary as string,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
