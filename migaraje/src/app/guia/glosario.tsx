import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { GLOSSARY } from '@/data/learn';
import { useTheme } from '@/hooks/useTheme';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function GlossaryScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const list = [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term, 'es'))
      .filter((t) => !q || normalize(`${t.term} ${t.aka ?? ''} ${t.definition}`).includes(q));
    const map = new Map<string, typeof list>();
    for (const t of list) {
      const letter = normalize(t.term[0]).toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), t]);
    }
    return [...map.entries()];
  }, [query]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Glosario del taller' }} />
      <AppText muted style={styles.intro}>
        Las palabras que usan los mecánicos, explicadas fácil.
      </AppText>
      <TextField value={query} onChangeText={setQuery} placeholder="Buscar palabra…" icon="magnify" autoCorrect={false} />
      {groups.length === 0 ? (
        <AppText muted center>
          No encontramos esa palabra.
        </AppText>
      ) : null}
      {groups.map(([letter, terms]) => (
        <View key={letter} style={styles.group}>
          <AppText variant="heading" color={theme.primary} style={styles.letter}>
            {letter}
          </AppText>
          {terms.map((t) => (
            <Card
              key={t.term}
              style={styles.card}
              onPress={t.categoryId ? () => router.push(`/guia/servicio/${t.categoryId}`) : undefined}>
              <AppText variant="subheading">
                {t.term}
                {t.aka ? <AppText variant="small" muted>{`  (también: ${t.aka})`}</AppText> : null}
              </AppText>
              <AppText>{t.definition}</AppText>
              {t.categoryId ? (
                <AppText variant="caption" color={theme.primary} style={styles.more}>
                  Ver guía relacionada ›
                </AppText>
              ) : null}
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Spacing.md },
  group: { marginBottom: Spacing.sm },
  letter: { marginBottom: Spacing.sm },
  card: { marginBottom: Spacing.sm, gap: 4 },
  more: { marginTop: 2 },
});
