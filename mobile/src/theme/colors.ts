/**
 * Design System — Color Tokens for Cashly
 * Direction: Clean, minimal, black-and-white, spacious.
 * Supports Dark Mode (default pitch-black) and Light Mode.
 */

export interface ThemeColors {
  // Base Canvas & Surface
  background: string;
  backgroundSubtle: string;
  card: string;
  cardElevated: string;
  cardHighlight: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderStrong: string;

  // Typography & Content
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;

  // Financial Semantics
  credit: string;
  creditMuted: string;
  creditBorder: string;

  debit: string;
  debitMuted: string;
  debitBorder: string;

  exchange: string;
  exchangeMuted: string;

  // Interactive Elements & Pill Navigation
  pillBackground: string;
  pillBorder: string;
  pillActiveBackground: string;
  pillActiveText: string;
  pillInactiveIcon: string;

  // Status Badges
  pendingBadgeBg: string;
  pendingBadgeText: string;
  confirmedBadgeBg: string;
  confirmedBadgeText: string;

  // Overlays
  overlay: string;
  statusBar: 'light' | 'dark';
}

export const darkColors: ThemeColors = {
  // Base Canvas & Surface
  background: '#000000', // Pitch obsidian
  backgroundSubtle: '#09090B',
  card: '#141416', // Deep dark card surface
  cardElevated: '#1E1E24',
  cardHighlight: '#26262B',

  // Borders & Dividers
  border: '#222226',
  borderSubtle: '#1C1C20',
  borderStrong: '#3A3A45',

  // Typography & Content
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverted: '#000000',

  // Financial Semantics
  credit: '#10B981', // Clean Emerald Green
  creditMuted: 'rgba(16, 185, 129, 0.15)',
  creditBorder: 'rgba(16, 185, 129, 0.3)',

  debit: '#EF4444', // Crisp Crimson Red
  debitMuted: 'rgba(239, 68, 68, 0.15)',
  debitBorder: 'rgba(239, 68, 68, 0.3)',

  exchange: '#94A3B8', // Neutral Slate (non-spending/income)
  exchangeMuted: 'rgba(148, 163, 184, 0.15)',

  // Interactive Elements & Pill Navigation
  pillBackground: '#000000',
  pillBorder: '#2A2A30',
  pillActiveBackground: '#FFFFFF',
  pillActiveText: '#000000',
  pillInactiveIcon: '#A1A1AA',

  // Status Badges
  pendingBadgeBg: '#FEF3C7',
  pendingBadgeText: '#92400E',
  confirmedBadgeBg: 'rgba(16, 185, 129, 0.15)',
  confirmedBadgeText: '#10B981',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.78)',
  statusBar: 'light',
};

export const lightColors: ThemeColors = {
  // Base Canvas & Surface
  background: '#F4F4F6', // Clean light gray canvas
  backgroundSubtle: '#FFFFFF',
  card: '#FFFFFF', // Clean white card surface
  cardElevated: '#FFFFFF',
  cardHighlight: '#E4E4E7',

  // Borders & Dividers
  border: '#E4E4E7',
  borderSubtle: '#F4F4F5',
  borderStrong: '#D4D4D8',

  // Typography & Content
  text: '#09090B', // Pitch Black text
  textSecondary: '#52525B',
  textMuted: '#71717A',
  textInverted: '#FFFFFF',

  // Financial Semantics
  credit: '#10B981', // Clean Emerald Green
  creditMuted: 'rgba(16, 185, 129, 0.12)',
  creditBorder: 'rgba(16, 185, 129, 0.25)',

  debit: '#EF4444', // Crisp Crimson Red
  debitMuted: 'rgba(239, 68, 68, 0.12)',
  debitBorder: 'rgba(239, 68, 68, 0.25)',

  exchange: '#64748B', // Neutral Slate
  exchangeMuted: 'rgba(100, 116, 139, 0.15)',

  // Interactive Elements & Pill Navigation
  pillBackground: '#18181B',
  pillBorder: '#27272A',
  pillActiveBackground: '#FFFFFF',
  pillActiveText: '#000000',
  pillInactiveIcon: '#A1A1AA',

  // Status Badges
  pendingBadgeBg: '#FEF3C7',
  pendingBadgeText: '#92400E',
  confirmedBadgeBg: 'rgba(16, 185, 129, 0.15)',
  confirmedBadgeText: '#10B981',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  statusBar: 'dark',
};

export const colors = darkColors;
export type Colors = ThemeColors;

