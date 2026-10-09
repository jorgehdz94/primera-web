import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildDemoData } from '@/data/demo';
import { DEFAULT_SETTINGS } from '@/logic/backup';
import { newId } from '@/logic/format';
import { defaultPlans, KM_PER_MILE, recommendedIntervalFor } from '@/logic/maintenance';
import type {
  AppData,
  DistanceUnit,
  ISODate,
  MaintenancePlan,
  OdometerReading,
  ServiceRecord,
  Settings,
  Vehicle,
  VehicleDocument,
  Workshop,
} from '@/types';

export interface NewVehicleInput extends Omit<Vehicle, 'id'> {
  lastOilChange?: { date: ISODate; km?: number };
}

interface Actions {
  addVehicle: (input: NewVehicleInput) => string;
  updateVehicle: (id: string, patch: Partial<Omit<Vehicle, 'id'>>) => void;
  /** Elimina el vehículo y todo lo relacionado. Devuelve las fotos que quedaron huérfanas. */
  removeVehicle: (id: string) => string[];

  addService: (input: Omit<ServiceRecord, 'id' | 'createdAt'>) => string;
  updateService: (id: string, patch: Partial<Omit<ServiceRecord, 'id' | 'createdAt'>>) => void;
  removeService: (id: string) => string[];

  addOdometer: (input: Omit<OdometerReading, 'id'>) => string;
  removeOdometer: (id: string) => void;

  addWorkshop: (input: Omit<Workshop, 'id' | 'createdAt'>) => string;
  updateWorkshop: (id: string, patch: Partial<Omit<Workshop, 'id' | 'createdAt'>>) => void;
  removeWorkshop: (id: string) => void;

  addPlan: (vehicleId: string, categoryId: string) => string;
  updatePlan: (id: string, patch: Partial<Omit<MaintenancePlan, 'id' | 'vehicleId' | 'categoryId'>>) => void;
  removePlan: (id: string) => void;

  addDocument: (input: Omit<VehicleDocument, 'id'>) => string;
  updateDocument: (id: string, patch: Partial<Omit<VehicleDocument, 'id'>>) => void;
  removeDocument: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  /** Cambia la unidad de distancia convirtiendo todos los datos guardados. */
  setDistanceUnit: (unit: DistanceUnit) => void;
  completeOnboarding: () => void;
  loadDemo: () => void;
  importData: (data: AppData) => void;
  resetAll: () => void;
}

export type AppState = AppData & Actions;

export const INITIAL_DATA: AppData = {
  vehicles: [],
  services: [],
  odometer: [],
  workshops: [],
  plans: [],
  documents: [],
  settings: DEFAULT_SETTINGS,
  onboarded: false,
};

function nowStamp(): string {
  return new Date().toISOString();
}

