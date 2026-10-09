import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/services/feedback';

import { AppText } from './AppText';

/** Aviso flotante breve. Se monta una sola vez en el layout raíz. */
export function ToastHost() {
  const { message, emoji, key, hide } = useToast();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => hide());
    }, 2600);
    return () => clearTimeout(timer);
  }, [message, key, opacity, hide]);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 90 }]}>
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <AppText style={styles.emoji}>{emoji}</AppText>
        <AppText variant="smallStrong" color="#FFFFFF" style={styles.text}>
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.lg },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#1D222B',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    maxWidth: 520,
    boxShadow: '0px 6px 20px rgba(0,0,0,0.25)',
  },
  emoji: { fontSize: 18 },
  text: { flexShrink: 1 },
});
