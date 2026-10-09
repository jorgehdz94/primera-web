import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { todayISO } from '@/logic/dates';
import { allOverviews, vehicleOverview } from '@/logic/overview';
import { selectData, useStore } from '@/store';
import type { AppData } from '@/types';

export function useAppData(): AppData {
  return useStore(useShallow(selectData));
}

export function useSettings() {
  return useStore((s) => s.settings);
}

export function useVehicleOverview(vehicleId: string | undefined) {
  const data = useAppData();
  const today = todayISO();
  return useMemo(() => (vehicleId ? vehicleOverview(data, vehicleId, today) : undefined), [data, vehicleId, today]);
}

export function useAllOverviews() {
  const data = useAppData();
  const today = todayISO();
  return useMemo(() => allOverviews(data, today), [data, today]);
}
