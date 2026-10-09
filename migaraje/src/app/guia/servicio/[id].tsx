import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Expandable } from '@/components/domain';
import { Screen } from '@/components/Screen';
import { Bullets, Button, Card, IconCircle, InfoBox, Pill, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCategory, GROUP_LABELS, hasCategory } from '@/data/categories';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { intervalText } from '@/logic/maintenance';

export default function CategoryGuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const data = useAppData();
  const c = getCategory(id);
  const unit = data.settings.distanceUnit;
  const found = hasCategory(id);

  const intervals = (['carro', 'moto'] as const)
    .filter((t) => c.interval?.[t])
    .map((t) => {
      const i = c.interval?.[t];
      return `${t === 'carro' ? '🚗 Carro' : '🏍️ Moto'}: ${intervalText({ intervalKm: i?.km, intervalMonths: i?.months }, 'km').toLowerCase()}`;
    });

  const related = (c.related ?? []).filter(hasCategory).map(getCategory);
  const vehicleForService = data.vehicles.find((v) => c.appliesTo.includes(v.type));

  return (
    <Screen>
      <Stack.Screen options={{ title: c.name }} />
      {!found ? <InfoBox tone="warning" text="No encontramos este tema; te mostramos la guía general." /> : null}

      <Card>
        <View style={styles.row}>
          <IconCircle icon={c.icon} color={theme.primary} background={theme.primarySoft} size={60} />
          <View style={styles.flex}>
            <AppText variant="overline">{GROUP_LABELS[c.group]}</AppText>
            <AppText variant="title">{c.name}</AppText>
            <View style={styles.pills}>
              {c.appliesTo.includes('carro') ? <Pill label="Carro" icon="car-side" /> : null}
              {c.appliesTo.includes('moto') ? <Pill label="Moto" icon="motorbike" /> : null}
            </View>
          </View>
        </View>
      </Card>

      <SectionHeader title="🔎 ¿Qué es?" />
      <AppText>{c.what}</AppText>

      <SectionHeader title="🎯 ¿Por qué se hace?" />
      <AppText>{c.why}</AppText>

      {c.signs.length > 0 ? (
        <>
          <SectionHeader title="🚩 Señales de que lo necesitas" />
          <Card>
            <Bullets items={c.signs} color={theme.warning} />
          </Card>
        </>
      ) : null}

      {c.ifIgnored ? (
        <>
          <SectionHeader title="⚠️ ¿Qué pasa si no lo haces?" />
          <InfoBox tone="danger" icon="alert-octagon-outline" text={c.ifIgnored} />
        </>
      ) : null}

      {intervals.length > 0 || c.intervalNote ? (
        <>
          <SectionHeader title="📅 ¿Cada cuándo?" />
          <Card style={styles.gap}>
            {intervals.map((t) => (
              <AppText key={t} variant="bodyStrong">
                {t}
              </AppText>
            ))}
            {c.intervalNote ? <AppText muted>{c.intervalNote}</AppText> : null}
            {unit === 'mi' ? <AppText variant="caption">Valores en km. En tus recordatorios se convierten a millas.</AppText> : null}
          </Card>
        </>
      ) : null}

      {c.tips.length > 0 ? (
        <>
          <SectionHeader title="💡 Consejos" />
          <Card>
            <Bullets items={c.tips} color={theme.success} />
          </Card>
        </>
      ) : null}

      {c.askMechanic.length > 0 ? (
        <>
          <SectionHeader title="🙋 Pregúntale al mecánico" />
          <Card tone="alt">
            <Bullets items={c.askMechanic} color={theme.accent} />
          </Card>
        </>
      ) : null}

      {c.extra && c.extra.length > 0 ? (
        <>
          <SectionHeader title="📚 Para saber más" />
          {c.extra.map((e) => (
            <Expandable key={e.title} title={e.title} icon="book-open-variant" iconColor={theme.accent} iconBackground={theme.accentSoft}>
              <AppText>{e.body}</AppText>
            </Expandable>
          ))}
        </>
      ) : null}

      {related.length > 0 ? (
        <>
          <SectionHeader title="Suele hacerse junto con…" />
          <View style={styles.related}>
            {related.map((r) => (
              <Button key={r.id} title={r.name} icon={r.icon} variant="secondary" size="sm" onPress={() => router.push(`/guia/servicio/${r.id}`)} />
            ))}
          </View>
        </>
      ) : null}

      {vehicleForService ? (
        <Button
          title="Registrar este servicio"
          icon="plus"
          style={styles.cta}
          onPress={() =>
            router.push({
              pathname: '/servicio/nuevo',
              params: { categoryId: c.id, ...(data.vehicles.length === 1 ? { vehicleId: vehicleForService.id } : {}) },
            })
          }
        />
      ) : null}
      <AppText variant="caption" center style={styles.disclaimer}>
        Información general de referencia. Siempre manda lo que indique el manual de tu vehículo.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 6 },
  gap: { gap: Spacing.sm },
  related: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cta: { marginTop: Spacing.xl },
  disclaimer: { marginTop: Spacing.lg },
});
