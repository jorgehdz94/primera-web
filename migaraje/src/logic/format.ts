import type { DistanceUnit } from '@/types';

/** 12345.6 -> "12,346" (o con decimales si se piden). */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${dec ? `.${dec}` : ''}`;
}

export function formatDistance(value: number | undefined, unit: DistanceUnit = 'km'): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return `${formatNumber(Math.round(value))} ${unit}`;
}

export function formatMoney(value: number | undefined, currency = '$'): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  const decimals = Math.round(value) === value ? 0 : 2;
  return `${currency}${formatNumber(value, decimals)}`;
}

/** Lee un entero escrito por el usuario: "45,000", "45.000", "45 000 km" -> 45000. */
export function parseInteger(text: string): number | undefined {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : undefined;
}

/**
 * Lee un importe escrito por el usuario. Acepta "1,500", "1.500", "1500.50", "1.500,50" y "$ 1,500".
 * Un separador seguido de exactamente 3 dígitos se trata como separador de miles.
 */
export function parseAmount(text: string): number | undefined {
  const clean = text.replace(/[^\d.,]/g, '');
  if (!clean || !/\d/.test(clean)) return undefined;
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    normalized = clean.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const pieces = clean.split(sep);
    const tail = pieces[pieces.length - 1];
    if (pieces.length > 2 || tail.length === 3) {
      normalized = pieces.join('');
    } else {
      normalized = `${pieces[0]}.${tail}`;
    }
  } else {
    normalized = clean;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export function vehicleTitle(v: { brand: string; model: string; year?: number }): string {
  return [v.brand, v.model, v.year].filter(Boolean).join(' ');
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
