import { getCategory } from '@/data/categories';
import type { DistanceUnit, MaintenancePlan, ServiceItem, ServiceRecord, Vehicle } from '@/types';

import { compareISO, diffDays, formatDate, formatDuration } from './dates';
import { formatDistance, formatMoney } from './format';
import { intervalText, recommendedIntervalFor, serviceHasCategory } from './maintenance';

export type TimingKind = 'primero' | 'temprano' | 'a_tiempo' | 'tarde' | 'sin_intervalo';

export interface ItemAnalysis {
  kind: TimingKind;
  title: string;
  text: string;
  previous?: ServiceRecord;
  costNote?: string;
}

/** El registro anterior del mismo trabajo para el mismo vehículo. */
export function previousService(
  service: ServiceRecord,
  categoryId: string,
  services: ServiceRecord[],
): ServiceRecord | undefined {
  let prev: ServiceRecord | undefined;
  for (const s of services) {
    if (s.id === service.id || s.vehicleId !== service.vehicleId || !serviceHasCategory(s, categoryId)) continue;
    const before =
      compareISO(s.date, service.date) < 0 ||
      (s.date === service.date && s.km !== undefined && service.km !== undefined && s.km < service.km);
    if (!before) continue;
    if (!prev || compareISO(s.date, prev.date) > 0 || (s.date === prev.date && (s.km ?? 0) > (prev.km ?? 0))) {
      prev = s;
    }
  }
  return prev;
}

function sinceText(km: number | undefined, days: number, unit: DistanceUnit): string {
  const parts: string[] = [];
  if (km !== undefined) parts.push(formatDistance(km, unit));
  parts.push(formatDuration(days));
  return parts.join(' y ');
}

/** Analiza si un trabajo se hizo antes, a tiempo o tarde respecto al registro anterior. */
export function analyzeItem(
  service: ServiceRecord,
  item: ServiceItem,
  services: ServiceRecord[],
  vehicle: Vehicle,
  plan: MaintenancePlan | undefined,
  unit: DistanceUnit,
  currency: string,
): ItemAnalysis {
  const interval =
    plan && (plan.intervalKm || plan.intervalMonths)
      ? { km: plan.intervalKm, months: plan.intervalMonths }
      : recommendedIntervalFor(item.categoryId, vehicle, unit);
  const prev = previousService(service, item.categoryId, services);
  const costNote = compareCost(item, prev, currency);

  if (!interval || (!interval.km && !interval.months)) {
    return {
      kind: 'sin_intervalo',
      title: 'Se hace según el desgaste',
      text: prev
        ? `La vez anterior fue el ${formatDate(prev.date)}. Este trabajo no tiene un intervalo fijo: se hace cuando hay desgaste o una falla.`
        : 'Este trabajo no tiene un intervalo fijo: se hace cuando hay desgaste o una falla. Por eso es útil que guardes el motivo y lo que te explicó el mecánico.',
      previous: prev,
      costNote,
    };
  }

  const recommended = intervalText({ intervalKm: interval.km, intervalMonths: interval.months }, unit).toLowerCase();

  if (!prev) {
    return {
      kind: 'primero',
      title: 'Primer registro',
      text: `Es el primer registro de este trabajo en MiGaraje. A partir de aquí te avisamos cuándo toca de nuevo (recomendado: ${recommended}).`,
      costNote,
    };
  }

  const days = Math.max(0, diffDays(prev.date, service.date));
  const km = prev.km !== undefined && service.km !== undefined ? Math.max(0, service.km - prev.km) : undefined;
  const ratios: number[] = [];
  if (km !== undefined && interval.km) ratios.push(km / interval.km);
  if (interval.months) ratios.push(days / (interval.months * 30.44));
  const ratio = Math.max(0, ...ratios);
  const since = sinceText(km, days, unit);

  if (ratio < 0.5) {
    return {
      kind: 'temprano',
      title: 'Se hizo antes de lo habitual',
      text: `Pasaron ${since} desde la vez anterior, menos de la mitad de lo recomendado (${recommended}). Si no hubo una falla o un motivo especial, vale la pena preguntarle al taller por qué fue necesario.`,
      previous: prev,
      costNote,
    };
  }
  if (ratio <= 1.15) {
    return {
      kind: 'a_tiempo',
      title: '¡Se hizo a tiempo!',
      text: `Pasaron ${since} desde la vez anterior. Lo recomendado es ${recommended}. ¡Bien hecho!`,
      previous: prev,
      costNote,
    };
  }
  return {
    kind: 'tarde',
    title: 'Se hizo un poco tarde',
    text: `Pasaron ${since} desde la vez anterior y lo recomendado es ${recommended}. Activa los recordatorios para no pasarte la próxima vez.`,
    previous: prev,
    costNote,
  };
}

function compareCost(item: ServiceItem, prev: ServiceRecord | undefined, currency: string): string | undefined {
  if (!prev || item.cost === undefined) return undefined;
  const prevItem = prev.items.find((i) => i.categoryId === item.categoryId);
  if (!prevItem || prevItem.cost === undefined || prevItem.cost <= 0) return undefined;
  const diff = (item.cost - prevItem.cost) / prevItem.cost;
  const pct = Math.round(Math.abs(diff) * 100);
  const prevText = `${formatMoney(prevItem.cost, currency)} el ${formatDate(prev.date)}`;
  if (pct < 5) return `Costó casi lo mismo que la vez anterior (${prevText}).`;
  return diff > 0
    ? `Costó ${pct}% más que la vez anterior (${prevText}).`
    : `Costó ${pct}% menos que la vez anterior (${prevText}).`;
}

export function itemName(item: ServiceItem): string {
  return getCategory(item.categoryId).name;
}
