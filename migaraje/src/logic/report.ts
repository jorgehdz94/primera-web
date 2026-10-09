import { DOCUMENT_KINDS } from '@/data/documents';
import { FUEL_LABELS, getCategory, OIL_TYPE_LABELS } from '@/data/categories';
import type { Settings, Workshop } from '@/types';

import { formatDate, formatDateLong, todayISO } from './dates';
import { formatDistance, formatMoney, vehicleTitle } from './format';
import { STATUS_LABELS, statusHeadline } from './maintenance';
import type { VehicleOverview } from './overview';
import { serviceTotal, spendingStats } from './stats';

function esc(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS_COLORS: Record<string, string> = {
  vencido: '#DC2626',
  pronto: '#B45309',
  ok: '#15803D',
  sin_datos: '#6B7280',
  desactivado: '#6B7280',
};

/** HTML del historial de mantenimiento, listo para imprimir o convertir a PDF. */
export function buildReportHtml(
  overview: VehicleOverview,
  workshops: Workshop[],
  settings: Settings,
  today = todayISO(),
): string {
  const { vehicle, odo, statuses, services, documents } = overview;
  const unit = settings.distanceUnit;
  const money = (n: number | undefined) => formatMoney(n, settings.currency);
  const stats = spendingStats(services);
  const workshopName = (id?: string, fallback?: string) => workshops.find((w) => w.id === id)?.name ?? fallback ?? '';

  const infoRows: [string, string | undefined][] = [
    ['Vehículo', vehicleTitle(vehicle)],
    ['Tipo', vehicle.type === 'carro' ? 'Carro' : 'Moto'],
    ['Placas', vehicle.plate],
    ['VIN / número de serie', vehicle.vin],
    ['Combustible', FUEL_LABELS[vehicle.fuel]],
    ['Aceite', `${OIL_TYPE_LABELS[vehicle.oilType]}${vehicle.oilViscosity ? ` ${vehicle.oilViscosity}` : ''}`],
    ['Último kilometraje registrado', `${formatDistance(odo.knownKm, unit)} (${formatDate(odo.knownDate)})`],
  ];

  const serviceRows = services
    .map((s) => {
      const items = s.items
        .map((i) => `<li>${esc(getCategory(i.categoryId).name)}${i.detail ? ` — <span class="muted">${esc(i.detail)}</span>` : ''}</li>`)
        .join('');
      const who = [workshopName(s.workshopId, s.workshopName), s.mechanic].filter(Boolean).map(esc).join('<br/>');
      const extra = [s.reason ? `<div class="muted"><b>Motivo:</b> ${esc(s.reason)}</div>` : '', s.diagnosis ? `<div class="muted"><b>Diagnóstico:</b> ${esc(s.diagnosis)}</div>` : '']
        .filter(Boolean)
        .join('');
      return `<tr>
        <td class="nowrap">${esc(formatDate(s.date))}</td>
        <td class="nowrap">${s.km !== undefined ? esc(formatDistance(s.km, unit)) : '—'}</td>
        <td><ul>${items}</ul>${extra}</td>
        <td>${who || '—'}</td>
        <td class="nowrap right">${esc(money(serviceTotal(s)))}</td>
      </tr>`;
    })
    .join('');

  const statusRows = statuses
    .filter((s) => s.status !== 'desactivado')
    .map(
      (s) => `<tr>
        <td>${esc(s.label)}</td>
        <td>${s.last ? esc(`${formatDate(s.last.date)}${s.last.km !== undefined ? ` · ${formatDistance(s.last.km, unit)}` : ''}`) : '—'}</td>
        <td><span class="pill" style="background:${STATUS_COLORS[s.status]}">${esc(STATUS_LABELS[s.status])}</span> ${esc(statusHeadline(s, unit, today))}</td>
      </tr>`,
    )
    .join('');

  const docRows = documents
    .map(
      (d) =>
        `<tr><td>${esc(DOCUMENT_KINDS[d.kind].label)}</td><td>${esc(d.title)}</td><td>${esc(formatDate(d.expiresAt))}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Historial de ${esc(vehicle.nickname || vehicleTitle(vehicle))}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #151821; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0; }
  h2 { font-size: 15px; margin: 28px 0 8px; border-bottom: 2px solid #EE6A1F; padding-bottom: 4px; }
  .brand { color: #EE6A1F; font-weight: 700; letter-spacing: .5px; font-size: 11px; text-transform: uppercase; }
  .muted { color: #5D6472; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #E1E4EA; }
  th { background: #F4F5F7; font-size: 11px; text-transform: uppercase; color: #5D6472; }
  ul { margin: 0; padding-left: 16px; }
  .nowrap { white-space: nowrap; }
  .right { text-align: right; }
  .summary { display: flex; gap: 12px; margin-top: 12px; }
  .box { flex: 1; background: #F4F5F7; border-radius: 10px; padding: 10px 12px; }
  .box b { display: block; font-size: 16px; }
  .pill { color: white; border-radius: 999px; padding: 1px 8px; font-size: 10px; font-weight: 600; }
  .info td:first-child { width: 40%; color: #5D6472; }
  footer { margin-top: 32px; font-size: 10px; color: #5D6472; text-align: center; }
  tr { page-break-inside: avoid; }
</style></head>
<body>
  <div class="brand">MiGaraje · Historial de mantenimiento</div>
  <h1>${esc(vehicle.nickname || vehicleTitle(vehicle))}</h1>
  <div class="muted">${esc(vehicleTitle(vehicle))} · Generado el ${esc(formatDateLong(today))}</div>

  <div class="summary">
    <div class="box"><span class="muted">Servicios registrados</span><b>${stats.count}</b></div>
    <div class="box"><span class="muted">Invertido en mantenimiento</span><b>${esc(money(stats.total))}</b></div>
    <div class="box"><span class="muted">Historial desde</span><b>${esc(formatDate(stats.firstDate))}</b></div>
  </div>

  <h2>Datos del vehículo</h2>
  <table class="info">${infoRows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')}</table>

  ${statusRows ? `<h2>Estado del mantenimiento</h2><table><tr><th>Mantenimiento</th><th>Última vez</th><th>Estado</th></tr>${statusRows}</table>` : ''}

  <h2>Servicios realizados</h2>
  ${
    serviceRows
      ? `<table><tr><th>Fecha</th><th>Km</th><th>Trabajos</th><th>Taller / responsable</th><th class="right">Costo</th></tr>${serviceRows}</table>`
      : '<p class="muted">Aún no hay servicios registrados.</p>'
  }

  ${docRows ? `<h2>Documentos</h2><table><tr><th>Tipo</th><th>Descripción</th><th>Vence</th></tr>${docRows}</table>` : ''}

  <footer>Documento generado con la app MiGaraje a partir de los registros capturados por su propietario.</footer>
</body></html>`;
}