function convert(value: number | undefined, factor: number): number | undefined {
  return value === undefined ? undefined : Math.round(value * factor);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DATA,

      addVehicle: (input) => {
        const { lastOilChange, ...rest } = input;
        const vehicle: Vehicle = { ...rest, id: newId() };
        const plans = defaultPlans(vehicle, get().settings.distanceUnit).map((p) =>
          lastOilChange && p.categoryId === 'aceite'
            ? { ...p, baselineDate: lastOilChange.date, baselineKm: lastOilChange.km }
            : p,
        );
        set((s) => ({ vehicles: [...s.vehicles, vehicle], plans: [...s.plans, ...plans] }));
        return vehicle.id;
      },

      updateVehicle: (id, patch) => {
        const prev = get().vehicles.find((v) => v.id === id);
        if (!prev) return;
        const next = { ...prev, ...patch };
        const unit = get().settings.distanceUnit;
        set((s) => {
          let plans = s.plans;
          // Si cambió el tipo de aceite y el intervalo era el recomendado, se actualiza al nuevo recomendado.
          if (prev.oilType !== next.oilType) {
            const oldRec = recommendedIntervalFor('aceite', prev, unit);
            const newRec = recommendedIntervalFor('aceite', next, unit);
            plans = plans.map((p) =>
              p.vehicleId === id &&
              p.categoryId === 'aceite' &&
              p.intervalKm === oldRec?.km &&
              p.intervalMonths === oldRec?.months
                ? { ...p, intervalKm: newRec?.km, intervalMonths: newRec?.months }
                : p,
            );
          }
          return { vehicles: s.vehicles.map((v) => (v.id === id ? next : v)), plans };
        });
      },

      removeVehicle: (id) => {
        const photos = get()
          .services.filter((s) => s.vehicleId === id)
          .flatMap((s) => s.photos);
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          services: s.services.filter((x) => x.vehicleId !== id),
          odometer: s.odometer.filter((o) => o.vehicleId !== id),
          plans: s.plans.filter((p) => p.vehicleId !== id),
          documents: s.documents.filter((d) => d.vehicleId !== id),
        }));
        return photos;
      },

      addService: (input) => {
        const id = newId();
        set((s) => ({ services: [...s.services, { ...input, id, createdAt: nowStamp() }] }));
        return id;
      },

      updateService: (id, patch) => {
        set((s) => ({ services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      },

      removeService: (id) => {
        const photos = get().services.find((s) => s.id === id)?.photos ?? [];
        set((s) => ({ services: s.services.filter((x) => x.id !== id) }));
        return photos;
      },

      addOdometer: (input) => {
        const id = newId();
        set((s) => ({ odometer: [...s.odometer, { ...input, id }] }));
        return id;
      },

      removeOdometer: (id) => set((s) => ({ odometer: s.odometer.filter((o) => o.id !== id) })),

      addWorkshop: (input) => {
        const id = newId();
        set((s) => ({ workshops: [...s.workshops, { ...input, id, createdAt: nowStamp() }] }));
        return id;
      },

      updateWorkshop: (id, patch) => {
        set((s) => {
          const workshops = s.workshops.map((w) => (w.id === id ? { ...w, ...patch } : w));
          const name = patch.name;
          const services =
            name !== undefined ? s.services.map((x) => (x.workshopId === id ? { ...x, workshopName: name } : x)) : s.services;
          return { workshops, services };
        });
      },

      removeWorkshop: (id) => set((s) => ({ workshops: s.workshops.filter((w) => w.id !== id) })),

      addPlan: (vehicleId, categoryId) => {
        const existing = get().plans.find((p) => p.vehicleId === vehicleId && p.categoryId === categoryId);
        if (existing) {
          set((s) => ({ plans: s.plans.map((p) => (p.id === existing.id ? { ...p, enabled: true } : p)) }));
          return existing.id;
        }
        const vehicle = get().vehicles.find((v) => v.id === vehicleId);
        const interval = vehicle ? recommendedIntervalFor(categoryId, vehicle, get().settings.distanceUnit) : undefined;
        const plan: MaintenancePlan = {
          id: newId(),
          vehicleId,
          categoryId,
          intervalKm: interval?.km,
          intervalMonths: interval?.months ?? (interval?.km ? undefined : 12),
          enabled: true,
          notify: true,
        };
        set((s) => ({ plans: [...s.plans, plan] }));
        return plan.id;
      },

      updatePlan: (id, patch) => set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      removePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      addDocument: (input) => {
        const id = newId();
        set((s) => ({ documents: [...s.documents, { ...input, id }] }));
        return id;
      },

      updateDocument: (id, patch) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setDistanceUnit: (unit) => {
        const current = get().settings.distanceUnit;
        if (current === unit) return;
        const factor = unit === 'mi' ? 1 / KM_PER_MILE : KM_PER_MILE;
        set((s) => ({
          settings: { ...s.settings, distanceUnit: unit },
          vehicles: s.vehicles.map((v) => ({
            ...v,
            initialKm: convert(v.initialKm, factor) ?? 0,
            monthlyKm: convert(v.monthlyKm, factor) ?? 0,
          })),
          odometer: s.odometer.map((o) => ({ ...o, km: convert(o.km, factor) ?? 0 })),
          services: s.services.map((x) => ({
            ...x,
            km: convert(x.km, factor),
            warrantyKm: convert(x.warrantyKm, factor),
            items: x.items.map((i) => ({ ...i, nextKm: convert(i.nextKm, factor) })),
          })),
          plans: s.plans.map((p) => ({
            ...p,
            intervalKm: convert(p.intervalKm, factor),
            baselineKm: convert(p.baselineKm, factor),
          })),
        }));
      },

      completeOnboarding: () => set({ onboarded: true }),

      loadDemo: () => {
        const demo = buildDemoData();
        const notDemo = <T extends { id: string }>(list: T[]) => list.filter((x) => !x.id.startsWith('demo-'));
        set((s) => ({
          vehicles: [...notDemo(s.vehicles), ...demo.vehicles],
          services: [...notDemo(s.services), ...demo.services],
          odometer: [...notDemo(s.odometer), ...demo.odometer],
          workshops: [...notDemo(s.workshops), ...demo.workshops],
          plans: [...s.plans.filter((p) => !p.vehicleId.startsWith('demo-')), ...demo.plans],
          documents: [...notDemo(s.documents), ...demo.documents],
          // Los datos de ejemplo están en km: solo se cambia la unidad si no hay datos propios.
          settings: notDemo(s.vehicles).length === 0 ? { ...s.settings, distanceUnit: 'km' } : s.settings,
          onboarded: true,
        }));
      },

      importData: (data) => set({ ...data, onboarded: true }),

      resetAll: () => set({ ...INITIAL_DATA }),
    }),
    {
      name: 'migaraje-datos',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): AppData => ({
        vehicles: s.vehicles,
        services: s.services,
        odometer: s.odometer,
        workshops: s.workshops,
        plans: s.plans,
        documents: s.documents,
        settings: s.settings,
        onboarded: s.onboarded,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } };
      },
    },
  ),
);

export function selectData(s: AppState): AppData {
  return {
    vehicles: s.vehicles,
    services: s.services,
    odometer: s.odometer,
    workshops: s.workshops,
    plans: s.plans,
    documents: s.documents,
    settings: s.settings,
    onboarded: s.onboarded,
  };
}
