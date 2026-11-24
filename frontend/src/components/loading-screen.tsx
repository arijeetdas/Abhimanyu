import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function LoadingScreen() {
  const t = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: t.background }]} accessibilityLabel="Loading">
      <ActivityIndicator color={t.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
