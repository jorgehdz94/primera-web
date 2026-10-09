import type { ServiceFormValues } from '@/components/forms/ServiceForm';
import type { ServiceRecord } from '@/types';

import { useStore } from './index';

/** Busca o crea el taller y agrega al mecánico a su lista si es nuevo. */
function resolveWorkshop(workshop: ServiceFormValues['workshop'], mechanic?: string): Pick<ServiceRecord, 'workshopId' | 'workshopName'> {
  if (!workshop) return {};
  const state = useStore.getState();
  const target = workshop.id
    ? state.workshops.find((w) => w.id === workshop.id)
    : state.workshops.find((w) => w.name.trim().toLowerCase() === workshop.name.trim().toLowerCase());
  if (!target) {
    const id = state.addWorkshop({ name: workshop.name, mechanics: mechanic ? [mechanic] : [] });
    return { workshopId: id, workshopName: workshop.name };
  }
  if (mechanic && !target.mechanics.some((m) => m.toLowerCase() === mechanic.toLowerCase())) {
    state.updateWorkshop(target.id, { mechanics: [...target.mechanics, mechanic] });
  }
  return { workshopId: target.id, workshopName: target.name };
}

/** Guarda un servicio nuevo o actualiza uno existente. Devuelve su id. */
export function saveService(values: ServiceFormValues, existingId?: string): string {
  const { workshop, ...rest } = values;
  const record = { ...rest, ...resolveWorkshop(workshop, values.mechanic) };
  const state = useStore.getState();
  if (existingId) {
    state.updateService(existingId, { ...record, workshopId: record.workshopId, workshopName: record.workshopName });
    return existingId;
  }
  return state.addService(record);
}
