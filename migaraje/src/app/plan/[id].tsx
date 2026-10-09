import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DateField } from '@/components/DateField';
import { ServiceCard, statusTone } from '@/components/domain';
import { Chip, Field, NumberField, SwitchRow } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Button, Card, Divider, EmptyState, IconCircle, InfoBox, Pill, ProgressBar, SectionHeader, toneColors } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppData, useVehicleOverview } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, formatMonths, relativeFromToday, todayISO } from '@/logic/dates';
import { formatDistance, parseInteger, vehicleTitle } from '@/logic/format';
import { intervalText, recommendedIntervalFor, serviceHasCategory, STATUS_LABELS, statusHeadline } from '@/logic/maintenance';
import { confirm, haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';
import type { ISODate } from '@/types';
import { goBack } from '@/services/navigation';

const MONTH_OPTIONS = [1, 3, 6, 12, 24, 36, 48, 60];

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const data = useAppData();
  const plan = data.plans.find((p) => p.id === id);
  const overview = useVehicleOverview(plan?.vehicleId);
  const updatePlan = useStore((s) => s.updatePlan);
  const removePlan = useStore((s) => s.removePlan);

  const [intervalKm, setIntervalKm] = useState(plan?.intervalKm !== undefined ? String(plan.intervalKm) : '');
  const [intervalMonths, setIntervalMonths] = useState<number | undefined>(plan?.intervalMonths);
  const [baselineDate, setBaselineDate] = useState<ISODate | undefined>(plan?.baselineDate);
  const [baselineKm, setBaselineKm] = useState(plan?.baselineKm !== undefined ? String(plan.baselineKm) : '');

  const status = overview?.statuses.find((s) => s.plan.id === id);
  if (!plan || !overview || !status) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este recordatorio" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  const { vehicle } = overview;
  const unit = data.settings.distanceUnit;
  const c = toneColors(statusTone(status.status), theme);
  const recommended = recommendedIntervalFor(plan.categoryId, vehicle, unit);
  const history = overview.services.filter((s) => serviceHasCategory(s, plan.categoryId));
  const dirty =
    (parseInteger(intervalKm) ?? undefined) !== plan.intervalKm ||
    intervalMonths !== plan.intervalMonths ||
    baselineDate !== plan.baselineDate ||
    (parseInteger(baselineKm) ?? undefined) !== plan.baselineKm;

  const save = () => {
    updatePlan(plan.id, {
      intervalKm: parseInteger(intervalKm),
      intervalMonths,
      baselineDate,
      baselineKm: baselineDate ? parseInteger(baselineKm) : undefined,
    });
    haptic('success');
    toast('Recordatorio actualizado', '⏰');
  };

  const resetRecommended = () => {
    setIntervalKm(recommended?.km !== undefined ? String(recommended.km) : '');
    setIntervalMonths(recommended?.months);
  };

  return (
    <Screen footer={dirty ? <Button title="Guardar cambios" size="lg" full icon="check" onPress={save} /> : undefined}>
      <Stack.Screen options={{ title: status.label }} />

      <Card>
        <View style={styles.row}>
          <IconCircle icon={status.category.icon} color={c.fg} background={c.bg} size={56} />
          <View style={styles.flex}>
            <AppText variant="title">{status.label}</AppText>
            <AppText muted>{vehicle.nickname || vehicleTitle(vehicle)}</AppText>
          </View>
          <Pill label={STATUS_LABELS[status.status]} tone={statusTone(status.status)} />
        </View>
        <AppText variant="subheading" style={styles.headline}>
          {statusHeadline(status, unit)}
        </AppText>
        {status.status !== 'sin_datos' && status.status !== 'desactivado' ? <ProgressBar value={status.progress} color={c.fg} height={10} /> : null}
        <View style={styles.facts}>
          <View style={styles.fact}>
            <AppText variant="caption">Última vez</AppText>
            <AppText variant="bodyStrong">{status.last ? formatDate(status.last.date) : '—'}</AppText>
            {status.last?.km !== undefined ? (
              <AppText variant="caption">
                {status.last.kmEstimated ? '≈ ' : ''}
                {formatDistance(status.last.km, unit)}
              </AppText>
            ) : null}
          </View>
          <View style={styles.fact}>
            <AppText variant="caption">Próxima vez</AppText>
            <AppText variant="bodyStrong">
              {status.dueKm !== undefined ? formatDistance(status.dueKm, unit) : status.dueDate ? formatDate(status.dueDate) : '—'}
            </AppText>
            {status.predictedDate ? <AppText variant="caption">aprox. {formatDate(status.predictedDate)}</AppText> : null}
          </View>
        </View>
      </Card>

      <View style={styles.infoWrap}>
        <InfoBox icon="lightbulb-on-outline" tone="info" title="¿Qué es y por qué importa?" text={status.category.why}>
          <Button title="Ver guía completa" variant="ghost" size="sm" icon="book-open-variant" onPress={() => router.push(`/guia/servicio/${plan.categoryId}`)} style={styles.guide} />
        </InfoBox>
      </View>

      <View style={styles.actions}>
        <Button
          title="Registrar que ya se hizo"
          icon="check-circle-outline"
          full
          onPress={() => router.push({ pathname: '/servicio/nuevo', params: { vehicleId: vehicle.id, categoryId: plan.categoryId } })}
        />
      </View>

      {!status.last || status.last.fromBaseline ? (
        <>
          <SectionHeader title="¿Cuándo se hizo por última vez?" />
          <Card>
            <AppText variant="small" muted style={styles.cardText}>
              Si se hizo antes de que usaras MiGaraje, indícalo aquí para calcular el siguiente. No hace falta registrar el servicio completo.
            </AppText>
            <DateField label="Fecha aproximada" value={baselineDate} onChange={setBaselineDate} maximumDate={todayISO()} optional placeholder="No lo sé" />
            {baselineDate ? (
              <NumberField label="Kilometraje en ese momento (opcional)" value={baselineKm} onChangeText={setBaselineKm} suffix={unit} />
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Configuración" />
      <Card>
        <SwitchRow
          icon="power"
          label="Seguimiento activo"
          hint="Si lo apagas, deja de contar para el estado de tu vehículo."
          value={plan.enabled}
          onChange={(v) => updatePlan(plan.id, { enabled: v })}
        />
        <SwitchRow
          icon="bell-outline"
          label="Enviarme notificaciones"
          hint="Una semana antes y cuando toque."
          value={plan.notify}
          onChange={(v) => updatePlan(plan.id, { notify: v })}
        />
        <Divider />
        <AppText variant="subheading" style={styles.cardTitle}>
          Cada cuándo
        </AppText>
        <AppText variant="caption" style={styles.cardText}>
          Lo que llegue primero: kilometraje o tiempo.{' '}
          {recommended ? `Recomendado: ${intervalText({ intervalKm: recommended.km, intervalMonths: recommended.months }, unit).toLowerCase()}.` : ''}
        </AppText>
        <NumberField label="Kilometraje" value={intervalKm} onChangeText={setIntervalKm} suffix={unit} placeholder="Sin límite de km" />
        <Field label="Tiempo">
          <View style={styles.chips}>
            <Chip label="Sin límite" selected={intervalMonths === undefined} onPress={() => setIntervalMonths(undefined)} />
            {MONTH_OPTIONS.map((m) => (
              <Chip key={m} label={formatMonths(m)} selected={intervalMonths === m} onPress={() => setIntervalMonths(m)} />
            ))}
          </View>
        </Field>
        {status.category.intervalNote ? <InfoBox icon="information-outline" tone="neutral" text={status.category.intervalNote} /> : null}
        <Button title="Usar lo recomendado" variant="ghost" icon="restore" onPress={resetRecommended} style={styles.reset} />
      </Card>

      <SectionHeader title="Historial de este trabajo" />
      {history.length === 0 ? (
        <Card>
          <AppText muted>Todavía no hay servicios registrados con este trabajo.</AppText>
        </Card>
      ) : (
        history.map((s) => (
          <View key={s.id}>
            <AppText variant="caption" style={styles.historyDate}>
              {relativeFromToday(s.date)}
            </AppText>
            <ServiceCard service={s} workshops={data.workshops} />
          </View>
        ))
      )}

      <Button
        title="Quitar este recordatorio"
        variant="danger"
        icon="bell-off-outline"
        style={styles.remove}
        onPress={async () => {
          if (await confirm('¿Quitar recordatorio?', 'Los servicios registrados no se borran. Puedes volver a agregarlo cuando quieras.', 'Quitar', true)) {
            removePlan(plan.id);
            goBack();
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  headline: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  facts: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg },
  fact: { flex: 1 },
  infoWrap: { marginTop: Spacing.lg },
  guide: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 4 },
  actions: { marginTop: Spacing.lg },
  cardTitle: { marginTop: Spacing.md },
  cardText: { marginBottom: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  reset: { alignSelf: 'flex-start', marginTop: Spacing.sm },
  historyDate: { marginBottom: 4 },
  remove: { marginTop: Spacing.xl },
});
