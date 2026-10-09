import { categoriesFor, getCategory, recommendedInterval, type Interval, type ServiceCategory } from '@/data/categories';
import type { DistanceUnit, ISODate, MaintenancePlan, ServiceRecord, Vehicle } from '@/types';

import { addDays, addMonths, compareISO, diffDays, formatDate, formatMonths, relativeDays, todayISO } from './dates';
import { formatDistance, newId } from './format';
import { kmAtDate, type Reading, type VehicleOdometer } from './odometer';

export const KM_PER_MILE = 1.609344;

export type PlanStatusKind = 'vencido' | 'pronto' | 'ok' | 'sin_datos' | 'desactivado';

export interface LastDone {
  date: ISODate;
  km?: number;
  /** true si el km se estimó porque el registro no lo tenía. */
  kmEstimated?: boolean;
  nextKm?: number;
  nextDate?: ISODate;
  serviceId?: string;
  fromBaseline?: boolean;
}

export interface PlanStatus {
  plan: MaintenancePlan;
  category: ServiceCategory;
  label: string;
  last?: LastDone;
  dueKm?: number;
  dueDate?: ISODate;
  kmLeft?: number;
  daysLeft?: number;
  predictedDate?: ISODate;
  /** Fracción del intervalo ya recorrida (1 = toca hoy). */
  progress: number;
  status: PlanStatusKind;
  /** Qué llega primero: el kilometraje o la fecha. */
  binding?: 'km' | 'fecha';
}

/** Convierte un intervalo en km a la unidad del usuario, redondeado a cifras amigables. */
export function convertIntervalKm(km: number | undefined, unit: DistanceUnit): number | undefined {
  if (km === undefined) return undefined;
  if (unit === 'km') return km;
  const miles = km / KM_PER_MILE;
  const step = miles >= 2000 ? 500 : 100;
  return Math.max(step, Math.round(miles / step) * step);
}

export function recommendedIntervalFor(categoryId: string, vehicle: Vehicle, unit: DistanceUnit): Interval | undefined {
  const interval = recommendedInterval(categoryId, vehicle.type, vehicle.oilType);
  if (!interval) return undefined;
  return { km: convertIntervalKm(interval.km, unit), months: interval.months };
}

export function defaultPlans(vehicle: Vehicle, unit: DistanceUnit): MaintenancePlan[] {
  return categoriesFor(vehicle.type, vehicle.fuel)
    .filter((c) => c.trackedFor?.includes(vehicle.type))
    .map((c) => {
      const interval = recommendedIntervalFor(c.id, vehicle, unit);
      return {
        id: newId(),
        vehicleId: vehicle.id,
        categoryId: c.id,
        intervalKm: interval?.km,
        intervalMonths: interval?.months,
        enabled: true,
        notify: true,
      };
    });
}

export function serviceHasCategory(s: ServiceRecord, categoryId: string): boolean {
  return s.items.some((i) => i.categoryId === categoryId);
}

/** Último registro de un trabajo (o la referencia que indicó el usuario si es más reciente). */
export function lastDoneFor(
  plan: MaintenancePlan,
  services: ServiceRecord[],
  readings: Reading[] = [],
  kmPerDay = 0,
): LastDone | undefined {
  let latest: ServiceRecord | undefined;
  for (const s of services) {
    if (s.vehicleId !== plan.vehicleId || !serviceHasCategory(s, plan.categoryId)) continue;
    if (
      !latest ||
      compareISO(s.date, latest.date) > 0 ||
      (s.date === latest.date && (s.km ?? 0) > (latest.km ?? 0))
    ) {
      latest = s;
    }
  }

  let result: LastDone | undefined;
  if (latest) {
    const item = latest.items.find((i) => i.categoryId === plan.categoryId);
    result = {
      date: latest.date,
      km: latest.km,
      nextKm: item?.nextKm,
      nextDate: item?.nextDate,
      serviceId: latest.id,
    };
  }
  if (plan.baselineDate && (!result || compareISO(plan.baselineDate, result.date) > 0)) {
    result = { date: plan.baselineDate, km: plan.baselineKm, fromBaseline: true };
  }
  if (result && result.km === undefined && readings.length > 0) {
    const estimated = kmAtDate(readings, result.date, kmPerDay);
    if (estimated !== undefined) {
      result = { ...result, km: estimated, kmEstimated: true };
    }
  }
  return result;
}

