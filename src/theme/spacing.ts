export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
  section: 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  largeTitle: 34,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tight: -0.4,
  normal: 0,
  wide: 0.5,
  wider: 0.8,
  widest: 1.2,
} as const;

export const motion = {
  instant: 80,
  fast: 140,
  normal: 240,
  slow: 350,
  spring: {
    damping: 30,
    stiffness: 320,
    mass: 0.9,
  },
} as const;
