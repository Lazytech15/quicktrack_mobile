import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale based on 390px design baseline (iPhone 14 Pro)
const BASE_WIDTH = 390;
const scale = SCREEN_WIDTH / BASE_WIDTH;

export function rs(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

// Font scale — gentler than full scale to avoid huge text on iPads
export function fs(size: number): number {
  const s = scale < 1 ? scale : 1 + (scale - 1) * 0.4;
  return Math.round(PixelRatio.roundToNearestPixel(size * s));
}

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const isSmallScreen = SCREEN_WIDTH < 360;
export const isLargeScreen = SCREEN_WIDTH >= 428;

export const colors = {
  primary: '#0F6E56',
  primaryLight: '#1D9E75',
  primaryDark: '#085041',
  primaryBg: '#E1F5EE',

  danger: '#E24B4A',
  dangerBg: '#FCEBEB',
  warning: '#EF9F27',
  warningBg: '#FAEEDA',
  info: '#378ADD',
  infoBg: '#E6F1FB',

  surface: '#FFFFFF',
  background: '#F5F4F0',
  border: '#E8E6E0',
  borderStrong: '#C8C6C0',

  textPrimary: '#1A1A18',
  textSecondary: '#6B6A65',
  textTertiary: '#9B9A96',
  textInverse: '#FFFFFF',
};

export const statusColors = {
  active: { bg: '#E1F5EE', text: '#0F6E56', border: '#5DCAA5' },
  maintenance: { bg: '#FAEEDA', text: '#854F0B', border: '#EF9F27' },
  offline: { bg: '#FCEBEB', text: '#993C1D', border: '#E24B4A' },
  decommissioned: { bg: '#F1EFE8', text: '#5F5E5A', border: '#B4B2A9' },
};

export const spacing = {
  xs: rs(4),
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(24),
  xxl: rs(32),
};

export const radius = {
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(22),
  full: 100,
};

export const typography = {
  heading1: { fontSize: fs(26), fontWeight: '700' as const, letterSpacing: -0.5, color: colors.textPrimary },
  heading2: { fontSize: fs(20), fontWeight: '600' as const, letterSpacing: -0.3, color: colors.textPrimary },
  heading3: { fontSize: fs(17), fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: fs(15), fontWeight: '400' as const, lineHeight: fs(22), color: colors.textPrimary },
  bodySmall: { fontSize: fs(13), fontWeight: '400' as const, lineHeight: fs(19) },
  label: { fontSize: fs(12), fontWeight: '500' as const, letterSpacing: 0.3 },
  mono: { fontSize: fs(12), fontFamily: 'monospace' as const },
};
