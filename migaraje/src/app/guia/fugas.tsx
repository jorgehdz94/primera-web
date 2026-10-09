import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Button, Card, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { LEAKS } from '@/data/learn';
import { URGENCY_INFO, URGENCY_TONE } from '@/data/symptoms';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';

export default function LeaksScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const leak = LEAKS.find((l) => l.id === selected);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Detector de fugas' }} />
      <AppText variant="title">¿De qué color es la mancha?</AppText>
      <AppText muted style={styles.intro}>
        Truco: pon un cartón blanco debajo del vehículo toda la noche. En la mañana verás el color y de qué parte gotea.
      </AppText>

      <View style={styles.grid}>
        {LEAKS.map((l) => {
          const isSelected = l.id === selected;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={l.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                haptic('selection');
                setSelected(l.id);
              }}
              style={[styles.option, { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: theme.card }]}>
              <View style={[styles.drop, { backgroundColor: l.color, borderColor: theme.border }]} />
              <AppText variant="caption" center numberOfLines={4}>
                {l.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {leak ? (
        <Card style={styles.result}>
          <View style={styles.resultTop}>
            <View style={[styles.bigDrop, { backgroundColor: leak.color, borderColor: theme.border }]} />
            <View style={styles.flex}>
              <AppText variant="caption">Probablemente es</AppText>
              <AppText variant="heading">{leak.fluid}</AppText>
            </View>
          </View>
          <AppText>
            <AppText variant="bodyStrong">Dónde suele verse: </AppText>
            {leak.where}
          </AppText>
          <InfoBox tone={URGENCY_TONE[leak.urgency]} title={`Urgencia: ${URGENCY_INFO[leak.urgency].label}`} text={leak.advice} icon="water-alert" />
          {leak.categoryId ? (
            <Button title="Saber más de este sistema" variant="ghost" icon="book-open-variant" onPress={() => router.push(`/guia/servicio/${leak.categoryId}`)} />
          ) : null}
        </Card>
      ) : (
        <AppText muted center style={styles.placeholder}>
          👆 Toca un color para ver qué puede ser.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 4, marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { width: '31.8%', borderWidth: 2, borderRadius: 14, padding: Spacing.sm, alignItems: 'center', gap: 6 },
  drop: { width: 44, height: 44, borderRadius: 22, borderTopRightRadius: 4, transform: [{ rotate: '-45deg' }], borderWidth: 1 },
  result: { marginTop: Spacing.lg, gap: Spacing.md },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigDrop: { width: 52, height: 52, borderRadius: 26, borderTopRightRadius: 4, transform: [{ rotate: '-45deg' }], borderWidth: 1 },
  flex: { flex: 1 },
  placeholder: { marginTop: Spacing.xl },
});
