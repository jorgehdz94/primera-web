import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { isoToLocalDate } from '@/logic/dates';
import { planReminders } from '@/logic/reminders';
import type { AppData } from '@/types';

type NotificationsApi = typeof NotificationsModule;

const CHANNEL_ID = 'recordatorios';

/**
 * Se carga de forma diferida y protegida: en Expo Go para Android parte del módulo (notificaciones push)
 * ya no existe y podría fallar al importarse. Los recordatorios locales no deben tumbar la app.
 */
function loadNotifications(): NotificationsApi | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsApi;
  } catch (e) {
    console.warn('[MiGaraje] Notificaciones no disponibles en este entorno.', e);
    return null;
  }
}

const Notifications = loadNotifications();

export const notificationsSupported = Notifications !== null;

let configured = false;

export function configureNotifications() {
  if (!Notifications || configured) return;
  configured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Recordatorios de mantenimiento',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EE6A1F',
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('[MiGaraje] No se pudieron configurar las notificaciones.', e);
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Pide permiso para notificaciones. Devuelve true si quedó concedido. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

function atHour(isoDate: string, hour: number): Date {
  const date = isoToLocalDate(isoDate);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/**
 * Vuelve a programar todas las notificaciones locales a partir de los datos actuales.
 * Se llama cada vez que cambian los datos (con un pequeño retraso) y al abrir la app.
 */
export async function syncNotifications(data: AppData): Promise<number> {
  if (!Notifications) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { settings } = data;
  if (!settings.notificationsEnabled || !data.onboarded) return 0;
  if (!(await hasNotificationPermission())) return 0;

  const now = Date.now();
  let count = 0;
  for (const r of planReminders(data)) {
    const when = atHour(r.date, settings.notifyHour);
    if (when.getTime() <= now + 60_000) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body, data: { url: r.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
    });
    count += 1;
  }

  if (data.vehicles.length > 0 && settings.odometerReminder !== 'nunca') {
    const hour = Math.max(settings.notifyHour, 10);
    await Notifications.scheduleNotificationAsync({
      identifier: 'odometro',
      content: {
        title: '🚗 ¿Cuántos kilómetros llevas?',
        body: 'Actualiza el kilometraje en MiGaraje para que tus recordatorios sean exactos. Toma 10 segundos.',
        data: { url: '/odometro' },
      },
      trigger:
        settings.odometerReminder === 'semanal'
          ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour, minute: 0, channelId: CHANNEL_ID }
          : { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour, minute: 0, channelId: CHANNEL_ID },
    });
    count += 1;
  }
  return count;
}

export async function sendTestNotification(): Promise<boolean> {
  if (!Notifications || !(await requestNotificationPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔧 ¡Así se verán tus recordatorios!',
      body: 'MiGaraje te avisará antes de cada cambio de aceite y mantenimiento.',
      data: { url: '/' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL_ID },
  });
  return true;
}

function urlFromResponse(response: NotificationsModule.NotificationResponse | null | undefined): string | undefined {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : undefined;
}

/** Ruta de la notificación con la que se abrió la app (si la hay). */
export function consumeInitialNotificationUrl(): string | undefined {
  if (!Notifications) return undefined;
  try {
    const url = urlFromResponse(Notifications.getLastNotificationResponse());
    if (url) Notifications.clearLastNotificationResponse();
    return url;
  } catch {
    return undefined;
  }
}

/** Escucha cuando el usuario toca una notificación. Devuelve la función para dejar de escuchar. */
export function onNotificationTap(callback: (url: string) => void): () => void {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = urlFromResponse(response);
    if (url) callback(url);
  });
  return () => sub.remove();
}
