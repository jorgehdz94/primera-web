import { addDays, todayISO } from '@/logic/dates';
import { defaultPlans } from '@/logic/maintenance';
import type { AppData, ISODate, ServiceRecord, Vehicle } from '@/types';

type DemoData = Omit<AppData, 'settings' | 'onboarded'>;

/** Datos de ejemplo para conocer la app sin capturar nada. Las fechas son relativas a hoy. */
export function buildDemoData(today: ISODate = todayISO()): DemoData {
  const d = (days: number) => addDays(today, -days);
  const stamp = (days: number) => `${d(days)}T12:00:00.000Z`;

  const car: Vehicle = {
    id: 'demo-carro',
    type: 'carro',
    nickname: 'El Rayo',
    brand: 'Mazda',
    model: '3 Sedán',
    year: 2019,
    plate: 'ABC-123-D',
    color: '#DC2626',
    fuel: 'gasolina',
    oilType: 'sintetico',
    oilViscosity: '0W-20',
    monthlyKm: 1200,
    initialKm: 20000,
    createdAt: d(720),
  };
  const moto: Vehicle = {
    id: 'demo-moto',
    type: 'moto',
    nickname: 'La Negra',
    brand: 'Honda',
    model: 'CB190R',
    year: 2021,
    plate: 'M12-ABC',
    color: '#2463EB',
    fuel: 'gasolina',
    oilType: 'semisintetico',
    oilViscosity: '10W-30',
    monthlyKm: 600,
    initialKm: 8000,
    createdAt: d(400),
  };

  const workshops: AppData['workshops'] = [
    {
      id: 'demo-taller-1',
      name: 'Taller Mecánico Hernández',
      phone: '5512345678',
      address: 'Av. Siempre Viva 742',
      mechanics: ['Don Beto', 'Luis'],
      notes: 'Muy honestos. Te enseñan las piezas viejas.',
      createdAt: stamp(720),
    },
    {
      id: 'demo-taller-2',
      name: 'Llantera El Güero',
      phone: '5587654321',
      mechanics: ['Memo'],
      createdAt: stamp(520),
    },
    {
      id: 'demo-taller-3',
      name: 'Moto Servicio Rápido',
      mechanics: ['Kevin'],
      createdAt: stamp(380),
    },
  ];

  const svc = (s: Omit<ServiceRecord, 'photos' | 'createdAt'> & { daysAgo: number }): ServiceRecord => {
    const { daysAgo, ...rest } = s;
    return { ...rest, photos: [], createdAt: stamp(daysAgo) };
  };

  const services: ServiceRecord[] = [
    svc({
      id: 'demo-s1',
      vehicleId: car.id,
      daysAgo: 700,
      date: d(700),
      km: 20500,
      workshopId: 'demo-taller-1',
      workshopName: 'Taller Mecánico Hernández',
      mechanic: 'Don Beto',
      reason: 'Mantenimiento preventivo',
      items: [
        { id: 'i1', categoryId: 'aceite', detail: 'Sintético 0W-20, 4.2 L', cost: 1150 },
        { id: 'i2', categoryId: 'filtro_aceite', cost: 180 },
        { id: 'i3', categoryId: 'filtro_aire', cost: 320 },
      ],
      laborCost: 250,
      rating: 5,
    }),
    svc({
      id: 'demo-s2',
      vehicleId: car.id,
      daysAgo: 520,
      date: d(520),
      km: 27400,
      workshopId: 'demo-taller-2',
      workshopName: 'Llantera El Güero',
      mechanic: 'Memo',
      reason: 'El volante vibraba en carretera',
      diagnosis: 'Dos llantas desbalanceadas. Se rotaron, alinearon y balancearon.',
      items: [
        { id: 'i4', categoryId: 'rotacion', cost: 150 },
        { id: 'i5', categoryId: 'alineacion', cost: 450 },
      ],
      rating: 4,
    }),
    svc({
      id: 'demo-s3',
      vehicleId: car.id,
      daysAgo: 420,
      date: d(420),
      km: 31200,
      workshopId: 'demo-taller-1',
      workshopName: 'Taller Mecánico Hernández',
      mechanic: 'Luis',
      reason: 'Mantenimiento preventivo',
      items: [
        { id: 'i6', categoryId: 'aceite', detail: 'Sintético 0W-20', cost: 1180, nextKm: 41200 },
        { id: 'i7', categoryId: 'filtro_aceite', cost: 190 },
      ],
      laborCost: 250,
      rating: 5,
    }),
    svc({
      id: 'demo-s4',
      vehicleId: car.id,
      daysAgo: 300,
      date: d(300),
      km: 35800,
      workshopId: 'demo-taller-1',
      workshopName: 'Taller Mecánico Hernández',
      mechanic: 'Don Beto',
      reason: 'Chillaban los frenos al detenerme',
      diagnosis:
        'Las pastillas delanteras tenían 2 mm de material. Los discos tenían surcos pero estaban arriba del grosor mínimo, así que se rectificaron.',
      items: [
        { id: 'i8', categoryId: 'frenos', detail: 'Pastillas delanteras cerámicas', cost: 1450 },
        { id: 'i9', categoryId: 'discos', detail: 'Rectificado de discos delanteros', cost: 600 },
      ],
      laborCost: 400,
      warrantyUntil: addDays(d(300), 182),
      warrantyKm: 10000,
      rating: 5,
      notes: 'Me enseñaron las pastillas viejas.',
    }),
    svc({
      id: 'demo-s5',
      vehicleId: car.id,
      daysAgo: 200,
      date: d(200),
      km: 39500,
      workshopId: 'demo-taller-1',
      workshopName: 'Taller Mecánico Hernández',
      mechanic: 'Luis',
      reason: 'Mantenimiento preventivo',
      items: [
        { id: 'i10', categoryId: 'aceite', detail: 'Sintético 0W-20', cost: 1250, nextKm: 49500 },
        { id: 'i11', categoryId: 'filtro_aceite', cost: 190 },
        { id: 'i12', categoryId: 'filtro_cabina', detail: 'Con carbón activado', cost: 290 },
        { id: 'i12b', categoryId: 'filtro_aire', cost: 340 },
      ],
      laborCost: 250,
      rating: 4,
    }),
    svc({
      id: 'demo-s5b',
      vehicleId: car.id,
      daysAgo: 130,
      date: d(130),
      km: 43000,
      workshopId: 'demo-taller-2',
      workshopName: 'Llantera El Güero',
      mechanic: 'Memo',
      reason: 'Mantenimiento preventivo',
      items: [
        { id: 'i20', categoryId: 'rotacion', cost: 150 },
        { id: 'i21', categoryId: 'alineacion', cost: 480 },
      ],
      rating: 5,
    }),
    svc({
      id: 'demo-s6',
      vehicleId: car.id,
      daysAgo: 60,
      date: d(60),
      km: 45100,
      workshopId: 'demo-taller-1',
      workshopName: 'Taller Mecánico Hernández',
      mechanic: 'Don Beto',
      reason: 'No arrancaba en las mañanas',
      diagnosis: 'La batería marcaba 11.9 V y no sostenía carga. El alternador carga bien (14.2 V).',
      items: [
        { id: 'i13', categoryId: 'bateria', detail: 'Batería 47-500 (500 CCA)', cost: 2300 },
        { id: 'i13b', categoryId: 'frenos', detail: 'Revisión: pastillas delanteras al 70%', cost: 0 },
      ],
      warrantyUntil: addDays(d(60), 365),
      rating: 5,
    }),
    svc({
      id: 'demo-s7',
      vehicleId: moto.id,
      daysAgo: 380,
      date: d(380),
      km: 8400,
      workshopId: 'demo-taller-3',
      workshopName: 'Moto Servicio Rápido',
      mechanic: 'Kevin',
      reason: 'Mantenimiento preventivo',
      items: [
        { id: 'i14', categoryId: 'aceite', detail: 'Semisintético 10W-30 JASO MA2', cost: 350 },
        { id: 'i15', categoryId: 'cadena_moto', cost: 80 },
      ],
      rating: 4,
    }),
    svc({
      id: 'demo-s8',
      vehicleId: moto.id,
      daysAgo: 170,
      date: d(170),
      km: 12300,
      workshopId: 'demo-taller-3',
      workshopName: 'Moto Servicio Rápido',
      mechanic: 'Kevin',
      reason: 'La cadena hacía ruido',
      diagnosis: 'Corona con dientes gastados en forma de ola. Se cambió el kit completo.',
      items: [
        { id: 'i16', categoryId: 'aceite', detail: 'Semisintético 10W-30', cost: 380 },
        { id: 'i17', categoryId: 'kit_arrastre', detail: 'Kit reforzado 428', cost: 1250 },
        { id: 'i18', categoryId: 'cadena_moto', cost: 0 },
        { id: 'i19', categoryId: 'filtro_aire', cost: 180 },
      ],
      laborCost: 300,
      rating: 5,
    }),
    svc({
      id: 'demo-s9',
      vehicleId: moto.id,
      daysAgo: 20,
      date: d(20),
      km: 15300,
      mechanic: 'Yo mismo',
      reason: 'Mantenimiento preventivo',
      items: [{ id: 'i22', categoryId: 'cadena_moto', detail: 'Limpieza y lubricante en spray', cost: 0 }],
      notes: 'Holgura de la cadena: 2.5 cm.',
    }),
  ];

  const odometer: AppData['odometer'] = [
    { id: 'demo-o1', vehicleId: car.id, date: d(12), km: 47900 },
    { id: 'demo-o2', vehicleId: moto.id, date: d(30), km: 15100 },
  ];

  const plans = [...defaultPlans(car, 'km'), ...defaultPlans(moto, 'km')].map((p) => {
    if (p.vehicleId === car.id && p.categoryId === 'distribucion') return { ...p, baselineDate: d(720), baselineKm: 20000 };
    if (p.vehicleId === car.id && p.categoryId === 'limpiaparabrisas') return { ...p, baselineDate: d(400) };
    return p;
  });

  const documents: AppData['documents'] = [
    { id: 'demo-d1', vehicleId: car.id, kind: 'seguro', title: 'Seguro amplio', expiresAt: addDays(today, 20) },
    { id: 'demo-d2', vehicleId: car.id, kind: 'verificacion', title: 'Verificación', expiresAt: addDays(today, 95) },
    { id: 'demo-d3', vehicleId: moto.id, kind: 'seguro', title: 'Seguro de la moto', expiresAt: addDays(today, -5) },
  ];

  return { vehicles: [car, moto], services, odometer, workshops, plans, documents };
}
