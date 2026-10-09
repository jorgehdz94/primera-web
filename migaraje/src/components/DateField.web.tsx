import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isValidISODate } from '@/logic/dates';

import type { DateFieldProps } from './DateField';
import { Field } from './Form';
import { Icon } from './Icon';

/** En web se usa el selector de fecha nativo del navegador. */
export function DateField({ label, hint, value, onChange, maximumDate, minimumDate }: DateFieldProps) {
  const theme = useTheme();
  return (
    <Field label={label} hint={hint}>
      <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name="calendar" size={20} color={theme.textMuted} />
        {createElement('input', {
          type: 'date',
          value: value ?? '',
          max: maximumDate,
          min: minimumDate,
          onChange: (e: { target: { value: string } }) => {
            const v = e.target.value;
            onChange(isValidISODate(v) ? v : undefined);
          },
          style: {
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: theme.text,
            fontSize: 16,
            fontFamily: 'inherit',
            padding: '12px 0',
            outline: 'none',
            colorScheme: 'light dark',
          },
        })}
      </View>
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
});
