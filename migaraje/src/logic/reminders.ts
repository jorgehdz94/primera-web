import type { AppData, ISODate } from '@/types';

import { DOCUMENT_KINDS } from '@/data/documents';

import { addDays, compareISO, diffDays, formatDate, todayISO } from './dates';
import { formatDistance } from './format';
import { allOverviews } from './overview';

export interface PlannedReminder {
  id: string;
  date: ISODate;
  title: string;
  body: string;
  /** Ruta de la app que se abre al tocar la notificación. */
  url: string;
}

/** iOS permite máximo 64 notificaciones programadas por app. */
export const MAX_REMINDERS = 56;

const EMOJI: Record<string, string> = {
  aceite: '🛢️',
  frenos: '🛑',
  liquido_frenos: '🛑',
  llantas: '🛞',
  rotacion: '🛞',
  alineacion: '🛞',
  bateria: '🔋',
  cadena_moto: '⛓️',
  kit_arrastre: '⛓️',
  refrigerante: '🌡️',
};

/** Calcula qué recordatorios hay que programar a partir de los datos actuales. */
export function planReminders(data: AppData, today: ISODate = todayISO()): PlannedReminder[] {
  const unit = data.settings.distanceUnit;
  const out: PlannedReminder[] = [];

  for (const ov of allOverviews(data, today)) {
    const name = ov.vehicle.nickname || ov.vehicle.model;
    for (const s of ov.statuses) {
      if (!s.plan.enabled || !s.plan.notify || !s.predictedDate) continue;
      if (s.status === 'sin_datos' || s.status === 'desactivado') continue;
      const emoji = EMOJI[s.category.id] ?? '🔧';
      const url = `/vehiculo/${ov.vehicle.id}`;
      const due = s.predictedDate;
      const whenText =
        s.binding === 'km' && s.dueKm !== undefined
          ? `llegará a ~${formatDistance(s.dueKm, unit)} alrededor del ${formatDate(due)}`
          : `le toca el ${formatDate(due)}`;

      const weekBefore = addDays(due, -7);
      if (compareISO(weekBefore, today) > 0) {
        out.push({
          id: `${s.plan.id}-pronto`,
          date: weekBefore,
          title: `${emoji} ${s.label} en una semana`,
          body: `Tu ${name} ${whenText}. Buen momento para agendar con tu taller.`,
          url,
        });
      }
      if (compareISO(due, today) > 0) {
        out.push({
          id: `${s.plan.id}-hoy`,
          date: due,
          title: `${emoji} Ya toca: ${s.label}`,
          body: `Tu ${name} está en el punto recomendado. Cuando lo hagas, regístralo en MiGaraje para reiniciar el recordatorio.`,
          url,
        });
      } else {
        out.push({
          id: `${s.plan.id}-pendiente`,
          date: addDays(today, 2),
          title: `⚠️ Pendiente: ${s.label}`,
          body: `Tu ${name} ya pasó la fecha o el kilometraje recomendado. ¿Ya lo hiciste? Regístralo para tener tu historial al día.`,
          url,
        });
      }
    }

    for (const doc of ov.documents) {
      const kind = DOCUMENT_KINDS[doc.kind];
      const url = `/vehiculo/${ov.vehicle.id}`;
      const daysLeft = diffDays(today, doc.expiresAt);
      const label = doc.title || kind.label;
      for (const before of [30, 7, 0]) {
        const date = addDays(doc.expiresAt, -before);
        if (compareISO(date, today) <= 0) continue;
        out.push({
          id: `${doc.id}-${before}`,
          date,
          title: before === 0 ? `${kind.emoji} Hoy vence: ${label}` : `${kind.emoji} ${label} vence en ${before} días`,
          body: `${label} de tu ${name} vence el ${formatDate(doc.expiresAt)}. Renuévalo a tiempo para evitar multas.`,
          url,
        });
      }
      if (daysLeft < 0 && daysLeft > -60) {
        out.push({
          id: `${doc.id}-vencido`,
          date: addDays(today, 2),
          title: `${kind.emoji} ${label} vencido`,
          body: `${label} de tu ${name} venció el ${formatDate(doc.expiresAt)}. Cuando lo renueves, actualiza la fecha en MiGaraje.`,
          url,
        });
      }
    }
  }

  return out.sort((a, b) => compareISO(a.date, b.date)).slice(0, MAX_REMINDERS);
}
