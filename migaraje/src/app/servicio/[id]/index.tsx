import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Expandable, VehicleChip, workshopLabel } from '@/components/domain';
import { StarRating } from '@/components/Form';
import { PhotoStrip } from '@/components/PhotoStrip';
import { Screen } from '@/components/Screen';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';
import { Bullets, Button, Card, EmptyState, IconButton, IconCircle, InfoBox, SectionHeader, type Tone } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useAppData, useVehicleOverview } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { analyzeItem, type TimingKind } from '@/logic/analysis';
import { compareISO, formatDate, formatDateLong, relativeFromToday, todayISO } from '@/logic/dates';
import { formatDistance, formatMoney, vehicleTitle } from '@/logic/format';
import { serviceTotal } from '@/logic/stats';
import { explainService, friendlyAIError, getApiKey } from '@/services/ai';
import { confirm, toast } from '@/services/feedback';
import { deletePhotos } from '@/services/photos';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

const TIMING_TONE: Record<TimingKind, Tone> = {
  primero: 'info',
  temprano: 'warning',
  a_tiempo: 'success',
  tarde: 'danger',
  sin_intervalo: 'neutral',
};

const TIMING_ICON = {
  primero: 'flag-checkered',
  temprano: 'alert-circle-outline',
  a_tiempo: 'check-circle-outline',
  tarde: 'clock-alert-outline',
  sin_intervalo: 'information-outline',
} as const;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const data = useAppData();
  const service = data.services.find((s) => s.id === id);
  const overview = useVehicleOverview(service?.vehicleId);
  const removeService = useStore((s) => s.removeService);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!service || !overview) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este servicio" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  const { vehicle } = overview;
  const { settings } = data;
  const unit = settings.distanceUnit;
  const shop = data.workshops.find((w) => w.id === service.workshopId);
  const shopName = workshopLabel(service, data.workshops);
  const total = serviceTotal(service);
  const today = todayISO();

  const warrantyDateOk = service.warrantyUntil ? compareISO(service.warrantyUntil, today) >= 0 : undefined;
  const warrantyKmLimit = service.warrantyKm !== undefined && service.km !== undefined ? service.km + service.warrantyKm : undefined;
  const warrantyKmOk = warrantyKmLimit !== undefined ? overview.odo.estimatedKm <= warrantyKmLimit : undefined;
  const hasWarranty = service.warrantyUntil !== undefined || service.warrantyKm !== undefined;
  const warrantyActive = hasWarranty && warrantyDateOk !== false && warrantyKmOk !== false;

  const shareSummary = async () => {
    const lines = [
      `🔧 Servicio del ${formatDate(service.date)} — ${vehicle.nickname || vehicleTitle(vehicle)}`,
      service.km !== undefined ? `Kilometraje: ${formatDistance(service.km, unit)}` : '',
      ...service.items.map((i) => `• ${getCategory(i.categoryId).name}${i.detail ? ` (${i.detail})` : ''}${i.cost !== undefined ? `: ${formatMoney(i.cost, settings.currency)}` : ''}`),
      shopName ? `Taller: ${shopName}` : '',
      service.mechanic ? `Responsable: ${service.mechanic}` : '',
      total > 0 ? `Total: ${formatMoney(total, settings.currency)}` : '',
      '',
      'Registrado con MiGaraje',
    ].filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''));
    await Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const askAI = async () => {
    const key = await getApiKey();
    if (!key) {
      router.push('/ia/configurar');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const text = await explainService({
        vehicle,
        service,
        workshopName: shopName,
        history: overview.services.filter((s) => s.id !== service.id),
        settings,
        estimatedKm: overview.odo.estimatedKm,
      });
      setAiText(text);
    } catch (e) {
      setAiError(friendlyAIError(e));
    } finally {
      setAiLoading(false);
    }
  };

  const remove = async () => {
    const ok = await confirm('¿Eliminar este servicio?', 'Se borrará de la bitácora junto con sus fotos.', 'Eliminar', true);
    if (!ok) return;
    deletePhotos(removeService(service.id));
    toast('Servicio eliminado', '🗑️');
    goBack();
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: formatDate(service.date),
          headerRight: () => (
            <IconButton icon="pencil" label="Editar servicio" size={36} onPress={() => router.push(`/servicio/${service.id}/editar`)} />
          ),
        }}
      />

      <Card>
        <VehicleChip vehicle={vehicle} />
        <AppText variant="title" style={styles.title}>
          {service.items.length === 1 ? getCategory(service.items[0].categoryId).name : `${service.items.length} trabajos`}
        </AppText>
        <AppText muted>
          {formatDateLong(service.date)} · {relativeFromToday(service.date, today)}
        </AppText>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Kilometraje</AppText>
            <AppText variant="heading">{service.km !== undefined ? formatDistance(service.km, unit) : '—'}</AppText>
          </View>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Total pagado</AppText>
            <AppText variant="heading">{total > 0 ? formatMoney(total, settings.currency) : '—'}</AppText>
          </View>
        </View>
      </Card>

      <SectionHeader title="¿Quién fue el responsable?" />
      <Card onPress={shop ? () => router.push(`/taller/${shop.id}`) : undefined}>
        <View style={styles.row}>
          <IconCircle icon="account-wrench" color={theme.accent} background={theme.accentSoft} size={48} />
          <View style={styles.flex}>
            <AppText variant="subheading">{service.mechanic || 'Mecánico sin registrar'}</AppText>
            <AppText muted>{shopName || 'Taller sin registrar'}</AppText>
            {service.rating ? <StarRating value={service.rating} size={16} /> : null}
          </View>
          {shop?.phone ? (
            <IconButton icon="phone" label="Llamar al taller" color="#FFFFFF" background={theme.success} onPress={() => Linking.openURL(`tel:${shop.phone}`)} />
          ) : null}
        </View>
      </Card>

      {service.reason || service.diagnosis ? (
        <>
          <SectionHeader title="Motivo y diagnóstico" />
          <Card style={styles.gap}>
            {service.reason ? (
              <View>
                <AppText variant="overline">Por qué lo llevaste</AppText>
                <AppText>{service.reason}</AppText>
              </View>
            ) : null}
            {service.diagnosis ? (
              <View>
                <AppText variant="overline">Lo que explicó el mecánico</AppText>
                <AppText>{service.diagnosis}</AppText>
              </View>
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionHeader title="¿Qué te hicieron y por qué?" />
      <AppText variant="caption" style={styles.hint}>
        Toca cada trabajo para entenderlo y ver si se hizo a tiempo.
      </AppText>
      {service.items.map((item, index) => {
        const c = getCategory(item.categoryId);
        const plan = data.plans.find((p) => p.vehicleId === vehicle.id && p.categoryId === item.categoryId);
        const analysis = analyzeItem(service, item, data.services, vehicle, plan, unit, settings.currency);
        return (
          <Expandable
            key={item.id}
            title={c.name}
            subtitle={item.detail || c.what}
            icon={c.icon}
            initiallyOpen={index === 0}
            right={item.cost !== undefined ? <AppText variant="smallStrong">{formatMoney(item.cost, settings.currency)}</AppText> : undefined}>
            <View>
              <AppText variant="overline">Qué es</AppText>
              <AppText>{c.what}</AppText>
            </View>
            <View>
              <AppText variant="overline">Por qué se hace</AppText>
              <AppText>{c.why}</AppText>
            </View>
            <InfoBox tone={TIMING_TONE[analysis.kind]} icon={TIMING_ICON[analysis.kind]} title={analysis.title} text={analysis.text}>
              {analysis.costNote ? (
                <AppText variant="small" style={styles.costNote}>
                  💰 {analysis.costNote}
                </AppText>
              ) : null}
            </InfoBox>
            {item.nextKm !== undefined || item.nextDate ? (
              <InfoBox
                tone="primary"
                icon="calendar-clock"
                text={`El taller indicó el próximo ${item.nextKm !== undefined ? `a los ${formatDistance(item.nextKm, unit)}` : ''}${item.nextKm !== undefined && item.nextDate ? ' o ' : ''}${item.nextDate ? `el ${formatDate(item.nextDate)}` : ''}.`}
              />
            ) : null}
            {c.askMechanic.length > 0 ? (
              <View style={styles.gapSmall}>
                <AppText variant="overline">Preguntas que puedes hacer</AppText>
                <Bullets items={c.askMechanic.slice(0, 3)} />
              </View>
            ) : null}
            <Button title="Ver guía completa" icon="book-open-variant" variant="ghost" size="sm" onPress={() => router.push(`/guia/servicio/${c.id}`)} />
          </Expandable>
        );
      })}

      <Card tone="alt" style={styles.aiCard}>
        <View style={styles.row}>
          <IconCircle icon="robot-outline" color="#9333EA" background="#9333EA1F" size={44} />
          <View style={styles.flex}>
            <AppText variant="subheading">¿Aún con dudas?</AppText>
            <AppText variant="small" muted>
              El asistente revisa este servicio junto con tu historial y te lo explica.
            </AppText>
          </View>
        </View>
        {aiText ? <SimpleMarkdown text={aiText} /> : null}
        {aiError ? <InfoBox tone="danger" icon="alert-circle-outline" text={aiError} /> : null}
        <Button
          title={aiText ? 'Volver a explicar' : 'Explícamelo con IA'}
          icon="creation"
          variant={aiText ? 'secondary' : 'primary'}
          loading={aiLoading}
          onPress={askAI}
        />
      </Card>

      {hasWarranty ? (
        <>
          <SectionHeader title="Garantía" />
          <InfoBox
            tone={warrantyActive ? 'success' : 'neutral'}
            icon={warrantyActive ? 'shield-check' : 'shield-alert-outline'}
            title={warrantyActive ? 'Garantía vigente' : 'Garantía vencida'}
            text={[
              service.warrantyUntil ? `Hasta el ${formatDate(service.warrantyUntil)}` : '',
              warrantyKmLimit !== undefined ? `hasta los ${formatDistance(warrantyKmLimit, unit)}` : '',
            ]
              .filter(Boolean)
              .join(' o ')
              .concat(warrantyActive && service.mechanic ? `. Si algo falla, el responsable es ${service.mechanic}${shopName ? ` (${shopName})` : ''}.` : '.')}
          />
        </>
      ) : null}

      {service.photos.length > 0 ? (
        <>
          <SectionHeader title="Fotos" />
          <PhotoStrip photos={service.photos} />
        </>
      ) : null}

      {service.notes ? (
        <>
          <SectionHeader title="Notas" />
          <Card>
            <AppText>{service.notes}</AppText>
          </Card>
        </>
      ) : null}

      <View style={styles.footer}>
        <Button title="Compartir resumen" icon="share-variant" variant="secondary" onPress={shareSummary} />
        <Button title="Editar servicio" icon="pencil" variant="ghost" onPress={() => router.push(`/servicio/${service.id}/editar`)} />
        <Button title="Eliminar servicio" icon="delete-outline" variant="danger" onPress={remove} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: Spacing.sm },
  summary: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  summaryItem: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  gap: { gap: Spacing.md },
  gapSmall: { gap: 6 },
  hint: { marginTop: -Spacing.xs, marginBottom: Spacing.md },
  costNote: { marginTop: 6 },
  aiCard: { gap: Spacing.md, marginTop: Spacing.sm },
  footer: { gap: Spacing.sm, marginTop: Spacing.xl },
});
