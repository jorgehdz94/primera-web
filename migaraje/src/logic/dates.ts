import type { ISODate } from '@/types';

const DAY_MS = 86_400_000;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Fecha local de hoy (o de `date`) en formato YYYY-MM-DD. */
export function toISODate(date: Date = new Date()): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function isValidISODate(value: string | undefined | null): value is ISODate {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function parts(iso: ISODate): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function toUTC(iso: ISODate): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): ISODate {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Convierte una fecha ISO en un Date local a mediodía (útil para selectores de fecha). */
export function isoToLocalDate(iso: ISODate): Date {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Días de `from` a `to` (positivo si `to` es posterior). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(toUTC(iso) + Math.round(days) * DAY_MS);
}

/** Suma meses respetando fin de mes (31 ene + 1 mes = 28/29 feb). */
export function addMonths(iso: ISODate, months: number): ISODate {
  const [y, m, d] = parts(iso);
  const totalMonths = y * 12 + (m - 1) + months;
  const ny = Math.floor(totalMonths / 12);
  const nm = totalMonths - ny * 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, lastDay))}`;
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function yearOf(iso: ISODate): number {
  return parts(iso)[0];
}

/** "9 oct 2026" */
export function formatDate(iso: ISODate | undefined): string {
  if (!iso || !isValidISODate(iso)) return '—';
  const [y, m, d] = parts(iso);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "9 de octubre de 2026" */
export function formatDateLong(iso: ISODate | undefined): string {
  if (!iso || !isValidISODate(iso)) return '—';
  const [y, m, d] = parts(iso);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** "octubre 2026" */
export function formatMonthYear(iso: ISODate): string {
  const [y, m] = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Texto relativo amigable: "hoy", "mañana", "en 5 días", "hace 2 meses"… */
export function relativeDays(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  const abs = Math.abs(days);
  let unit: string;
  if (abs < 14) unit = `${abs} días`;
  else if (abs < 60) unit = `${Math.round(abs / 7)} semanas`;
  else if (abs < 730) unit = `${Math.round(abs / 30.44)} meses`;
  else {
    const years = Math.round((abs / 365.25) * 10) / 10;
    unit = `${String(years).replace('.0', '')} años`;
  }
  return days > 0 ? `en ${unit}` : `hace ${unit}`;
}

export function relativeFromToday(iso: ISODate, today: ISODate = todayISO()): string {
  return relativeDays(diffDays(today, iso));
}

/** Duración en texto: "3 meses", "1 año", "15 días". */
export function formatDuration(days: number): string {
  const abs = Math.abs(Math.round(days));
  if (abs < 45) return `${abs} ${abs === 1 ? 'día' : 'días'}`;
  if (abs < 730) {
    const months = Math.round(abs / 30.44);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.round((abs / 365.25) * 10) / 10;
  return `${String(years).replace('.0', '')} años`;
}

export function formatMonths(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  return `${months} ${months === 1 ? 'mes' : 'meses'}`;
}
