import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { z } from 'zod';

import { CATEGORIES, FUEL_LABELS, getCategory, OIL_TYPE_LABELS } from '@/data/categories';
import { formatDate } from '@/logic/dates';
import { formatDistance, formatMoney, vehicleTitle } from '@/logic/format';
import { serviceTotal } from '@/logic/stats';
import type { Settings, ServiceRecord, Vehicle } from '@/types';

import type { PickedPhoto } from './photos';

const MODEL = 'claude-opus-5-5';
const KEY_NAME = 'migaraje_anthropic_key';
const MAX_IMAGE_EDGE = 1568;

// ---------- Clave de la API (la guarda el usuario en su dispositivo) ----------

export async function getApiKey(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(KEY_NAME);
  return SecureStore.getItemAsync(KEY_NAME);
}

export async function saveApiKey(key: string): Promise<void> {
  const clean = key.trim();
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY_NAME, clean);
  else await SecureStore.setItemAsync(KEY_NAME, clean);
}

export async function deleteApiKey(): Promise<void> {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY_NAME);
  else await SecureStore.deleteItemAsync(KEY_NAME);
}

async function client(): Promise<Anthropic> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('Primero configura tu clave del asistente en Ajustes › Asistente con IA.');
  // La clave es del propio usuario y vive solo en su teléfono, por eso se permite llamar directo desde la app.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 120_000 });
}

/** Traduce los errores de la API a mensajes entendibles. */
export function friendlyAIError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'La clave del asistente no es válida. Revísala en Ajustes.';
  if (error instanceof Anthropic.PermissionDeniedError) return 'Tu clave no tiene permiso para usar este modelo.';
  if (error instanceof Anthropic.RateLimitError) return 'Se hicieron demasiadas consultas seguidas. Espera un minuto e inténtalo de nuevo.';
  if (error instanceof Anthropic.BadRequestError) return `La consulta no fue aceptada: ${error.message}`;
  if (error instanceof Anthropic.APIConnectionTimeoutError) return 'El asistente tardó demasiado en responder. Inténtalo de nuevo.';
  if (error instanceof Anthropic.APIConnectionError) return 'No hay conexión a internet o no se pudo contactar al asistente.';
  if (error instanceof Anthropic.APIError) return `El asistente tuvo un problema (${error.status ?? 'sin código'}). Inténtalo más tarde.`;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  if (message.stop_reason === 'refusal') {
    throw new Error('El asistente no pudo responder a esta consulta. Intenta formularla de otra manera.');
  }
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('El asistente no devolvió respuesta. Inténtalo de nuevo.');
  return text;
}

// ---------- Contexto del vehículo ----------

