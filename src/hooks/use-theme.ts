import { Colors } from '@/constants/theme';

/**
 * The hackathon build is light-only (app.json userInterfaceStyle: "light"),
 * so this always returns the light tokens. Components already consume colours
 * through this hook, so when the theme toggle lands (Phase 9) only this file
 * and useThemeStore change — Colors.dark is ready and waiting.
 */
export function useTheme() {
  return Colors.light;
}
