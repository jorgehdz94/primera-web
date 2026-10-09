import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';
import { create } from 'zustand';

type HapticKind = 'light' | 'success' | 'warning' | 'selection';

/** Vibración sutil al tocar o guardar (no hace nada en web). */
export function haptic(kind: HapticKind = 'light') {
  if (Platform.OS === 'web') return;
  const run = async () => {
    if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warning') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (kind === 'selection') await Haptics.selectionAsync();
    else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  run().catch(() => {});
}

/** Pregunta Sí/No. Devuelve true si el usuario confirmó. */
export function confirm(title: string, message: string, confirmText = 'Aceptar', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function showMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

interface ToastState {
  message: string | null;
  emoji: string;
  key: number;
  show: (message: string, emoji?: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  emoji: '✅',
  key: 0,
  show: (message, emoji = '✅') => set((s) => ({ message, emoji, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

/** Muestra un aviso breve en la parte de abajo. */
export function toast(message: string, emoji?: string) {
  useToast.getState().show(message, emoji);
}
