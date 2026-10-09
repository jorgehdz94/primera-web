import type { ISODate, OdometerReading, ServiceRecord, Vehicle } from '@/types';

import { addDays, compareISO, diffDays, todayISO } from './dates';

export type ReadingSource = 'alta' | 'servicio' | 'manual';

export interface Reading {
  date: ISODate;
  km: number;
  source: ReadingSource;
  id?: string;
}

export interface VehicleOdometer {
  /** Mayor kilometraje registrado. */
  knownKm: number;
  knownDate: ISODate;
  /** Kilometraje estimado para hoy. */
  estimatedKm: number;
  kmPerDay: number;
  /** De dónde sale el promedio: del historial real o de lo que indicó el usuario. */
  rateSource: 'historial' | 'estimado';
  daysSinceReading: number;
}

const AVG_DAYS_PER_MONTH = 30.44;

export function vehicleReadings(vehicle: Vehicle, services: ServiceRecord[], odometer: OdometerReading[]): Reading[] {
  const readings: Reading[] = [{ date: vehicle.createdAt, km: vehicle.initialKm, source: 'alta' }];
  for (const s of services) {
    if (s.vehicleId === vehicle.id && typeof s.km === 'number') {
      readings.push({ date: s.date, km: s.km, source: 'servicio', id: s.id });
    }
  }
  for (const o of odometer) {
    if (o.vehicleId === vehicle.id) readings.push({ date: o.date, km: o.km, source: 'manual', id: o.id });
  }
  return readings.sort((a, b) => compareISO(a.date, b.date) || a.km - b.km);
}

/** La lectura con mayor kilometraje (si hay empate, la más reciente). */
export function latestReading(readings: Reading[]): Reading {
  let best = readings[0];
  for (const r of readings) {
    if (r.km > best.km || (r.km === best.km && compareISO(r.date, best.date) > 0)) best = r;
  }
  return best;
}

/**
 * Promedio de km por día con base en el último año de lecturas.
 * Si no hay suficiente historial (menos de 30 días entre lecturas) usa los km/mes que indicó el usuario.
 */
export function averageKmPerDay(readings: Reading[], monthlyKm: number): { rate: number; source: 'historial' | 'estimado' } {
  const fallback = { rate: Math.max(0, monthlyKm) / AVG_DAYS_PER_MONTH, source: 'estimado' as const };
  if (readings.length < 2) return fallback;
  const latest = latestReading(readings);
  const windowStart = addDays(latest.date, -365);
  const earliest = readings.find(
    (r) => compareISO(r.date, windowStart) >= 0 && compareISO(r.date, latest.date) < 0 && r.km <= latest.km,
  );
  if (!earliest) return fallback;
  const days = diffDays(earliest.date, latest.date);
  const km = latest.km - earliest.km;
  if (days < 30 || km <= 0) return fallback;
  return { rate: Math.min(km / days, 2000), source: 'historial' };
}

export function vehicleOdometer(
  vehicle: Vehicle,
  services: ServiceRecord[],
  odometer: OdometerReading[],
  today: ISODate = todayISO(),
): VehicleOdometer {
  const readings = vehicleReadings(vehicle, services, odometer);
  const latest = latestReading(readings);
  const { rate, source } = averageKmPerDay(readings, vehicle.monthlyKm);
  const daysSince = Math.max(0, diffDays(latest.date, today));
  return {
    knownKm: latest.km,
    knownDate: latest.date,
    estimatedKm: Math.round(latest.km + rate * daysSince),
    kmPerDay: rate,
    rateSource: source,
    daysSinceReading: daysSince,
  };
}

/** Kilometraje aproximado en una fecha, interpolando entre lecturas. */
export function kmAtDate(readings: Reading[], date: ISODate, kmPerDay: number): number | undefined {
  if (readings.length === 0) return undefined;
  let before: Reading | undefined;
  let after: Reading | undefined;
  for (const r of readings) {
    if (compareISO(r.date, date) <= 0) before = r;
    else if (!after) after = r;
  }
  if (before && before.date === date) return before.km;
  if (before && after) {
    const span = diffDays(before.date, after.date);
    if (span <= 0) return before.km;
    return Math.round(before.km + ((after.km - before.km) * diffDays(before.date, date)) / span);
  }
  if (before) return Math.round(before.km + kmPerDay * diffDays(before.date, date));
  if (after) return Math.max(0, Math.round(after.km - kmPerDay * diffDays(date, after.date)));
  return undefined;
}
