import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ServiceCard } from '@/components/domain';
import { StarRating } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, IconButton, IconCircle, SectionHeader, StatBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate } from '@/logic/dates';
import { formatMoney } from '@/logic/format';
import { workshopSummary } from '@/logic/workshops';
import { confirm, toast } from '@/services/feedback';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function WorkshopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const data = useAppData();
  const removeWorkshop = useStore((s) => s.removeWorkshop);
  const workshop = data.workshops.find((w) => w.id === id);

  if (!workshop) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este taller" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  const summary = workshopSummary(workshop, data);
  const byMechanic = new Map<string, number>();
  for (const s of summary.services) {
    if (s.mechanic) byMechanic.set(s.mechanic, (byMechanic.get(s.mechanic) ?? 0) + 1);
  }
  const mechanics = [...new Set([...workshop.mechanics, ...byMechanic.keys()])];

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: workshop.name,
          headerRight: () => <IconButton icon="pencil" label="Editar taller" size={36} onPress={() => router.push(`/taller/${workshop.id}/editar`)} />,
        }}
      />
      <Card>
        <View style={styles.row}>
          <IconCircle icon="store-cog" color={theme.accent} background={theme.accentSoft} size={56} />
          <View style={styles.flex}>
            <AppText variant="title">{workshop.name}</AppText>
            {workshop.address ? <AppText muted>{workshop.address}</AppText> : null}
            {summary.rating !== undefined ? (
              <View style={styles.rating}>
                <StarRating value={Math.round(summary.rating)} size={16} />
                <AppText variant="caption">{summary.rating.toFixed(1)} de 5</AppText>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.buttons}>
          {workshop.phone ? (
            <Button title="Llamar" icon="phone" style={styles.flex} onPress={() => Linking.openURL(`tel:${workshop.phone}`)} />
          ) : null}
          {workshop.phone ? (
            <Button
              title="WhatsApp"
              icon="whatsapp"
              variant="secondary"
              style={styles.flex}
              onPress={() => Linking.openURL(`https://wa.me/${workshop.phone?.replace(/[^\d]/g, '')}`)}
            />
          ) : null}
          {workshop.address ? (
            <Button
              title="Mapa"
              icon="map-marker"
              variant="secondary"
              style={styles.flex}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${workshop.name} ${workshop.address}`)}`)}
            />
          ) : null}
        </View>
      </Card>

      <View style={styles.stats}>
        <StatBox label="Servicios" value={String(summary.count)} />
        <StatBox label="Total pagado" value={formatMoney(summary.total, data.settings.currency)} />
        <StatBox label="Última visita" value={summary.lastDate ? formatDate(summary.lastDate) : '—'} />
      </View>

      {mechanics.length > 0 ? (
        <>
          <SectionHeader title="Mecánicos" />
          <Card>
            {mechanics.map((m) => (
              <View key={m} style={styles.mechanic}>
                <IconCircle icon="account-wrench" color={theme.primary} background={theme.primarySoft} size={36} />
                <AppText variant="bodyStrong" style={styles.flex}>
                  {m}
                </AppText>
                <AppText variant="caption">{byMechanic.get(m) ?? 0} trabajos</AppText>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {workshop.notes ? (
        <>
          <SectionHeader title="Notas" />
          <Card>
            <AppText>{workshop.notes}</AppText>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Trabajos realizados aquí" />
      {summary.services.length === 0 ? (
        <Card>
          <AppText muted>Aún no hay servicios registrados en este taller.</AppText>
        </Card>
      ) : (
        summary.services.map((s) => (
          <ServiceCard key={s.id} service={s} vehicle={data.vehicles.find((v) => v.id === s.vehicleId)} workshops={data.workshops} showVehicle={data.vehicles.length > 1} />
        ))
      )}

      <Button
        title="Eliminar taller"
        icon="delete-outline"
        variant="danger"
        style={styles.remove}
        onPress={async () => {
          const ok = await confirm(
            '¿Eliminar este taller?',
            summary.count > 0 ? `Sus ${summary.count} servicio(s) se conservan con el nombre del taller.` : 'Se quitará de tu lista de talleres.',
            'Eliminar',
            true,
          );
          if (!ok) return;
          removeWorkshop(workshop.id);
          toast('Taller eliminado', '🗑️');
          goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  mechanic: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  remove: { marginTop: Spacing.xl },
});
