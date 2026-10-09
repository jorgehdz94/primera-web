import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useStore } from '@/store';

const noopSubscribe = () => () => {};

/** false durante el render estático de web (no se conoce el tema del sistema), true en el cliente. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Esquema activo según la preferencia del usuario y la del sistema. */
export function useResolvedScheme(): 'light' | 'dark' {
  const preference = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const isClient = useIsClient();
  if (preference !== 'system') return preference;
  if (!isClient) return 'light';
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors {
  return Colors[useResolvedScheme()];
}
