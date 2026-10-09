import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { ToastHost } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/hooks/useTheme';
import {
  configureNotifications,
  consumeInitialNotificationUrl,
  notificationsSupported,
  onNotificationTap,
  syncNotifications,
} from '@/services/notifications';
import { selectData, useStore } from '@/store';
import { goBack } from '@/services/navigation';

SplashScreen.preventAutoHideAsync().catch(() => {});

function subscribeHydration(callback: () => void) {
  return useStore.persist.onFinishHydration(callback);
}

function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, () => useStore.persist.hasHydrated(), () => false);
}

/** Reprograma las notificaciones cuando cambian los datos o la app vuelve a primer plano. */
function useNotificationSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;
    configureNotifications();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        syncNotifications(selectData(useStore.getState())).catch(() => {});
      }, 1500);
    };
    schedule();
    const unsubscribe = useStore.subscribe(schedule);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });
    return () => {
      unsubscribe();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);
}

/** Al tocar una notificación se abre la pantalla correspondiente. */
function useNotificationNavigation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;
    const initial = consumeInitialNotificationUrl();
    const timer = initial ? setTimeout(() => router.push(initial as Href), 300) : undefined;
    const unsubscribe = onNotificationTap((url) => router.push(url as Href));
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);
}

function CloseButton() {
  const scheme = useResolvedScheme();
  return (
    <Pressable accessibilityRole="button" hitSlop={10} onPress={() => goBack()}>
      <AppText variant="bodyStrong" color={Colors[scheme].primary}>
        Cancelar
      </AppText>
    </Pressable>
  );
}

const modal = {
  presentation: 'modal' as const,
  headerLeft: Platform.OS === 'ios' ? () => <CloseButton /> : undefined,
};

export default function RootLayout() {
  const hydrated = useHydrated();
  const scheme = useResolvedScheme();
  const theme = Colors[scheme];

  useNotificationSync(hydrated);
  useNotificationNavigation(hydrated);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.primary,
          headerTitleStyle: { color: theme.text, fontWeight: '700' },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Inicio' }} />
        <Stack.Screen name="bienvenida" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="vehiculo/nuevo" options={{ ...modal, title: 'Nuevo vehículo' }} />
        <Stack.Screen name="vehiculo/[id]/index" options={{ title: 'Vehículo' }} />
        <Stack.Screen name="vehiculo/[id]/editar" options={{ ...modal, title: 'Editar vehículo' }} />
        <Stack.Screen name="servicio/nuevo" options={{ ...modal, title: 'Registrar servicio' }} />
        <Stack.Screen name="servicio/[id]/index" options={{ title: 'Detalle del servicio' }} />
        <Stack.Screen name="servicio/[id]/editar" options={{ ...modal, title: 'Editar servicio' }} />
        <Stack.Screen name="odometro" options={{ ...modal, title: 'Actualizar kilometraje' }} />
        <Stack.Screen name="documento/nuevo" options={{ ...modal, title: 'Nuevo documento' }} />
        <Stack.Screen name="documento/[id]" options={{ ...modal, title: 'Documento' }} />
        <Stack.Screen name="taller/nuevo" options={{ ...modal, title: 'Nuevo taller' }} />
        <Stack.Screen name="taller/[id]/index" options={{ title: 'Taller' }} />
        <Stack.Screen name="taller/[id]/editar" options={{ ...modal, title: 'Editar taller' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Recordatorio' }} />
        <Stack.Screen name="plan/agregar" options={{ ...modal, title: 'Agregar recordatorio' }} />
        <Stack.Screen name="ia/escanear" options={{ title: 'Escanear factura' }} />
        <Stack.Screen name="ia/chat" options={{ title: 'Pregúntale al mecánico' }} />
        <Stack.Screen name="ia/configurar" options={{ ...modal, title: 'Asistente con IA' }} />
      </Stack>
      <ToastHost />
    </ThemeProvider>
  );
}
