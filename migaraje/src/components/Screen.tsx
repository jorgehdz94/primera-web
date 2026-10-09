import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

interface ScreenProps {
  children: ReactNode;
  /** Para pestañas: agrega el margen superior de la zona segura. */
  safeTop?: boolean;
  /** Contenido fijo debajo del scroll (p. ej. botón Guardar). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Espacio extra abajo (p. ej. para un botón flotante). */
  bottomSpace?: number;
}

export function Screen({ children, safeTop, footer, contentStyle, bottomSpace = 0 }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingTop: (safeTop ? insets.top : 0) + Spacing.lg, paddingBottom: Spacing.xxl + bottomSpace + (footer ? 0 : insets.bottom) },
          contentStyle,
        ]}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}>
          <View style={styles.inner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        {subtitle ? <AppText variant="overline">{subtitle}</AppText> : null}
        <AppText variant="display">{title}</AppText>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md, marginBottom: Spacing.lg },
  flex: { flex: 1 },
});
