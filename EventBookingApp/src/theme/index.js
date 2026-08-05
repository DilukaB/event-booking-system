// ─── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary
  primary: '#6C63FF',
  primaryDark: '#5A52D9',
  primaryLight: '#8B85FF',
  primaryGlow: 'rgba(108, 99, 255, 0.15)',

  // Accent
  accent: '#FF6584',
  accentDark: '#E5506F',
  success: '#00C896',
  warning: '#FFB800',
  error: '#FF4757',
  info: '#2196F3',

  // Background
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  card: '#1E1E35',
  cardBorder: 'rgba(108, 99, 255, 0.2)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
  textOnPrimary: '#FFFFFF',

  // Status colors
  statusActive: '#00C896',
  statusSoldOut: '#FF6584',
  statusCancelled: '#6B6B8D',

  // Misc
  border: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// ─── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
