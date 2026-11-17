import { colors } from './colors.ts';
import { typography } from './typography.ts';
import { spacing } from './spacing.ts';
import { radii } from './radii.ts';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
} as const;

export type Theme = typeof theme;

export * from './colors.ts';
export * from './typography.ts';
export * from './spacing.ts';
export * from './radii.ts';
export * from './useAppTheme.ts';
