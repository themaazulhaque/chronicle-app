import { TextStyle } from 'react-native';
import { fontSize, fontWeight, letterSpacing } from './spacing';

type FontVariant = NonNullable<TextStyle['fontVariant']>;

export const typography = {
  largeTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: fontWeight.bold,
    lineHeight: 41,
    letterSpacing: letterSpacing.tight,
  },
  title1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: 38,
    letterSpacing: letterSpacing.tight,
  },
  title2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: 30,
    letterSpacing: letterSpacing.normal,
  },
  title3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: 25,
    letterSpacing: letterSpacing.normal,
  },
  headline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: 24,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 21,
    letterSpacing: letterSpacing.normal,
  },
  callout: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 21,
    letterSpacing: letterSpacing.normal,
  },
  subhead: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: 18,
    letterSpacing: letterSpacing.normal,
  },
  footnote: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: 18,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: 16,
    letterSpacing: letterSpacing.normal,
  },
  groupedHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: 18,
    letterSpacing: letterSpacing.normal,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'] as FontVariant,
  },
};
