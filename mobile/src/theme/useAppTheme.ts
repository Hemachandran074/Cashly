import { useSettingsStore, ThemeMode } from '../features/settings/settingsStore.ts';
import { darkColors, lightColors, Colors } from './colors.ts';

export function useAppTheme(): {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: Colors;
} {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const isDark = themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    themeMode,
    isDark,
    colors,
  };
}

