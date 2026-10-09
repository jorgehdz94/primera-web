import type { ServiceRecord } from '@/types';

import { compareISO, yearOf } from './dates';

export const LABOR_KEY = '__mano_de_obra';

export function itemsTotal(s: ServiceRecord): number {
  return s.items.reduce((sum, i) => sum + (i.cost ?? 0), 0);
}

/** Total pagado en un servicio: el indicado, o la suma de trabajos + mano de obra. */
export function serviceTotal(s: ServiceRecord): number {
  if (s.totalCost !== undefined) return s.totalCost;
  return itemsTotal(s) + (s.laborCost ?? 0);
}

export interface CategorySpend {
  categoryId: string;
  total: number;
  count: number;
}

export interface SpendingStats {
  total: number;
  count: number;
  thisYear: number;
  byCategory: CategorySpend[];
  byYear: { year: number; total: number }[];
  firstDate?: string;
  lastDate?: string;
  averagePerVisit: number;
}

export function spendingStats(services: ServiceRecord[], currentYear = new Date().getFullYear()): SpendingStats {
  let total = 0;
  let thisYear = 0;
  const byCategory = new Map<string, CategorySpend>();
  const byYear = new Map<number, number>();
  let firstDate: string | undefined;
  let lastDate: string | undefined;

  for (const s of services) {
    const amount = serviceTotal(s);
    total += amount;
    const year = yearOf(s.date);
    if (year === currentYear) thisYear += amount;
    byYear.set(year, (byYear.get(year) ?? 0) + amount);
    if (!firstDate || compareISO(s.date, firstDate) < 0) firstDate = s.date;
    if (!lastDate || compareISO(s.date, lastDate) > 0) lastDate = s.date;

    let allocated = 0;
    for (const item of s.items) {
      const entry = byCategory.get(item.categoryId) ?? { categoryId: item.categoryId, total: 0, count: 0 };
      entry.count += 1;
      entry.total += item.cost ?? 0;
      allocated += item.cost ?? 0;
      byCategory.set(item.categoryId, entry);
    }
    const rest = amount - allocated;
    if (rest > 0) {
      const entry = byCategory.get(LABOR_KEY) ?? { categoryId: LABOR_KEY, total: 0, count: 0 };
      entry.total += rest;
      entry.count += 1;
      byCategory.set(LABOR_KEY, entry);
    }
  }

  return {
    total,
    count: services.length,
    thisYear,
    byCategory: [...byCategory.values()].filter((c) => c.total > 0).sort((a, b) => b.total - a.total),
    byYear: [...byYear.entries()].map(([year, t]) => ({ year, total: t })).sort((a, b) => a.year - b.year),
    firstDate,
    lastDate,
    averagePerVisit: services.length > 0 ? total / services.length : 0,
  };
}

/** Costo de mantenimiento por km recorrido desde el primer registro. */
export function costPerKm(services: ServiceRecord[], currentKm: number): number | undefined {
  const withKm = services.filter((s) => s.km !== undefined);
  if (withKm.length === 0) return undefined;
  const firstKm = Math.min(...withKm.map((s) => s.km as number));
  const driven = currentKm - firstKm;
  if (driven < 500) return undefined;
  const total = services.reduce((sum, s) => sum + serviceTotal(s), 0);
  return total / driven;
}
