/** Fecha en formato 'YYYY-MM-DD' (sin hora, sin zona horaria). */
export type ISODate = string;

export type VehicleType = 'carro' | 'moto';
export type OilType = 'mineral' | 'semisintetico' | 'sintetico';
export type FuelType = 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'gas';

export interface Vehicle {
  id: string;
  type: VehicleType;
  nickname: string;
  brand: string;
  model: string;
  year?: number;
  plate?: string;
  vin?: string;
  /** Color de acento con el que se muestra en la app. */
  color: string;
  fuel: FuelType;
  oilType: OilType;
  /** Viscosidad del aceite, p. ej. "5W-30". */
  oilViscosity?: string;
  /** Kilómetros que recorre al mes (aprox.). Se usa mientras no haya suficientes lecturas. */
  monthlyKm: number;
  /** Kilometraje al momento de darlo de alta. */
  initialKm: number;
  createdAt: ISODate;
  notes?: string;
}

export interface OdometerReading {
  id: string;
  vehicleId: string;
  date: ISODate;
  km: number;
  note?: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  /** Marca, pieza, especificación… lo que te hayan dicho. */
  detail?: string;
  cost?: number;
  /** Lo que indicó el taller para la próxima vez (p. ej. la calcomanía del aceite). */
  nextKm?: number;
  nextDate?: ISODate;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: ISODate;
  km?: number;
  workshopId?: string;
  /** Nombre del taller al momento de guardar (por si después se borra el taller). */
  workshopName?: string;
  /** Persona responsable del trabajo. */
  mechanic?: string;
  items: ServiceItem[];
  laborCost?: number;
  /** Total pagado. Si no se indica se calcula con la suma de los trabajos + mano de obra. */
  totalCost?: number;
  /** Por qué se llevó al taller. */
  reason?: string;
  /** Lo que explicó el mecánico. */
  diagnosis?: string;
  notes?: string;
  photos: string[];
  warrantyUntil?: ISODate;
  warrantyKm?: number;
  /** Calificación del servicio, 1 a 5. */
  rating?: number;
  createdAt: string;
}

export interface Workshop {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  mechanics: string[];
  notes?: string;
  createdAt: string;
}

export interface MaintenancePlan {
  id: string;
  vehicleId: string;
  categoryId: string;
  intervalKm?: number;
  intervalMonths?: number;
  enabled: boolean;
  notify: boolean;
  /** Última vez que se hizo, si fue antes de usar la app. */
  baselineDate?: ISODate;
  baselineKm?: number;
}

export type DocumentKind = 'seguro' | 'verificacion' | 'tenencia' | 'licencia' | 'tarjeta' | 'otro';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  kind: DocumentKind;
  title: string;
  expiresAt: ISODate;
  notes?: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type DistanceUnit = 'km' | 'mi';
export type OdometerReminder = 'semanal' | 'mensual' | 'nunca';

export interface Settings {
  userName: string;
  distanceUnit: DistanceUnit;
  currency: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
  /** Hora del día (0-23) a la que llegan los recordatorios. */
  notifyHour: number;
  odometerReminder: OdometerReminder;
}

export interface AppData {
  vehicles: Vehicle[];
  services: ServiceRecord[];
  odometer: OdometerReading[];
  workshops: Workshop[];
  plans: MaintenancePlan[];
  documents: VehicleDocument[];
  settings: Settings;
  onboarded: boolean;
}
