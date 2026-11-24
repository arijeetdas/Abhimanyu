import { Colors } from '@/constants/theme';

/**
 * Abhimanyu is dark-first (docs/UI_UX_GUIDELINES.md 2.1). To support a light mode later,
 * return Colors[useColorScheme() === 'light' ? 'light' : 'dark'] here (useColorScheme from react-native).
 */
export function useTheme() {
  return Colors.dark;
}
