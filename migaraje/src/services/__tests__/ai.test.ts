import { DEFAULT_SETTINGS } from '@/logic/backup';
import { askAssistant, explainService, friendlyAIError, scanInvoice } from '@/services/ai';
import type { ServiceRecord, Vehicle } from '@/types';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => 'sk-ant-prueba'),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const vehicle: Vehicle = {
  id: 'v1',
  type: 'carro',
  nickname: 'El Rayo',
  brand: 'Mazda',
  model: '3',
  year: 2019,
  color: '#000',
  fuel: 'gasolina',
  oilType: 'sintetico',
  monthlyKm: 1000,
  initialKm: 40000,
  createdAt: '2026-01-01',
};

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

let captured: CapturedRequest[] = [];

function mockResponse(content: unknown[], stopReason = 'end_turn') {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => {
      headers[k] = v;
    });
    captured.push({ url: String(input), headers, body: JSON.parse(String(init?.body ?? '{}')) });
    return new Response(
      JSON.stringify({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content,
        stop_reason: stopReason,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
}

beforeEach(() => {
  captured = [];
});

describe('asistente con IA', () => {
  it('escanea una factura y devuelve los datos estructurados', async () => {
    const scan = {
      legible: true,
      fecha: '2026-10-01',
      kilometraje: 48000,
      taller: 'Taller López',
      mecanico: 'Ramiro',
      mano_de_obra: 300,
      total: 1500,
      trabajos: [{ categoria: 'aceite', detalle: 'Sintético 5W-30', costo: 1200, explicacion: 'Se cambió el aceite.' }],
      resumen: 'Te cambiaron el aceite.',
      dudas: [],
    };
    mockResponse([{ type: 'text', text: JSON.stringify(scan) }]);

    const result = await scanInvoice(
      { uri: 'file:///foto.jpg', base64: 'aGVsbG8=', mimeType: 'image/jpeg', width: 800, height: 600 },
      vehicle,
      DEFAULT_SETTINGS,
      '2026-10-09',
    );

    expect(result.trabajos[0].categoria).toBe('aceite');
    expect(result.total).toBe(1500);
    const req = captured[0];
    expect(req.url).toContain('/v1/messages');
    expect(req.headers['x-api-key']).toBe('sk-ant-prueba');
    expect(req.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(req.body.model).toBe('claude-opus-5-5');
    expect(req.body.fallbacks).toBe('default');
    const outputConfig = req.body.output_config as { effort: string; format: { type: string } };
    expect(outputConfig.effort).toBe('medium');
    expect(outputConfig.format.type).toBe('json_schema');
    const messages = req.body.messages as { content: { type: string; source?: { type: string; media_type: string } }[] }[];
    expect(messages[0].content[0].type).toBe('image');
    expect(messages[0].content[0].source).toMatchObject({ type: 'base64', media_type: 'image/jpeg' });
  });

  it('explica un servicio y responde preguntas', async () => {
    mockResponse([{ type: 'text', text: '## Qué te hicieron\n- Cambio de aceite' }]);
    const service: ServiceRecord = {
      id: 's1',
      vehicleId: 'v1',
      date: '2026-10-01',
      km: 48000,
      items: [{ id: 'i1', categoryId: 'aceite', cost: 1200 }],
      photos: [],
      createdAt: '2026-10-01T00:00:00Z',
    };
    const text = await explainService({ vehicle, service, history: [], settings: DEFAULT_SETTINGS });
    expect(text).toContain('Cambio de aceite');
    expect(captured[0].body.system).toContain('MiGaraje');

    mockResponse([{ type: 'text', text: 'Revisa las pastillas.' }]);
    const answer = await askAssistant([{ role: 'user', text: 'Me chillan los frenos' }], 'Sin vehículos');
    expect(answer).toBe('Revisa las pastillas.');
  });

  it('avisa cuando el asistente no puede responder', async () => {
    mockResponse([], 'refusal');
    await expect(askAssistant([{ role: 'user', text: 'Hola' }], '')).rejects.toThrow('no pudo responder');
    expect(friendlyAIError(new Error('x'))).toBe('x');
  });
});
