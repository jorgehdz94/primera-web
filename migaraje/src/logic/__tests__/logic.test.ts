import { buildDemoData } from '@/data/demo';
import { analyzeItem } from '@/logic/analysis';
import { createBackup, DEFAULT_SETTINGS, parseBackup } from '@/logic/backup';
import { addDays, addMonths, diffDays, formatDate, relativeDays } from '@/logic/dates';
import { formatMoney, formatNumber, parseAmount, parseInteger } from '@/logic/format';
import { computePlanStatus, defaultPlans, healthScore, statusHeadline } from '@/logic/maintenance';
import { averageKmPerDay, vehicleOdometer, vehicleReadings } from '@/logic/odometer';
import { allOverviews } from '@/logic/overview';
import { planReminders } from '@/logic/reminders';
import { buildReportHtml } from '@/logic/report';
import { costPerKm, serviceTotal, spendingStats } from '@/logic/stats';
import type { AppData, MaintenancePlan, ServiceRecord, Vehicle } from '@/types';

const TODAY = '2026-10-09';

function vehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    type: 'carro',
    nickname: 'Prueba',
    brand: 'Marca',
    model: 'Modelo',
    color: '#000',
    fuel: 'gasolina',
    oilType: 'sintetico',
    monthlyKm: 1000,
    initialKm: 10000,
    createdAt: '2025-10-09',
    ...overrides,
  };
}

function service(overrides: Partial<ServiceRecord> & Pick<ServiceRecord, 'id' | 'date'>): ServiceRecord {
  return {
    vehicleId: 'v1',
    items: [{ id: `${overrides.id}-i`, categoryId: 'aceite' }],
    photos: [],
    createdAt: `${overrides.date}T00:00:00Z`,
    ...overrides,
  };
}

function oilPlan(overrides: Partial<MaintenancePlan> = {}): MaintenancePlan {
  return {
    id: 'p1',
    vehicleId: 'v1',
    categoryId: 'aceite',
    intervalKm: 10000,
    intervalMonths: 12,
    enabled: true,
    notify: true,
    ...overrides,
  };
}

describe('fechas', () => {
  it('suma meses respetando el fin de mes', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
    expect(addMonths('2026-03-10', -3)).toBe('2025-12-10');
  });

  it('calcula diferencias de días sin problemas de horario de verano', () => {
    expect(diffDays('2026-03-01', '2026-04-01')).toBe(31);
    expect(diffDays('2026-10-09', '2026-10-02')).toBe(-7);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('formatea en español', () => {
    expect(formatDate('2026-10-09')).toBe('9 oct 2026');
    expect(relativeDays(0)).toBe('hoy');
    expect(relativeDays(1)).toBe('mañana');
    expect(relativeDays(5)).toBe('en 5 días');
    expect(relativeDays(-90)).toBe('hace 3 meses');
  });
});

describe('formato de números', () => {
  it('agrupa miles', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(-1500)).toBe('-1,500');
    expect(formatMoney(1500.5, '$')).toBe('$1,500.50');
    expect(formatMoney(1200, 'Q')).toBe('Q1,200');
  });

  it('entiende importes escritos de distintas formas', () => {
    expect(parseAmount('1,500')).toBe(1500);
    expect(parseAmount('1.500')).toBe(1500);
    expect(parseAmount('1500.50')).toBe(1500.5);
    expect(parseAmount('1.500,50')).toBe(1500.5);
    expect(parseAmount('$ 2,300.75')).toBe(2300.75);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('')).toBeUndefined();
    expect(parseAmount('abc')).toBeUndefined();
  });

  it('lee kilometrajes', () => {
    expect(parseInteger('45,000 km')).toBe(45000);
    expect(parseInteger('45.000')).toBe(45000);
    expect(parseInteger('')).toBeUndefined();
  });
});

describe('kilometraje', () => {
  it('usa los km/mes indicados cuando no hay historial suficiente', () => {
    const v = vehicle({ createdAt: '2026-10-01' });
    const { rate, source } = averageKmPerDay(vehicleReadings(v, [], []), 1000);
    expect(source).toBe('estimado');
    expect(rate).toBeCloseTo(1000 / 30.44, 5);
  });

  it('calcula el promedio real con el historial y estima el km de hoy', () => {
    const v = vehicle({ createdAt: '2026-01-01', initialKm: 10000 });
    const odo = vehicleOdometer(v, [], [{ id: 'o1', vehicleId: 'v1', date: '2026-04-11', km: 13000 }], TODAY);
    expect(odo.rateSource).toBe('historial');
    expect(odo.kmPerDay).toBeCloseTo(30, 5);
    expect(odo.knownKm).toBe(13000);
    expect(odo.estimatedKm).toBe(13000 + 30 * diffDays('2026-04-11', TODAY));
  });
});

