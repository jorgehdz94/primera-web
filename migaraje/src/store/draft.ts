import { create } from 'zustand';

import type { ISODate } from '@/types';

/** Borrador de servicio que llena el escáner de facturas antes de abrir el formulario. */
export interface ServiceDraft {
  vehicleId: string;
  date?: ISODate;
  km?: number;
  workshopName?: string;
  mechanic?: string;
  items: { categoryId: string; detail?: string; cost?: number }[];
  laborCost?: number;
  totalCost?: number;
  diagnosis?: string;
  notes?: string;
  photos?: string[];
}

interface DraftState {
  serviceDraft: ServiceDraft | null;
  setServiceDraft: (draft: ServiceDraft | null) => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  serviceDraft: null,
  setServiceDraft: (serviceDraft) => set({ serviceDraft }),
}));
