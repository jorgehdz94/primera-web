import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Bullets, Button, Card, EmptyState, InfoBox, ListRow, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { getSymptom, URGENCY_INFO, URGENCY_TONE } from '@/data/symptoms';
import { useTheme } from '@/hooks/useTheme';

export default function SymptomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const symptom = getSymptom(id);

  if (!symptom) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este síntoma" text="Vuelve a la lista e inténtalo de nuevo." />
      </Screen>
    );
  }

  const tone = URGENCY_TONE[symptom.urgency];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Síntoma' }} />
      <AppText style={styles.emoji}>{symptom.emoji}</AppText>
      <AppText variant="title">{symptom.title}</AppText>
      <AppText muted style={styles.description}>
        {symptom.description}
      </AppText>
      <InfoBox
        tone={tone}
        icon={symptom.urgency === 'alta' ? 'alert-octagon-outline' : symptom.urgency === 'media' ? 'clock-alert-outline' : 'information-outline'}
        title={`Urgencia: ${URGENCY_INFO[symptom.urgency].label}`}
        text={URGENCY_INFO[symptom.urgency].text}
      />

      <SectionHeader title="🧩 Causas más comunes" />
      <Card padded={false} style={styles.list}>
        {symptom.causes.map((cause, i) => {
          const c = cause.categoryId ? getCategory(cause.categoryId) : undefined;
          return (
            <View key={cause.text} style={i > 0 ? [styles.separator, { borderTopColor: theme.border }] : undefined}>
              <ListRow
                title={cause.text}
                subtitle={c ? `Ver guía: ${c.name}` : undefined}
                icon={c?.icon ?? 'help-circle-outline'}
                onPress={c ? () => router.push(`/guia/servicio/${c.id}`) : undefined}
              />
            </View>
          );
        })}
      </Card>

      <SectionHeader title="👀 Lo que puedes revisar tú" />
      <Card>
        <Bullets items={symptom.checkYourself} color={theme.success} />
      </Card>

      <SectionHeader title="🙋 Pregúntale al mecánico" />
      <Card tone="alt">
        <Bullets items={symptom.askMechanic} color={theme.accent} />
      </Card>

      <View style={styles.actions}>
        <Button title="Preguntarle al asistente" icon="robot-outline" variant="secondary" onPress={() => router.push({ pathname: '/ia/chat', params: { pregunta: `${symptom.title}. ¿Qué puede ser y qué hago?` } })} />
        <Button title="Ver luces del tablero" icon="car-info" variant="ghost" onPress={() => router.push('/guia/luces')} />
      </View>
      <AppText variant="caption" center style={styles.disclaimer}>
        Esto es una orientación, no un diagnóstico. Un mecánico debe revisar el vehículo para confirmar la causa.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 48, lineHeight: 58 },
  description: { marginTop: 4, marginBottom: Spacing.lg },
  list: { paddingHorizontal: Spacing.lg },
  separator: { borderTopWidth: StyleSheet.hairlineWidth },
  actions: { gap: Spacing.sm, marginTop: Spacing.xl },
  disclaimer: { marginTop: Spacing.lg },
});
