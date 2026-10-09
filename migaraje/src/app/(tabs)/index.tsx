import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PlanStatusRow, VehicleAvatar, VehicleChip } from '@/components/domain';
import { Icon, type IconName } from '@/components/Icon';
import { Screen, TabHeader } from '@/components/Screen';
import { Button, Card, EmptyState, ProgressBar, SectionHeader, toneColors } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { DAILY_TIPS } from '@/data/learn';
import { useAllOverviews, useSettings } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { diffDays, formatDateLong, todayISO } from '@/logic/dates';
import { formatDistance, vehicleTitle } from '@/logic/format';
import { healthLabel, sortStatuses } from '@/logic/maintenance';
import { documentStatus, type VehicleOverview } from '@/logic/overview';
import { haptic } from '@/services/feedback';
import { useStore } from '@/store';

function greeting(name: string): string {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  return name ? `${hello}, ${name}` : hello;
}

function scoreColor(score: number | null, theme: ReturnType<typeof useTheme>): string {
  if (score === null) return theme.textMuted;
  if (score >= 80) return theme.success;
  if (score >= 50) return theme.warning;
  return theme.danger;
}

function VehicleCard({ overview }: { overview: VehicleOverview }) {
  const theme = useTheme();
  const settings = useSettings();
  const { vehicle, odo, statuses, score } = overview;
  const next = statuses.find((s) => s.status !== 'desactivado' && s.status !== 'sin_datos');
  return (
    <Card onPress={() => router.push(`/vehiculo/${vehicle.id}`)} style={styles.vehicleCard} padded={false}>
      <View style={[styles.vehicleBand, { backgroundColor: vehicle.color }]} />
      <View style={styles.vehicleBody}>
        <View style={styles.vehicleTop}>
          <VehicleAvatar vehicle={vehicle} />
          <View style={styles.flex}>
            <AppText variant="heading" numberOfLines={1}>
              {vehicle.nickname || vehicleTitle(vehicle)}
            </AppText>
            <AppText variant="small" muted numberOfLines={1}>
              {vehicleTitle(vehicle)}
              {vehicle.plate ? ` · ${vehicle.plate}` : ''}
            </AppText>
          </View>
          <Icon name="chevron-right" size={24} color={theme.textMuted} />
        </View>

        <View style={styles.kmRow}>
          <View style={styles.flex}>
            <AppText variant="caption">Kilometraje {odo.daysSinceReading > 0 ? 'estimado' : 'actual'}</AppText>
            <AppText variant="title">
              {odo.daysSinceReading > 0 ? '≈ ' : ''}
              {formatDistance(odo.estimatedKm, settings.distanceUnit)}
            </AppText>
          </View>
          <Button
            title="Actualizar"
            icon="speedometer"
            size="sm"
            variant="soft"
            onPress={() => router.push({ pathname: '/odometro', params: { vehicleId: vehicle.id } })}
          />
        </View>

        <View style={styles.health}>
          <View style={styles.healthTop}>
            <AppText variant="smallStrong" style={styles.flex}>
              {healthLabel(score)}
            </AppText>
            {score !== null ? (
              <AppText variant="smallStrong" color={scoreColor(score, theme)}>
                {score}%
              </AppText>
            ) : null}
          </View>
          <ProgressBar value={(score ?? 0) / 100} color={scoreColor(score, theme)} />
        </View>

        {next ? (
          <View style={[styles.nextBox, { backgroundColor: theme.cardAlt }]}>
            <PlanStatusRow status={next} compact />
          </View>
        ) : (
          <View style={[styles.nextBox, { backgroundColor: theme.cardAlt }]}>
            <AppText variant="small" muted>
              Registra tu primer servicio o indica cuándo fue tu último cambio de aceite para ver tus próximos mantenimientos.
            </AppText>
          </View>
        )}
      </View>
    </Card>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: IconName; label: string; onPress: () => void; color: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [styles.quick, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}1F` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <AppText variant="smallStrong" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function GarageScreen() {
  const theme = useTheme();
  const settings = useSettings();
  const overviews = useAllOverviews();
  const loadDemo = useStore((s) => s.loadDemo);
  const today = todayISO();

  const upcoming = sortStatuses(
    overviews.flatMap((o) => o.statuses.filter((s) => s.status === 'vencido' || s.status === 'pronto')),
  ).slice(0, 6);
  const vehicleOf = (vehicleId: string) => overviews.find((o) => o.vehicle.id === vehicleId)?.vehicle;
  const docs = overviews
    .flatMap((o) => o.documents.map((d) => ({ doc: d, vehicle: o.vehicle, ...documentStatus(d, today) })))
    .filter((d) => d.status !== 'ok');
  const overdue = upcoming.filter((s) => s.status === 'vencido').length;
  const tip = DAILY_TIPS[Math.abs(diffDays('2024-01-01', today)) % DAILY_TIPS.length];

  const addService = () =>
    router.push(overviews.length === 1 ? { pathname: '/servicio/nuevo', params: { vehicleId: overviews[0].vehicle.id } } : '/servicio/nuevo');

  if (overviews.length === 0) {
    return (
      <Screen safeTop>
        <TabHeader subtitle={greeting(settings.userName)} title="Tu garaje" />
        <Card>
          <EmptyState
            emoji="🚗🏍️"
            title="Tu garaje está vacío"
            text="Agrega tu carro o tu moto para empezar a registrar lo que le hacen en el taller y recibir recordatorios."
            action="Agregar vehículo"
            onAction={() => router.push('/vehiculo/nuevo')}
          />
          <Button title="Ver con datos de ejemplo" variant="ghost" icon="eye-outline" onPress={loadDemo} />
        </Card>
      </Screen>
    );
  }

  return (
    <View style={styles.flex}>
      <Screen safeTop bottomSpace={70}>
        <TabHeader
          subtitle={greeting(settings.userName)}
          title="Tu garaje"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar vehículo"
              onPress={() => router.push('/vehiculo/nuevo')}
              style={[styles.addVehicle, { backgroundColor: theme.primarySoft }]}>
              <Icon name="plus" size={18} color={theme.primary} />
              <Icon name="car-side" size={20} color={theme.primary} />
            </Pressable>
          }
        />
        <AppText variant="caption" style={styles.date}>
          {formatDateLong(today)}
        </AppText>

        {overdue > 0 || docs.length > 0 ? (
          <Card style={[styles.alert, { backgroundColor: overdue > 0 ? theme.dangerSoft : theme.warningSoft, borderColor: 'transparent' }]}>
            <View style={styles.alertRow}>
              <AppText style={styles.alertEmoji}>{overdue > 0 ? '⚠️' : '⏰'}</AppText>
              <View style={styles.flex}>
                <AppText variant="subheading">
                  {overdue > 0
                    ? `Tienes ${overdue} ${overdue === 1 ? 'mantenimiento atrasado' : 'mantenimientos atrasados'}`
                    : 'Tienes documentos por vencer'}
                </AppText>
                <AppText variant="small">
                  {docs.length > 0
                    ? docs
                        .slice(0, 2)
                        .map((d) => `${d.doc.title} (${d.vehicle.nickname || d.vehicle.model}) ${d.status === 'vencido' ? 'vencido' : `vence en ${d.daysLeft} días`}`)
                        .join(' · ')
                    : 'Revisa abajo qué toca y regístralo cuando lo hagas.'}
                </AppText>
              </View>
            </View>
          </Card>
        ) : null}

        {overviews.map((o) => (
          <VehicleCard key={o.vehicle.id} overview={o} />
        ))}

        <SectionHeader title="Acciones rápidas" />
        <View style={styles.quickGrid}>
          <QuickAction icon="clipboard-plus-outline" label="Registrar servicio" color={theme.primary} onPress={addService} />
          <QuickAction
            icon="speedometer"
            label="Actualizar kilometraje"
            color={theme.accent}
            onPress={() => router.push('/odometro')}
          />
          <QuickAction icon="camera-document" label="Escanear factura con IA" color="#9333EA" onPress={() => router.push('/ia/escanear')} />
          <QuickAction icon="stethoscope" label="¿Qué tiene mi vehículo?" color={theme.success} onPress={() => router.push('/guia/sintomas')} />
        </View>

        {upcoming.length > 0 ? (
          <>
            <SectionHeader title="Lo que toca pronto" />
            <Card>
              {upcoming.map((s, i) => {
                const v = vehicleOf(s.plan.vehicleId);
                return (
                  <View key={s.plan.id} style={i > 0 ? [styles.upcomingItem, { borderTopColor: theme.border }] : undefined}>
                    {v && overviews.length > 1 ? (
                      <View style={styles.upcomingChip}>
                        <VehicleChip vehicle={v} />
                      </View>
                    ) : null}
                    <PlanStatusRow status={s} onPress={() => router.push(`/plan/${s.plan.id}`)} />
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        <SectionHeader title="Consejo del día" />
        <Card style={{ backgroundColor: toneColors('accent', theme).bg, borderColor: 'transparent' }}>
          <View style={styles.alertRow}>
            <AppText style={styles.alertEmoji}>💡</AppText>
            <AppText style={styles.flex}>{tip}</AppText>
          </View>
        </Card>
      </Screen>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar servicio"
        onPress={() => {
          haptic('light');
          addService();
        }}
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
        <Icon name="plus" size={24} color="#FFFFFF" />
        <AppText variant="bodyStrong" color="#FFFFFF">
          Registrar servicio
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  date: { marginTop: -Spacing.md, marginBottom: Spacing.lg },
  addVehicle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40, borderRadius: Radius.pill },
  alert: { marginBottom: Spacing.lg },
  alertRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  alertEmoji: { fontSize: 26, lineHeight: 32 },
  vehicleCard: { marginBottom: Spacing.lg, overflow: 'hidden' },
  vehicleBand: { height: 6 },
  vehicleBody: { padding: Spacing.lg, gap: Spacing.md },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  health: { gap: 6 },
  healthTop: { flexDirection: 'row', alignItems: 'center' },
  nextBox: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  quick: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  upcomingItem: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.xs, marginTop: Spacing.xs },
  upcomingChip: { marginTop: Spacing.sm },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 27,
    boxShadow: '0px 6px 16px rgba(238,106,31,0.35)',
  },
});