export function computePlanStatus(
  plan: MaintenancePlan,
  services: ServiceRecord[],
  odo: VehicleOdometer,
  readings: Reading[] = [],
  today: ISODate = todayISO(),
): PlanStatus {
  const category = getCategory(plan.categoryId);
  const label = category.planLabel ?? category.name;
  const base = { plan, category, label };

  if (!plan.enabled) return { ...base, progress: 0, status: 'desactivado' };

  const last = lastDoneFor(plan, services, readings, odo.kmPerDay);
  if (!last) return { ...base, progress: 0, status: 'sin_datos' };

  const dueKm = last.nextKm ?? (last.km !== undefined && plan.intervalKm ? last.km + plan.intervalKm : undefined);
  const dueDate = last.nextDate ?? (plan.intervalMonths ? addMonths(last.date, plan.intervalMonths) : undefined);

  if (dueKm === undefined && dueDate === undefined) {
    return { ...base, last, progress: 0, status: 'sin_datos' };
  }

  const kmLeft = dueKm !== undefined ? dueKm - odo.estimatedKm : undefined;
  const daysByDate = dueDate !== undefined ? diffDays(today, dueDate) : undefined;
  const daysByKm = kmLeft !== undefined && odo.kmPerDay > 0 ? Math.round(kmLeft / odo.kmPerDay) : undefined;
  const candidates = [daysByDate, daysByKm].filter((d): d is number => d !== undefined);
  const daysLeft = candidates.length > 0 ? Math.min(...candidates) : undefined;

  const ratios: number[] = [];
  if (dueKm !== undefined && last.km !== undefined && dueKm > last.km) {
    ratios.push((odo.estimatedKm - last.km) / (dueKm - last.km));
  }
  if (dueDate !== undefined) {
    const span = diffDays(last.date, dueDate);
    if (span > 0) ratios.push(diffDays(last.date, today) / span);
  }
  const progress = Math.max(0, ...ratios);

  let status: PlanStatusKind = 'ok';
  if ((kmLeft !== undefined && kmLeft <= 0) || (daysByDate !== undefined && daysByDate <= 0)) {
    status = 'vencido';
  } else if (progress >= 0.85 || (daysLeft !== undefined && daysLeft <= 14)) {
    status = 'pronto';
  }

  let binding: 'km' | 'fecha';
  if (daysByKm !== undefined && (daysByDate === undefined || daysByKm <= daysByDate)) binding = 'km';
  else if (daysByDate !== undefined) binding = 'fecha';
  else binding = 'km';

  return {
    ...base,
    last,
    dueKm,
    dueDate,
    kmLeft,
    daysLeft,
    predictedDate: daysLeft !== undefined ? addDays(today, daysLeft) : undefined,
    progress,
    status,
    binding,
  };
}

const STATUS_ORDER: Record<PlanStatusKind, number> = { vencido: 0, pronto: 1, ok: 2, sin_datos: 3, desactivado: 4 };

export function sortStatuses(statuses: PlanStatus[]): PlanStatus[] {
  return [...statuses].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.daysLeft ?? Number.MAX_SAFE_INTEGER) - (b.daysLeft ?? Number.MAX_SAFE_INTEGER) ||
      a.label.localeCompare(b.label),
  );
}

/** Porcentaje de mantenimientos al día (null si aún no hay datos). */
export function healthScore(statuses: PlanStatus[]): number | null {
  let total = 0;
  let points = 0;
  for (const s of statuses) {
    if (s.status === 'ok') {
      total += 1;
      points += 1;
    } else if (s.status === 'pronto') {
      total += 1;
      points += 0.6;
    } else if (s.status === 'vencido') {
      total += 1;
    }
  }
  return total === 0 ? null : Math.round((points / total) * 100);
}

export function healthLabel(score: number | null): string {
  if (score === null) return 'Registra servicios para ver su estado';
  if (score >= 90) return '¡Excelente! Todo al día';
  if (score >= 70) return 'Bien, con algunos pendientes';
  if (score >= 40) return 'Necesita atención';
  return 'Hay mantenimientos atrasados';
}

/** Frase principal del estado: "Faltan ~1,200 km", "Venció hace 2 semanas"… */
export function statusHeadline(s: PlanStatus, unit: DistanceUnit, today: ISODate = todayISO()): string {
  switch (s.status) {
    case 'desactivado':
      return 'Recordatorio desactivado';
    case 'sin_datos':
      return s.last ? 'Falta el kilometraje del último registro' : 'Sin registro todavía';
    case 'vencido': {
      if (s.kmLeft !== undefined && s.kmLeft <= 0) return `Te pasaste por ~${formatDistance(-s.kmLeft, unit)}`;
      if (s.dueDate) return `Venció ${relativeDays(diffDays(today, s.dueDate))}`;
      return 'Ya toca';
    }
    default: {
      if (s.binding === 'km' && s.kmLeft !== undefined) {
        const when = s.daysLeft !== undefined ? ` · ${relativeDays(s.daysLeft)}` : '';
        return `Faltan ~${formatDistance(s.kmLeft, unit)}${when}`;
      }
      if (s.dueDate) return `Toca ${relativeDays(diffDays(today, s.dueDate))} (${formatDate(s.dueDate)})`;
      return 'Al día';
    }
  }
}

export function intervalText(plan: Pick<MaintenancePlan, 'intervalKm' | 'intervalMonths'>, unit: DistanceUnit): string {
  const parts: string[] = [];
  if (plan.intervalKm) parts.push(formatDistance(plan.intervalKm, unit));
  if (plan.intervalMonths) parts.push(formatMonths(plan.intervalMonths));
  if (parts.length === 0) return 'Sin intervalo';
  return `Cada ${parts.join(' o ')}`;
}

export const STATUS_LABELS: Record<PlanStatusKind, string> = {
  vencido: 'Vencido',
  pronto: 'Pronto',
  ok: 'Al día',
  sin_datos: 'Sin datos',
  desactivado: 'Apagado',
};
