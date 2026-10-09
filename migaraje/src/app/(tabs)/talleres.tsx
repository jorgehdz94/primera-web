import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StarRating } from '@/components/Form';
import { Screen, TabHeader } from '@/components/Screen';
import { Card, EmptyState, IconButton, IconCircle, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/logic/dates';
import { formatMoney, plural } from '@/logic/format';
import { workshopSummary } from '@/logic/workshops';

export default function WorkshopsScreen() {
  const theme = useTheme();
  const data = useAppData();
  const list = data.workshops
    .map((w) => ({ workshop: w, ...workshopSummary(w, data) }))
    .sort((a, b) => (b.lastDate ?? '').localeCompare(a.lastDate ?? '') || a.workshop.name.localeCompare(b.workshop.name));

  return (
    <Screen safeTop>
      <TabHeader
        subtitle="Quién cuida tu vehículo"
        title="Talleres"
        right={<IconButton icon="plus" label="Agregar taller" onPress={() => router.push('/taller/nuevo')} color="#FFFFFF" background={theme.primary} size={44} />}
      />
      <InfoBox
        icon="account-hard-hat"
        tone="primary"
        text="Guarda tus talleres y mecánicos de confianza. Cada servicio queda ligado a quién lo hizo, así sabes quién es responsable si algo falla y a quién volver."
      />
      <View style={styles.spacer} />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🔧"
            title="Aún no tienes talleres"
            text="Se agregan solos cuando registras un servicio, o puedes agregarlos aquí con su teléfono y dirección."
            action="Agregar taller"
            onAction={() => router.push('/taller/nuevo')}
          />
        </Card>
      ) : null}

      {list.map(({ workshop, count, total, rating, lastDate }) => (
        <Card key={workshop.id} onPress={() => router.push(`/taller/${workshop.id}`)} style={styles.card}>
          <View style={styles.row}>
            <IconCircle icon="store-cog" color={theme.accent} background={theme.accentSoft} size={48} />
            <View style={styles.flex}>
              <AppText variant="subheading" numberOfLines={1}>
                {workshop.name}
              </AppText>
              <AppText variant="small" muted>
                {count > 0 ? `${plural(count, 'servicio')} · ${formatMoney(total, data.settings.currency)}` : 'Sin servicios todavía'}
              </AppText>
              {lastDate ? <AppText variant="caption">Última visita: {formatDate(lastDate)}</AppText> : null}
              {workshop.mechanics.length > 0 ? (
                <AppText variant="caption" numberOfLines={1}>
                  👨‍🔧 {workshop.mechanics.join(', ')}
                </AppText>
              ) : null}
            </View>
            {rating !== undefined ? (
              <View style={styles.rating}>
                <AppText variant="heading">{rating.toFixed(1)}</AppText>
                <StarRating value={Math.round(rating)} size={11} />
              </View>
            ) : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: Spacing.lg },
  card: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  rating: { alignItems: 'center' },
});