export function vehicleContext(vehicle: Vehicle, settings: Settings, estimatedKm?: number): string {
  return [
    `Vehículo: ${vehicle.type === 'carro' ? 'carro' : 'moto'} ${vehicleTitle(vehicle)}${vehicle.nickname ? ` ("${vehicle.nickname}")` : ''}.`,
    `Combustible: ${FUEL_LABELS[vehicle.fuel]}. Aceite: ${OIL_TYPE_LABELS[vehicle.oilType]}${vehicle.oilViscosity ? ` ${vehicle.oilViscosity}` : ''}.`,
    estimatedKm !== undefined ? `Kilometraje aproximado: ${formatDistance(estimatedKm, settings.distanceUnit)}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function historyContext(services: ServiceRecord[], settings: Settings, limit = 15): string {
  if (services.length === 0) return 'No hay servicios registrados todavía.';
  return services
    .slice(0, limit)
    .map((s) => {
      const items = s.items.map((i) => getCategory(i.categoryId).name + (i.detail ? ` (${i.detail})` : '')).join(', ');
      const km = s.km !== undefined ? `, ${formatDistance(s.km, settings.distanceUnit)}` : '';
      return `- ${formatDate(s.date)}${km}: ${items}. Costo ${formatMoney(serviceTotal(s), settings.currency)}.${s.reason ? ` Motivo: ${s.reason}.` : ''}`;
    })
    .join('\n');
}

const PERSONA =
  'Eres "Tu mecánico de confianza", el asistente de la app MiGaraje. Hablas español latinoamericano neutral, con calidez y sin tecnicismos innecesarios (si usas uno, explícalo). Ayudas a dueños de carros y motos a entender lo que les hicieron en el taller y por qué, a detectar trabajos que quizá no eran necesarios y a cuidar su vehículo. Sé honesto: si algo depende de revisar físicamente el vehículo, dilo. Nunca inventes datos del vehículo que no te dieron. En temas de seguridad (frenos, dirección, llantas, temperatura del motor) recomienda no arriesgarse.';

// ---------- Escanear factura ----------

const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

const InvoiceSchema = z.object({
  legible: z.boolean().describe('false si la foto no es una factura/nota de taller o no se puede leer'),
  fecha: z.string().nullable().describe('Fecha del servicio en formato YYYY-MM-DD, o null si no aparece'),
  kilometraje: z.number().nullable().describe('Kilometraje del vehículo anotado en la nota, o null'),
  taller: z.string().nullable(),
  mecanico: z.string().nullable().describe('Nombre de quien hizo o firmó el trabajo, o null'),
  mano_de_obra: z.number().nullable(),
  total: z.number().nullable(),
  trabajos: z.array(
    z.object({
      categoria: z.enum(CATEGORY_IDS),
      detalle: z.string().describe('Piezas, marcas o especificaciones tal como aparecen'),
      costo: z.number().nullable(),
      explicacion: z
        .string()
        .describe('Explicación sencilla en 1-2 frases: qué es y por qué se hace'),
    }),
  ),
  resumen: z.string().describe('Resumen amigable de lo que le hicieron al vehículo, 2-4 frases'),
  dudas: z.array(z.string()).describe('Cosas que vale la pena preguntar al taller o revisar (puede estar vacío)'),
});

export type InvoiceScan = z.infer<typeof InvoiceSchema>;

async function prepareImage(photo: PickedPhoto): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  const longEdge = Math.max(photo.width, photo.height);
  if (Platform.OS !== 'web' && (longEdge > MAX_IMAGE_EDGE || !photo.base64)) {
    const ctx = ImageManipulator.manipulate(photo.uri);
    if (longEdge > MAX_IMAGE_EDGE) {
      ctx.resize(photo.width >= photo.height ? { width: MAX_IMAGE_EDGE } : { height: MAX_IMAGE_EDGE });
    }
    const image = await ctx.renderAsync();
    const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
    if (saved.base64) return { data: saved.base64, mediaType: 'image/jpeg' };
  }
  if (!photo.base64) throw new Error('No se pudo leer la imagen.');
  const mediaType = photo.mimeType === 'image/png' ? 'image/png' : photo.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  return { data: photo.base64, mediaType };
}

export async function scanInvoice(photo: PickedPhoto, vehicle: Vehicle, settings: Settings, today: string): Promise<InvoiceScan> {
  const anthropic = await client();
  const image = await prepareImage(photo);
  const categoryList = CATEGORIES.filter((c) => c.appliesTo.includes(vehicle.type))
    .map((c) => `${c.id}: ${c.name}`)
    .join('\n');

  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(InvoiceSchema) },
    system: `${PERSONA}\n\nTu tarea ahora: leer la foto de una factura, nota o presupuesto de un taller mecánico y extraer los trabajos realizados. Clasifica cada trabajo en una de estas categorías (usa "otro" si ninguna aplica; no repitas la misma categoría dos veces, mejor junta el detalle):\n${categoryList}\n\nLos importes van como números sin símbolo de moneda. Hoy es ${today}.`,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          { type: 'text', text: `${vehicleContext(vehicle, settings)}\nLee esta nota del taller y explícame qué le hicieron a mi vehículo.` },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') throw new Error('El asistente no pudo analizar esta imagen.');
  if (!response.parsed_output) throw new Error('No se pudo interpretar la respuesta. Intenta con una foto más clara.');
  return response.parsed_output;
}

// ---------- Explicar un servicio ----------

export async function explainService(input: {
  vehicle: Vehicle;
  service: ServiceRecord;
  workshopName?: string;
  history: ServiceRecord[];
  settings: Settings;
  estimatedKm?: number;
}): Promise<string> {
  const { vehicle, service, settings } = input;
  const anthropic = await client();
  const items = service.items
    .map((i) => `- ${getCategory(i.categoryId).name}${i.detail ? `: ${i.detail}` : ''}${i.cost !== undefined ? ` (${formatMoney(i.cost, settings.currency)})` : ''}`)
    .join('\n');
  const prompt = [
    vehicleContext(vehicle, settings, input.estimatedKm),
    '',
    `Servicio del ${formatDate(service.date)}${service.km !== undefined ? ` a los ${formatDistance(service.km, settings.distanceUnit)}` : ''}${input.workshopName ? ` en "${input.workshopName}"` : ''}${service.mechanic ? `, responsable: ${service.mechanic}` : ''}.`,
    service.reason ? `Motivo de la visita: ${service.reason}` : '',
    service.diagnosis ? `Lo que dijo el mecánico: ${service.diagnosis}` : '',
    `Trabajos:\n${items}`,
    `Total: ${formatMoney(serviceTotal(service), settings.currency)}.`,
    '',
    `Historial reciente del vehículo:\n${historyContext(input.history, settings)}`,
    '',
    'Explícame en lenguaje sencillo qué me hicieron y por qué, si parece razonable según el historial (¿algo se hizo antes de tiempo o falta algo?), y qué debería vigilar después. Usa títulos cortos y viñetas; máximo unas 250 palabras.',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: PERSONA,
    messages: [{ role: 'user', content: prompt }],
  });
  return textOf(response);
}

// ---------- Chat ----------

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export async function askAssistant(turns: ChatTurn[], context: string): Promise<string> {
  const anthropic = await client();
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: `${PERSONA}\n\nResponde de forma breve (máximo ~200 palabras) salvo que te pidan más detalle. Usa viñetas cuando ayuden.\n\nDatos del garaje del usuario:\n${context}`,
    messages: turns.map((t) => ({ role: t.role, content: t.text })),
  });
  return textOf(response);
}

/** Hace una consulta mínima para comprobar que la clave funciona. */
export async function testApiKey(): Promise<void> {
  const anthropic = await client();
  await anthropic.models.retrieve(MODEL);
}
