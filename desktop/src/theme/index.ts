export const colors = {
  background: '#020503',
  backgroundCard: '#050e08',
  backgroundElevated: '#08160d',
  backgroundInput: '#040b07',
  
  // Tactical Defense Accents
  primary: '#22c55e',       // Military Neon Green
  primaryDim: '#15803d',
  primaryGlow: 'rgba(34, 197, 94, 0.25)',
  primaryMuted: 'rgba(34, 197, 94, 0.12)',

  amber: '#eab308',         // Warning / Alert
  amberDim: '#a16207',
  amberGlow: 'rgba(234, 179, 8, 0.25)',

  crimson: '#ef4444',       // Critical / Hostile Emitter
  crimsonDim: '#991b1b',
  crimsonGlow: 'rgba(239, 68, 68, 0.25)',

  cyan: '#06b6d4',          // Spectral RF / Waterfall
  cyanDim: '#0e7490',
  cyanGlow: 'rgba(6, 182, 212, 0.25)',

  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textHighlight: '#4ade80',

  border: 'rgba(34, 197, 94, 0.25)',
  borderDim: 'rgba(34, 197, 94, 0.12)',
  borderAccent: 'rgba(34, 197, 94, 0.45)',

  surfaceGlass: 'rgba(4, 14, 8, 0.85)',
  surfaceModal: 'rgba(3, 10, 6, 0.98)',
};

export const typography = {
  fontFamilyTactical: 'Rajdhani, sans-serif',
  fontFamilyMono: 'JetBrains Mono, monospace',
  fontFamilySans: 'Inter, system-ui, sans-serif',

  titleHero: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
    color: colors.textPrimary,
  },
  titleSection: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    color: colors.textPrimary,
  },
  titleCard: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 1.0,
    color: colors.primary,
    textTransform: 'uppercase' as const,
  },
  bodyRegular: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bodySmall: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  codeMono: {
    fontSize: 12,
    color: colors.primary,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
};
