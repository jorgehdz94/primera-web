import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/useTheme';
import { formatDateLong, isoToLocalDate, toISODate } from '@/logic/dates';
import type { ISODate } from '@/types';

import { AppText } from './AppText';
import { Field } from './Form';
import { Icon } from './Icon';

export interface DateFieldProps {
  label?: string;
  hint?: string;
  value: ISODate | undefined;
  onChange: (value: ISODate | undefined) => void;
  maximumDate?: ISODate;
  minimumDate?: ISODate;
  /** Permite dejar la fecha vacía. */
  optional?: boolean;
  placeholder?: string;
}

export function DateField({ label, hint, value, onChange, maximumDate, minimumDate, optional, placeholder }: DateFieldProps) {
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const date = value ? isoToLocalDate(value) : new Date();
  const max = maximumDate ? isoToLocalDate(maximumDate) : undefined;
  const min = minimumDate ? isoToLocalDate(minimumDate) : undefined;

  if (Platform.OS === 'ios' && value) {
    return (
      <Field label={label} hint={hint}>
        <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Icon name="calendar" size={20} color={theme.textMuted} />
          <AppText style={styles.flex}>{formatDateLong(value)}</AppText>
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            locale="es-MX"
            maximumDate={max}
            minimumDate={min}
            accentColor={theme.primary}
            themeVariant={scheme}
            onValueChange={(_e, d) => onChange(toISODate(d))}
          />
          {optional ? (
            <Pressable accessibilityLabel="Quitar fecha" hitSlop={8} onPress={() => onChange(undefined)}>
              <Icon name="close" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </Field>
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        maximumDate: max,
        minimumDate: min,
        onValueChange: (_e, d) => onChange(toISODate(d)),
      });
    } else {
      // iOS sin valor: se asigna hoy y se muestra el selector compacto.
      onChange(toISODate(new Date()));
    }
  };

  return (
    <Field label={label} hint={hint}>
      <Pressable
        accessibilityRole="button"
        onPress={open}
        style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name="calendar" size={20} color={theme.textMuted} />
        <AppText style={styles.flex} muted={!value}>
          {value ? formatDateLong(value) : (placeholder ?? 'Elegir fecha')}
        </AppText>
        {optional && value ? (
          <Pressable accessibilityLabel="Quitar fecha" hitSlop={8} onPress={() => onChange(undefined)}>
            <Icon name="close" size={18} color={theme.textMuted} />
          </Pressable>
        ) : (
          <Icon name="chevron-down" size={20} color={theme.textMuted} />
        )}
      </Pressable>
    </Field>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  flex: { flex: 1 },
});