describe('estado de mantenimiento', () => {
  const v = vehicle({ createdAt: '2026-01-01', initialKm: 10000, monthlyKm: 900 });

  function statusFor(services: ServiceRecord[], plan = oilPlan(), odometerKm = 18500) {
    const odometer = [{ id: 'o1', vehicleId: 'v1', date: TODAY, km: odometerKm }];
    const odo = vehicleOdometer(v, services, odometer, TODAY);
    return computePlanStatus(plan, services, odo, vehicleReadings(v, services, odometer), TODAY);
  }

  it('sin registros queda sin datos', () => {
    expect(statusFor([]).status).toBe('sin_datos');
  });

  it('marca "pronto" cuando falta poco kilometraje', () => {
    const s = statusFor([service({ id: 's1', date: '2026-05-01', km: 9000 })]);
    expect(s.dueKm).toBe(19000);
    expect(s.kmLeft).toBe(500);
    expect(s.status).toBe('pronto');
    expect(s.binding).toBe('km');
    expect(statusHeadline(s, 'km', TODAY)).toMatch(/^Faltan ~500 km/);
  });

  it('marca "vencido" cuando se pasó del kilometraje', () => {
    const s = statusFor([service({ id: 's1', date: '2026-05-01', km: 8000 })], oilPlan(), 18500);
    expect(s.status).toBe('vencido');
    expect(statusHeadline(s, 'km', TODAY)).toBe('Te pasaste por ~500 km');
  });

  it('marca "vencido" por fecha aunque falten km', () => {
    const s = statusFor([service({ id: 's1', date: '2025-09-01', km: 17000 })], oilPlan(), 18500);
    expect(s.status).toBe('vencido');
  });

  it('respeta el próximo km indicado por el taller', () => {
    const s = statusFor([
      service({ id: 's1', date: '2026-08-01', km: 16000, items: [{ id: 'x', categoryId: 'aceite', nextKm: 21000 }] }),
    ]);
    expect(s.dueKm).toBe(21000);
    expect(s.status).toBe('ok');
  });

  it('usa la referencia manual si es más reciente que el último registro', () => {
    const s = statusFor(
      [service({ id: 's1', date: '2025-01-01', km: 5000 })],
      oilPlan({ baselineDate: '2026-09-01', baselineKm: 18000 }),
    );
    expect(s.last?.fromBaseline).toBe(true);
    expect(s.dueKm).toBe(28000);
    expect(s.status).toBe('ok');
  });

  it('calcula un puntaje de salud', () => {
    const ok = statusFor([service({ id: 's1', date: '2026-08-01', km: 16000 })]);
    const late = statusFor([service({ id: 's1', date: '2026-05-01', km: 8000 })]);
    expect(healthScore([ok])).toBe(100);
    expect(healthScore([ok, late])).toBe(50);
    expect(healthScore([])).toBeNull();
  });

  it('crea planes por defecto según el tipo de vehículo y combustible', () => {
    const carPlans = defaultPlans(vehicle(), 'km').map((p) => p.categoryId);
    expect(carPlans).toContain('aceite');
    expect(carPlans).toContain('distribucion');
    expect(carPlans).not.toContain('cadena_moto');

    const motoPlans = defaultPlans(vehicle({ type: 'moto' }), 'km').map((p) => p.categoryId);
    expect(motoPlans).toContain('cadena_moto');
    expect(motoPlans).not.toContain('rotacion');

    const electric = defaultPlans(vehicle({ fuel: 'electrico' }), 'km').map((p) => p.categoryId);
    expect(electric).not.toContain('aceite');
    expect(electric).toContain('frenos');

    const mineralOil = defaultPlans(vehicle({ oilType: 'mineral' }), 'km').find((p) => p.categoryId === 'aceite');
    expect(mineralOil?.intervalKm).toBe(5000);
    const inMiles = defaultPlans(vehicle({ oilType: 'mineral' }), 'mi').find((p) => p.categoryId === 'aceite');
    expect(inMiles?.intervalKm).toBe(3000);
  });
});

