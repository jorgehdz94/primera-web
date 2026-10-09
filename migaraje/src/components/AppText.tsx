import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'small' | 'smallStrong' | 'caption' | 'overline';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
  muted?: boolean;
  center?: boolean;
}

export function AppText({ variant = 'body', color, muted, center, style, ...rest }: Props) {
  const theme = useTheme();
  const textColor = color ?? (muted || variant === 'caption' || variant === 'overline' ? theme.textMuted : theme.text);
  return (
    <Text
      {...rest}
      style={[styles[variant], { color: textColor }, center && styles.center, style]}
    />
  );
}

const styles = StyleSheet.create<Record<TextVariant | 'center', TextStyle>>({
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20 },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12.5, lineHeight: 17 },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  center: { textAlign: 'center' },
});
