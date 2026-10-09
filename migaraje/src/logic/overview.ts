import type { AppData, ISODate, ServiceRecord, Vehicle, VehicleDocument } from '@/types';

import { compareISO, diffDays, todayISO } from './dates';
import { computePlanStatus, healthScore, sortStatuses, type PlanStatus } from './maintenance';
import { vehicleOdometer, vehicleReadings, type Reading, type VehicleOdometer } from './odometer';

export interface VehicleOverview {
  vehicle: Vehicle;
  odo: VehicleOdometer;
  readings: Reading[];
  statuses: PlanStatus[];
  score: number | null;
  services: ServiceRecord[];
  documents: VehicleDocument[];
}

export function sortServicesDesc(services: ServiceRecord[]): ServiceRecord[] {
  return [...services].sort(
    (a, b) => compareISO(b.date, a.date) || (b.km ?? 0) - (a.km ?? 0) || b.createdAt.localeCompare(a.createdAt),
  );
}

type OverviewData = Pick<AppData, 'vehicles' | 'services' | 'odometer' | 'plans' | 'documents'>;

export function vehicleOverview(
  data: OverviewData,
  vehicleId: string,
  today: ISODate = todayISO(),
): VehicleOverview | undefined {
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return undefined;
  const services = data.services.filter((s) => s.vehicleId === vehicleId);
  const odometer = data.odometer.filter((o) => o.vehicleId === vehicleId);
  const readings = vehicleReadings(vehicle, services, odometer);
  const odo = vehicleOdometer(vehicle, services, odometer, today);
  const statuses = sortStatuses(
    data.plans.filter((p) => p.vehicleId === vehicleId).map((p) => computePlanStatus(p, services, odo, readings, today)),
  );
  return {
    vehicle,
    odo,
    readings,
    statuses,
    score: healthScore(statuses),
    services: sortServicesDesc(services),
    documents: data.documents
      .filter((d) => d.vehicleId === vehicleId)
      .sort((a, b) => compareISO(a.expiresAt, b.expiresAt)),
  };
}

export function allOverviews(data: OverviewData, today: ISODate = todayISO()): VehicleOverview[] {
  return data.vehicles
    .map((v) => vehicleOverview(data, v.id, today))
    .filter((o): o is VehicleOverview => o !== undefined);
}

export type DocumentStatusKind = 'vencido' | 'pronto' | 'ok';

export function documentStatus(doc: VehicleDocument, today: ISODate = todayISO()): { status: DocumentStatusKind; daysLeft: number } {
  const daysLeft = diffDays(today, doc.expiresAt);
  if (daysLeft < 0) return { status: 'vencido', daysLeft };
  if (daysLeft <= 30) return { status: 'pronto', daysLeft };
  return { status: 'ok', daysLeft };
}
