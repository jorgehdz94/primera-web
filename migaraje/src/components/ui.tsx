import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

// ---------- Card ----------

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'default' | 'alt';
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, padded = true, tone = 'default', accessibilityLabel }: CardProps) {
  const theme = useTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: tone === 'alt' ? theme.cardAlt : theme.card,
      borderColor: theme.border,
      boxShadow: tone === 'alt' ? undefined : `0px 2px 10px ${theme.shadow}10`,
    },
    padded && styles.cardPadded,
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

// ---------- Button ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  icon?: IconName;
  variant?: ButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

function buttonColors(variant: ButtonVariant, theme: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { bg: theme.primary, fg: theme.primaryText, border: theme.primary };
    case 'secondary':
      return { bg: theme.card, fg: theme.text, border: theme.border };
    case 'soft':
      return { bg: theme.primarySoft, fg: theme.primary, border: theme.primarySoft };
    case 'danger':
      return { bg: theme.dangerSoft, fg: theme.danger, border: theme.dangerSoft };
    default:
      return { bg: 'transparent', fg: theme.primary, border: 'transparent' };
  }
}

export function Button({
  title,
  icon,
  variant = 'primary',
  size = 'md',
  loading,
  full,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const c = buttonColors(variant, theme);
  const height = size === 'lg' ? 54 : size === 'sm' ? 36 : 46;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={(e) => {
        haptic('light');
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.bg, borderColor: c.border, height, paddingHorizontal: size === 'sm' ? 12 : 18 },
        full && styles.full,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 17 : 20} color={c.fg} /> : null}
          <AppText variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} color={c.fg} numberOfLines={1}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
  background,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  background?: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background ?? theme.cardAlt },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={size * 0.5} color={color ?? theme.text} />
    </Pressable>
  );
}

// ---------- Etiquetas y estados ----------

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent';

export function toneColors(tone: Tone, theme: ThemeColors): { fg: string; bg: string } {
  switch (tone) {
    case 'success':
      return { fg: theme.success, bg: theme.successSoft };
    case 'warning':
      return { fg: theme.warning, bg: theme.warningSoft };
    case 'danger':
      return { fg: theme.danger, bg: theme.dangerSoft };
    case 'info':
      return { fg: theme.info, bg: theme.infoSoft };
    case 'primary':
      return { fg: theme.primary, bg: theme.primarySoft };
    case 'accent':
      return { fg: theme.accent, bg: theme.accentSoft };
    default:
      return { fg: theme.textMuted, bg: theme.cardAlt };
  }
}

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const c = toneColors(tone, theme);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      {icon ? <Icon name={icon} size={13} color={c.fg} /> : null}
      <AppText variant="caption" color={c.fg} style={styles.pillText}>
        {label}
      </AppText>
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { backgroundColor: theme.cardAlt, height, borderRadius: height / 2 }]}>
      <View style={{ width: `${pct * 100}%`, backgroundColor: color, height, borderRadius: height / 2 }} />
    </View>
  );
}

export function IconCircle({ icon, color, background, size = 44 }: { icon: IconName; color: string; background: string; size?: number }) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
      <Icon name={icon} size={size * 0.52} color={color} />
    </View>
  );
}

// ---------- Secciones ----------

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading" style={styles.flex}>
        {title}
      </AppText>
      {action && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <AppText variant="smallStrong" color={theme.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  children?: ReactNode;
  subtitleLines?: number;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  right,
  onPress,
  chevron = !!onPress,
  children,
  subtitleLines,
}: ListRowProps) {
  const theme = useTheme();
  const content = (
    <>
      {icon ? (
        <IconCircle icon={icon} color={iconColor ?? theme.primary} background={iconBackground ?? theme.primarySoft} size={40} />
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" muted numberOfLines={subtitleLines}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      {right}
      {chevron ? <Icon name="chevron-right" size={22} color={theme.textMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.listRow}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

export function EmptyState({
  emoji,
  title,
  text,
  action,
  onAction,
}: {
  emoji: string;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <AppText style={styles.emptyEmoji}>{emoji}</AppText>
      <AppText variant="heading" center>
        {title}
      </AppText>
      <AppText muted center>
        {text}
      </AppText>
      {action && onAction ? <Button title={action} icon="plus" onPress={onAction} style={styles.emptyButton} /> : null}
    </View>
  );
}

export function InfoBox({
  title,
  text,
  icon = 'lightbulb-on-outline',
  tone = 'info',
  children,
}: {
  title?: string;
  text?: string;
  icon?: IconName;
  tone?: Tone;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const c = toneColors(tone, theme);
  return (
    <View style={[styles.infoBox, { backgroundColor: c.bg }]}>
      <Icon name={icon} size={22} color={c.fg} />
      <View style={styles.flex}>
        {title ? (
          <AppText variant="smallStrong" color={c.fg}>
            {title}
          </AppText>
        ) : null}
        {text ? <AppText variant="small">{text}</AppText> : null}
        {children}
      </View>
    </View>
  );
}

export function Row({ children, gap = Spacing.sm, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[styles.row, { gap }, wrap && styles.wrap, style]}>{children}</View>;
}

export function Bullets({ items, color }: { items: string[]; color?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.bullets}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: color ?? theme.primary }]} />
          <AppText style={styles.flex}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

export function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.cardAlt }]}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {hint ? <AppText variant="caption">{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardPadded: { padding: Spacing.lg },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  button: {
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontWeight: '700' },
  track: { width: '100%', overflow: 'hidden' },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  flex: { flex: 1 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.xs },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyEmoji: { fontSize: 52, lineHeight: 64 },
  emptyButton: { marginTop: Spacing.md },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  bullets: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 9 },
  statBox: { flex: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 2, minWidth: 100 },
});