describe('análisis de servicios', () => {
  const v = vehicle();
  const prev = service({ id: 'a', date: '2026-01-01', km: 10000, items: [{ id: 'a1', categoryId: 'aceite', cost: 1000 }] });

  it('detecta un cambio hecho demasiado pronto', () => {
    const early = service({ id: 'b', date: '2026-02-01', km: 12000, items: [{ id: 'b1', categoryId: 'aceite', cost: 1200 }] });
    const r = analyzeItem(early, early.items[0], [prev, early], v, oilPlan(), 'km', '$');
    expect(r.kind).toBe('temprano');
    expect(r.costNote).toContain('20% más');
  });

  it('reconoce cuando se hizo a tiempo o tarde', () => {
    const onTime = service({ id: 'c', date: '2026-09-01', km: 19500 });
    expect(analyzeItem(onTime, onTime.items[0], [prev, onTime], v, oilPlan(), 'km', '$').kind).toBe('a_tiempo');
    const late = service({ id: 'd', date: '2026-09-01', km: 24000 });
    expect(analyzeItem(late, late.items[0], [prev, late], v, oilPlan(), 'km', '$').kind).toBe('tarde');
  });

  it('indica el primer registro y los trabajos sin intervalo', () => {
    expect(analyzeItem(prev, prev.items[0], [prev], v, oilPlan(), 'km', '$').kind).toBe('primero');
    const clutch = service({ id: 'e', date: '2026-03-01', items: [{ id: 'e1', categoryId: 'embrague' }] });
    expect(analyzeItem(clutch, clutch.items[0], [clutch], v, undefined, 'km', '$').kind).toBe('sin_intervalo');
  });
});

describe('gastos', () => {
  it('suma trabajos y mano de obra, o usa el total indicado', () => {
    const a = service({ id: 'a', date: '2026-01-01', items: [{ id: '1', categoryId: 'aceite', cost: 1000 }], laborCost: 200 });
    const b = service({ id: 'b', date: '2026-02-01', totalCost: 500, items: [{ id: '2', categoryId: 'frenos' }] });
    expect(serviceTotal(a)).toBe(1200);
    expect(serviceTotal(b)).toBe(500);
    const stats = spendingStats([a, b], 2026);
    expect(stats.total).toBe(1700);
    expect(stats.thisYear).toBe(1700);
    expect(stats.byCategory[0].categoryId).toBe('aceite');
  });

  it('calcula el costo por km', () => {
    const a = service({ id: 'a', date: '2026-01-01', km: 10000, totalCost: 1000 });
    expect(costPerKm([a], 12000)).toBeCloseTo(0.5, 5);
    expect(costPerKm([a], 10100)).toBeUndefined();
  });
});

describe('datos de ejemplo, recordatorios y reportes', () => {
  const demo = buildDemoData(TODAY);
  const data: AppData = { ...demo, settings: DEFAULT_SETTINGS, onboarded: true };

  it('los datos de ejemplo generan estados variados', () => {
    const overviews = allOverviews(data, TODAY);
    expect(overviews).toHaveLength(2);
    const kinds = new Set(overviews.flatMap((o) => o.statuses.map((s) => s.status)));
    expect(kinds.has('pronto') || kinds.has('vencido')).toBe(true);
    expect(kinds.has('ok')).toBe(true);
  });

  it('programa recordatorios futuros ordenados y sin repetir', () => {
    const reminders = planReminders(data, TODAY);
    expect(reminders.length).toBeGreaterThan(0);
    const ids = reminders.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < reminders.length; i++) {
      expect(reminders[i].date >= reminders[i - 1].date).toBe(true);
    }
    expect(reminders.every((r) => r.date > TODAY)).toBe(true);
    expect(reminders.some((r) => r.id === 'demo-d1-7')).toBe(true);
  });

  it('el respaldo se puede exportar e importar', () => {
    const backup = JSON.stringify(createBackup(data));
    const restored = parseBackup(backup);
    expect(restored.vehicles).toHaveLength(2);
    expect(restored.services).toHaveLength(demo.services.length);
    expect(() => parseBackup('{"app":"otra"}')).toThrow('MiGaraje');
    expect(() => parseBackup('no json')).toThrow('JSON');
  });

  it('el reporte escapa el HTML', () => {
    const overview = allOverviews(data, TODAY)[0];
    const html = buildReportHtml(
      { ...overview, vehicle: { ...overview.vehicle, nickname: '<script>x</script>' } },
      data.workshops,
      data.settings,
      TODAY,
    );
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>x');
    expect(html).toContain('Taller Mecánico Hernández');
  });
});
