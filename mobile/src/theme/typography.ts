/**
 * Design System — Typography Tokens for Cashly
 * Delight (primary sans) & Lora (secondary serif).
 */

export const typography = {
  fonts: {
    delightRegular: 'Delight-Regular',
    delightMedium: 'Delight-Medium',
    delightSemiBold: 'Delight-SemiBold',
    delightBold: 'Delight-Bold',
    delightBlack: 'Delight-Black',
    primary: 'Delight-Regular',
    secondary: 'Lora',
    systemSans: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  lineHeights: {
    xs: 14,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 56,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
  },
} as const;

export type Typography = typeof typography;
