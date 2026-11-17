/**
 * Design System — Corner radii
 * Distinctive rounded geometry with prominent hero cards and pill navigation.
 */

export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  card: 30, // Large rounded black balance card
  pill: 9999, // Floating bottom pill navigation & buttons
  full: 9999,
} as const;

export type Radii = typeof radii;

