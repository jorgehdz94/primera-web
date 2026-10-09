import type { AppData, Settings } from '@/types';

import { isValidISODate } from './dates';

export const BACKUP_APP_ID = 'migaraje';
export const BACKUP_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  distanceUnit: 'km',
  currency: '$',
  theme: 'system',
  notificationsEnabled: true,
  notifyHour: 9,
  odometerReminder: 'mensual',
};

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: AppData;
}

export function createBackup(data: AppData, now = new Date()): BackupFile {
  return { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function arrayOf<T>(value: unknown, check: (item: Record<string, unknown>) => boolean, label: string): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`El campo "${label}" no es una lista.`);
  value.forEach((item, i) => {
    if (!isObject(item) || typeof item.id !== 'string' || !check(item)) {
      throw new Error(`Hay un elemento inválido en "${label}" (posición ${i + 1}).`);
    }
  });
  return value as T[];
}

/** Valida y normaliza un respaldo. Lanza un Error con un mensaje en español si no es válido. */
export function parseBackup(text: string): AppData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un respaldo válido (no es JSON).');
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP_ID || !isObject(raw.data)) {
    throw new Error('El archivo no parece ser un respaldo de MiGaraje.');
  }
  if (typeof raw.version === 'number' && raw.version > BACKUP_VERSION) {
    throw new Error('Este respaldo es de una versión más nueva de MiGaraje. Actualiza la app e inténtalo de nuevo.');
  }
  const d = raw.data;
  const date = (v: unknown) => typeof v === 'string' && isValidISODate(v);
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

  const vehicles = arrayOf<AppData['vehicles'][number]>(
    d.vehicles,
    (v) => (v.type === 'carro' || v.type === 'moto') && date(v.createdAt) && num(v.initialKm),
    'vehículos',
  );
  const services = arrayOf<AppData['services'][number]>(
    d.services,
    (s) => typeof s.vehicleId === 'string' && date(s.date) && Array.isArray(s.items),
    'servicios',
  ).map((s) => ({ ...s, photos: Array.isArray(s.photos) ? s.photos : [] }));
  const odometer = arrayOf<AppData['odometer'][number]>(
    d.odometer,
    (o) => typeof o.vehicleId === 'string' && date(o.date) && num(o.km),
    'kilometraje',
  );
  const workshops = arrayOf<AppData['workshops'][number]>(d.workshops, (w) => typeof w.name === 'string', 'talleres').map(
    (w) => ({ ...w, mechanics: Array.isArray(w.mechanics) ? w.mechanics : [] }),
  );
  const plans = arrayOf<AppData['plans'][number]>(
    d.plans,
    (p) => typeof p.vehicleId === 'string' && typeof p.categoryId === 'string',
    'recordatorios',
  );
  const documents = arrayOf<AppData['documents'][number]>(
    d.documents,
    (doc) => typeof doc.vehicleId === 'string' && date(doc.expiresAt),
    'documentos',
  );

  return {
    vehicles,
    services,
    odometer,
    workshops,
    plans,
    documents,
    settings: { ...DEFAULT_SETTINGS, ...(isObject(d.settings) ? (d.settings as Partial<Settings>) : {}) },
    onboarded: true,
  };
}
