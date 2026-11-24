import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  return (
    <Screen>
      <ThemedText type="subtitle">Company search</ThemedText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Ticker, company name or ISIN"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
        ]}
      />
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          {query
            ? `Searching for "${query}" will call GET /api/v1/companies/search once that endpoint exists.`
            : 'Start typing to look up a company. (Placeholder: wire this to the API in Week 2.)'}
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
});
