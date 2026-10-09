import type { AppData, Workshop } from '@/types';

import { sortServicesDesc } from './overview';
import { serviceTotal } from './stats';

export function workshopSummary(workshop: Workshop, data: Pick<AppData, 'services'>) {
  const services = sortServicesDesc(data.services.filter((s) => s.workshopId === workshop.id));
  const ratings = services.map((s) => s.rating).filter((r): r is number => r !== undefined);
  return {
    services,
    count: services.length,
    total: services.reduce((sum, s) => sum + serviceTotal(s), 0),
    rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined,
    lastDate: services[0]?.date,
  };
}
