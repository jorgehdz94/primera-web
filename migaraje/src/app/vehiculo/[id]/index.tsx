import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Expandable, PlanStatusRow, ServiceCard, VehicleAvatar } from '@/components/domain';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, IconButton, Pill, ProgressBar, SectionHeader, StatBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { FUEL_LABELS, getCategory, OIL_TYPE_LABELS } from '@/data/categories';
import { DOCUMENT_KINDS } from '@/data/documents';
import { useAppData, useVehicleOverview } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, relativeDays } from '@/logic/dates';
import { formatDistance, formatMoney, vehicleTitle } from '@/logic/format';
import { healthLabel } from '@/logic/maintenance';
import { documentStatus } from '@/logic/overview';
import { buildReportHtml } from '@/logic/report';
import { costPerKm, LABOR_KEY, spendingStats } from '@/logic/stats';
import { confirm, showMessage, toast } from '@/services/feedback';
import { shareReportPdf } from '@/services/files';
import { deletePhotos } from '@/services/photos';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const data = useAppData();
  const overview = useVehicleOverview(id);
  const removeVehicle = useStore((s) => s.removeVehicle);
  const removeOdometer = useStore((s) => s.removeOdometer);
  const [exporting, setExporting] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  if (!overview) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Vehículo' }} />
        <EmptyState emoji="🤷" title="No encontramos este vehículo" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  const { vehicle, odo, statuses, score, services, documents, readings } = overview;
  const { settings } = data;
  const unit = settings.distanceUnit;
  const stats = spendingStats(services);
  const perKm = costPerKm(services, odo.estimatedKm);
  const active = statuses.filter((s) => s.status !== 'desactivado');
  const disabled = statuses.length - active.length;
  const scoreColor = score === null ? theme.textMuted : score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.danger;
  const visibleServices = showAllServices ? services : services.slice(0, 5);
  const manualReadings = readings.filter((r) => r.source === 'manual').reverse();

  const exportPdf = async () => {
    setExporting(true);
    try {
      await shareReportPdf(buildReportHtml(overview, data.workshops, settings), `Historial ${vehicle.nickname || vehicleTitle(vehicle)}`);
    } catch (e) {
      showMessage('No se pudo generar el PDF', e instanceof Error ? e.message : undefined);
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    const ok = await confirm(
      `¿Eliminar ${vehicle.nickname || vehicleTitle(vehicle)}?`,
      `Se borrarán también sus ${services.length} servicio(s), recordatorios y documentos. Esta acción no se puede deshacer.`,
      'Eliminar',
      true,
    );
    if (!ok) return;
    deletePhotos(removeVehicle(vehicle.id));
    toast('Vehículo eliminado', '🗑️');
    goBack();
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: vehicle.nickname || vehicle.model || 'Vehículo',
          headerRight: () => (
            <IconButton icon="pencil" label="Editar vehículo" onPress={() => router.push(`/vehiculo/${vehicle.id}/editar`)} size={36} />
          ),
        }}
      />

      <Card padded={false} style={styles.hero}>
        <View style={[styles.band, { backgroundColor: vehicle.color }]} />
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <VehicleAvatar vehicle={vehicle} size={64} />
            <View style={styles.flex}>
              <AppText variant="title" numberOfLines={1}>
                {vehicle.nickname || vehicleTitle(vehicle)}
              </AppText>
              <AppText muted numberOfLines={1}>
                {vehicleTitle(vehicle)}
              </AppText>
              <View style={styles.pills}>
                {vehicle.plate ? <Pill label={vehicle.plate} icon="card-text" /> : null}
                <Pill label={FUEL_LABELS[vehicle.fuel]} icon="gas-station" />
                {vehicle.fuel !== 'electrico' ? (
                  <Pill label={`${OIL_TYPE_LABELS[vehicle.oilType]}${vehicle.oilViscosity ? ` ${vehicle.oilViscosity}` : ''}`} icon="oil" />
                ) : null}
              </View>
            </View>
          </View>

          <View style={[styles.kmBox, { backgroundColor: theme.cardAlt }]}>
            <View style={styles.flex}>
              <AppText variant="caption">{odo.daysSinceReading > 0 ? 'Kilometraje estimado hoy' : 'Kilometraje actual'}</AppText>
              <AppText variant="display">
                {odo.daysSinceReading > 0 ? '≈ ' : ''}
                {formatDistance(odo.estimatedKm, unit)}
              </AppText>
              <AppText variant="caption">
                Última lectura: {formatDistance(odo.knownKm, unit)} · {formatDate(odo.knownDate)}
                {'\n'}Promedio: ~{formatDistance(odo.kmPerDay * 30.44, unit)}/mes{' '}
                {odo.rateSource === 'historial' ? '(según tu historial)' : '(estimado por ti)'}
              </AppText>
            </View>
          </View>
          <Button
            title="Actualizar kilometraje"
            icon="speedometer"
            variant="soft"
            onPress={() => router.push({ pathname: '/odometro', params: { vehicleId: vehicle.id } })}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Registrar servicio"
          icon="plus"
          style={styles.flex}
          onPress={() => router.push({ pathname: '/servicio/nuevo', params: { vehicleId: vehicle.id } })}
        />
        <Button title="PDF" icon="file-pdf-box" variant="secondary" loading={exporting} onPress={exportPdf} />
      </View>

      <SectionHeader title="Estado del mantenimiento" action="Agregar" onAction={() => router.push({ pathname: '/plan/agregar', params: { vehicleId: vehicle.id } })} />
      <Card>
        <View style={styles.healthTop}>
          <AppText variant="subheading" style={styles.flex}>
            {healthLabel(score)}
          </AppText>
          {score !== null ? (
            <AppText variant="heading" color={scoreColor}>
              {score}%
            </AppText>
          ) : null}
        </View>
        <ProgressBar value={(score ?? 0) / 100} color={scoreColor} height={10} />
        <AppText variant="caption" style={styles.healthHint}>
          Toca cada mantenimiento para ver qué es, ajustar su intervalo o indicar cuándo se hizo por última vez.
        </AppText>
        {active.map((s, i) => (
          <View key={s.plan.id} style={i > 0 ? [styles.separator, { borderTopColor: theme.border }] : undefined}>
            <PlanStatusRow status={s} onPress={() => router.push(`/plan/${s.plan.id}`)} />
          </View>
        ))}
        {disabled > 0 ? (
          <AppText variant="caption" style={styles.healthHint}>
            {disabled} recordatorio(s) apagado(s). Puedes volver a activarlos desde «Agregar».
          </AppText>
        ) : null}
      </Card>

      <SectionHeader title="Documentos y vencimientos" action="Agregar" onAction={() => router.push({ pathname: '/documento/nuevo', params: { vehicleId: vehicle.id } })} />
      <Card>
        {documents.length === 0 ? (
          <AppText muted>
            Agrega el vencimiento de tu seguro, verificación, tenencia o licencia y te avisamos antes de que venzan.
          </AppText>
        ) : (
          documents.map((d, i) => {
            const st = documentStatus(d);
            const kind = DOCUMENT_KINDS[d.kind];
            return (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                onPress={() => router.push(`/documento/${d.id}`)}
                style={[styles.docRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <AppText style={styles.docEmoji}>{kind.emoji}</AppText>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{d.title || kind.label}</AppText>
                  <AppText variant="small" muted>
                    Vence {formatDate(d.expiresAt)} ({relativeDays(st.daysLeft)})
                  </AppText>
                </View>
                <Pill
                  label={st.status === 'vencido' ? 'Vencido' : st.status === 'pronto' ? 'Pronto' : 'Vigente'}
                  tone={st.status === 'vencido' ? 'danger' : st.status === 'pronto' ? 'warning' : 'success'}
                />
              </Pressable>
            );
          })
        )}
      </Card>

      <SectionHeader title="Historial" action="Registrar" onAction={() => router.push({ pathname: '/servicio/nuevo', params: { vehicleId: vehicle.id } })} />
      {services.length === 0 ? (
        <Card>
          <AppText muted>Aún no hay servicios. Cada vez que lleves tu vehículo al taller, regístralo aquí.</AppText>
        </Card>
      ) : (
        <>
          {visibleServices.map((s) => (
            <ServiceCard key={s.id} service={s} workshops={data.workshops} />
          ))}
          {services.length > 5 ? (
            <Button
              title={showAllServices ? 'Ver menos' : `Ver los ${services.length} servicios`}
              variant="ghost"
              onPress={() => setShowAllServices((v) => !v)}
            />
          ) : null}
        </>
      )}

      {stats.count > 0 ? (
        <>
          <SectionHeader title="Gastos" />
          <Card>
            <View style={styles.stats}>
              <StatBox label="Total" value={formatMoney(stats.total, settings.currency)} />
              <StatBox label="Este año" value={formatMoney(stats.thisYear, settings.currency)} />
              <StatBox
                label={`Por ${unit}`}
                value={perKm !== undefined ? formatMoney(Math.round(perKm * 100) / 100, settings.currency) : '—'}
              />
            </View>
            {stats.byCategory.slice(0, 5).map((c) => {
              const name = c.categoryId === LABOR_KEY ? 'Mano de obra y otros' : getCategory(c.categoryId).name;
              return (
                <View key={c.categoryId} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <AppText variant="small" style={styles.flex} numberOfLines={1}>
                      {name}
                    </AppText>
                    <AppText variant="smallStrong">{formatMoney(c.total, settings.currency)}</AppText>
                  </View>
                  <ProgressBar value={c.total / (stats.byCategory[0]?.total || 1)} color={theme.accent} height={6} />
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Más" />
      <Expandable title="Lecturas de kilometraje" subtitle={`${manualReadings.length} registrada(s) manualmente`} icon="speedometer">
        {manualReadings.length === 0 ? (
          <AppText muted>Cuando actualices el kilometraje aparecerá aquí.</AppText>
        ) : (
          manualReadings.map((r) => (
            <View key={r.id} style={styles.readingRow}>
              <Icon name="speedometer" size={18} color={theme.textMuted} />
              <AppText style={styles.flex}>
                {formatDistance(r.km, unit)} · {formatDate(r.date)}
              </AppText>
              <IconButton
                icon="delete-outline"
                label="Borrar lectura"
                size={32}
                color={theme.danger}
                onPress={async () => {
                  if (r.id && (await confirm('¿Borrar esta lectura?', `${formatDistance(r.km, unit)} del ${formatDate(r.date)}`, 'Borrar', true))) {
                    removeOdometer(r.id);
                  }
                }}
              />
            </View>
          ))
        )}
      </Expandable>
      {vehicle.notes || vehicle.vin ? (
        <Expandable title="Notas y datos" icon="text-box-check-outline">
          {vehicle.vin ? <AppText>VIN: {vehicle.vin}</AppText> : null}
          {vehicle.notes ? <AppText>{vehicle.notes}</AppText> : null}
        </Expandable>
      ) : null}

      <View style={styles.footerButtons}>
        <Button title="Exportar historial en PDF" icon="file-pdf-box" variant="secondary" loading={exporting} onPress={exportPdf} />
        <AppText variant="caption" center>
          Ideal para mostrarlo al vender tu vehículo: un historial completo aumenta su valor.
        </AppText>
        <Button title="Editar datos del vehículo" icon="pencil" variant="ghost" onPress={() => router.push(`/vehiculo/${vehicle.id}/editar`)} />
        <Button title="Eliminar vehículo" icon="delete-outline" variant="danger" onPress={remove} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { overflow: 'hidden' },
  band: { height: 8 },
  heroBody: { padding: Spacing.lg, gap: Spacing.md },
  heroTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  kmBox: { borderRadius: 14, padding: Spacing.md, flexDirection: 'row' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  healthTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  healthHint: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  separator: { borderTopWidth: StyleSheet.hairlineWidth },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  docEmoji: { fontSize: 24, lineHeight: 30 },
  stats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  barRow: { gap: 4, marginTop: Spacing.sm },
  barLabel: { flexDirection: 'row', gap: Spacing.sm },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footerButtons: { gap: Spacing.sm, marginTop: Spacing.xl },
});
