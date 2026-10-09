import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Card, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { WORKSHOP_TIPS } from '@/data/learn';

export default function TipsScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Tips para ir al taller' }} />
      <AppText variant="title">Que no te vean la cara 😉</AppText>
      <AppText muted style={styles.intro}>
        La mayoría de los mecánicos son honestos, pero estos hábitos te protegen siempre y te ayudan a entender lo que pagas.
      </AppText>
      {WORKSHOP_TIPS.map((t, i) => (
        <Card key={t.title} style={styles.card}>
          <View style={styles.row}>
            <AppText style={styles.emoji}>{t.emoji}</AppText>
            <View style={styles.flex}>
              <AppText variant="caption">Tip {i + 1}</AppText>
              <AppText variant="subheading">{t.title}</AppText>
              <AppText>{t.text}</AppText>
            </View>
          </View>
        </Card>
      ))}
      <InfoBox
        icon="shield-check"
        tone="success"
        title="MiGaraje te ayuda con esto"
        text="Al registrar cada servicio te decimos si se hizo antes de lo normal, comparamos el costo con la vez anterior y guardamos quién fue el responsable y la garantía."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 4, marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  emoji: { fontSize: 30, lineHeight: 36 },
  flex: { flex: 1, gap: 2 },
});
