import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label ? <AppText variant="smallStrong">{label}</AppText> : null}
      {children}
      {error ? (
        <AppText variant="caption" color={theme.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption">{hint}</AppText>
      ) : null}
    </View>
  );
}

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value'> {
  label?: string;
  hint?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  prefix?: string;
  icon?: IconName;
}

export function TextField({ label, hint, error, value, onChangeText, suffix, prefix, icon, multiline, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <Field label={label} hint={hint} error={error}>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: theme.card, borderColor: error ? theme.danger : theme.border },
          multiline && styles.multilineWrap,
        ]}>
        {icon ? <Icon name={icon} size={20} color={theme.textMuted} /> : null}
        {prefix ? <AppText muted>{prefix}</AppText> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={theme.textMuted}
          multiline={multiline}
          style={[styles.input, { color: theme.text }, multiline && styles.multiline]}
          {...rest}
        />
        {suffix ? <AppText muted>{suffix}</AppText> : null}
      </View>
    </Field>
  );
}

/** Campo numérico: guarda el texto tal cual y el padre lo interpreta. */
export function NumberField(props: TextFieldProps & { decimal?: boolean }) {
  const { decimal, ...rest } = props;
  const keyboardType: KeyboardTypeOptions = decimal ? 'decimal-pad' : 'number-pad';
  return <TextField keyboardType={keyboardType} inputMode={decimal ? 'decimal' : 'numeric'} {...rest} />;
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  emoji?: string;
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  allowNone,
}: {
  options: ChipOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allowNone?: boolean;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          icon={o.icon}
          emoji={o.emoji}
          selected={value === o.value}
          onPress={() => onChange(allowNone && value === o.value ? undefined : o.value)}
        />
      ))}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  emoji,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  emoji?: string;
  color?: string;
}) {
  const theme = useTheme();
  const active = color ?? theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? active : theme.card,
          borderColor: selected ? active : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      {emoji ? <AppText variant="small">{emoji}</AppText> : null}
      {icon ? <Icon name={icon} size={17} color={selected ? '#FFFFFF' : theme.text} /> : null}
      <AppText variant="smallStrong" color={selected ? '#FFFFFF' : theme.text} style={styles.chipText}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.cardAlt }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic('selection');
              onChange(o.value);
            }}
            style={[styles.segment, selected && { backgroundColor: theme.card, boxShadow: `0px 1px 4px ${theme.shadow}22` }]}>
            {o.icon ? <Icon name={o.icon} size={20} color={selected ? theme.primary : theme.textMuted} /> : null}
            {o.emoji ? <AppText>{o.emoji}</AppText> : null}
            <AppText variant="smallStrong" color={selected ? theme.text : theme.textMuted}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: IconName;
}) {
  const theme = useTheme();
  return (
    <View style={styles.switchRow}>
      {icon ? <Icon name={icon} size={22} color={theme.textMuted} /> : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? <AppText variant="caption">{hint}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic('selection');
          onChange(v);
        }}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function StarRating({ value, onChange, size = 30 }: { value?: number; onChange?: (value: number | undefined) => void; size?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const star = <Icon name={filled ? 'star' : 'star-outline'} size={size} color={filled ? '#F5A524' : theme.textMuted} />;
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} estrellas`}
            hitSlop={4}
            onPress={() => {
              haptic('selection');
              onChange(value === n ? undefined : n);
            }}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, marginBottom: Spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  multilineWrap: { alignItems: 'flex-start', paddingVertical: Spacing.sm },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  flex: { flex: 1 },
  stars: { flexDirection: 'row', gap: 6 },
});
