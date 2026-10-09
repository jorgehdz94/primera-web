import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Card, Pill } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { SYMPTOMS, URGENCY_INFO, URGENCY_TONE } from '@/data/symptoms';
import { useAppData } from '@/hooks/useAppData';
import type { VehicleType } from '@/types';

export default function SymptomsScreen() {
  const data = useAppData();
  const onlyMotos = data.vehicles.length > 0 && data.vehicles.every((v) => v.type === 'moto');
  const [type, setType] = useState<VehicleType | 'todos'>(onlyMotos ? 'moto' : 'todos');
  const list = SYMPTOMS.filter((s) => type === 'todos' || s.appliesTo.includes(type));

  return (
    <Screen>
      <Stack.Screen options={{ title: '¿Qué le pasa?' }} />
      <AppText variant="title">¿Qué notas en tu vehículo?</AppText>
      <AppText muted style={styles.intro}>
        Elige lo que más se parezca. Te decimos qué puede ser, qué tan urgente es y qué preguntar en el taller.
      </AppText>
      <View style={styles.filter}>
        <Segmented<VehicleType | 'todos'>
          value={type}
          onChange={setType}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'carro', label: 'Carro', icon: 'car-side' },
            { value: 'moto', label: 'Moto', icon: 'motorbike' },
          ]}
        />
      </View>
      {list.map((s) => (
        <Card key={s.id} onPress={() => router.push(`/guia/sintoma/${s.id}`)} style={styles.card}>
          <View style={styles.row}>
            <AppText style={styles.emoji}>{s.emoji}</AppText>
            <View style={styles.flex}>
              <AppText variant="subheading">{s.title}</AppText>
              <AppText variant="small" muted numberOfLines={2}>
                {s.description}
              </AppText>
            </View>
            <Pill label={URGENCY_INFO[s.urgency].label} tone={URGENCY_TONE[s.urgency]} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 4, marginBottom: Spacing.lg },
  filter: { marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  emoji: { fontSize: 28, lineHeight: 34 },
  flex: { flex: 1 },
});
