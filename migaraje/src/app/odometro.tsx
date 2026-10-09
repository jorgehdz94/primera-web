import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DateField } from '@/components/DateField';
import { Chip, Field, NumberField } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, todayISO } from '@/logic/dates';
import { formatDistance, parseInteger, vehicleTitle } from '@/logic/format';
import { vehicleOverview } from '@/logic/overview';
import { confirm, haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';
import type { ISODate } from '@/types';
import { goBack } from '@/services/navigation';

export default function OdometerScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const theme = useTheme();
  const data = useAppData();
  const addOdometer = useStore((s) => s.addOdometer);
  const [vehicleId, setVehicleId] = useState<string | undefined>(
    params.vehicleId ?? (data.vehicles.length === 1 ? data.vehicles[0].id : undefined),
  );
  const [km, setKm] = useState('');
  const [date, setDate] = useState<ISODate | undefined>(todayISO());
  const [error, setError] = useState<string | undefined>();
  const overview = useMemo(() => (vehicleId ? vehicleOverview(data, vehicleId) : undefined), [data, vehicleId]);
  const unit = data.settings.distanceUnit;

  if (data.vehicles.length === 0) {
    return (
      <Screen>
        <EmptyState emoji="🚗" title="Primero agrega un vehículo" text="Así podremos llevar su kilometraje." action="Agregar vehículo" onAction={() => router.replace('/vehiculo/nuevo')} />
      </Screen>
    );
  }

  const save = async () => {
    const value = parseInteger(km);
    if (!vehicleId || !overview) {
      setError('Elige el vehículo.');
      return;
    }
    if (value === undefined) {
      setError('Escribe los kilómetros que marca el tablero.');
      haptic('warning');
      return;
    }
    if (!date) {
      setError('Elige la fecha.');
      return;
    }
    if (value < overview.odo.knownKm && date >= overview.odo.knownDate) {
      const ok = await confirm(
        '¿Seguro?',
        `Es menor a la última lectura (${formatDistance(overview.odo.knownKm, unit)} el ${formatDate(overview.odo.knownDate)}). Revisa que no haya un error de dedo.`,
        'Guardar así',
      );
      if (!ok) return;
    }
    if (value > overview.odo.estimatedKm + 20000) {
      const ok = await confirm('¿Seguro?', `Son ${formatDistance(value - overview.odo.knownKm, unit)} más que la última lectura. ¿Está bien?`, 'Sí, guardar');
      if (!ok) return;
    }
    addOdometer({ vehicleId, km: value, date });
    haptic('success');
    toast('Kilometraje actualizado. Recalculamos tus recordatorios.', '📍');
    goBack();
  };

  return (
    <Screen footer={<Button title="Guardar kilometraje" size="lg" full icon="check" onPress={save} />}>
      {data.vehicles.length > 1 ? (
        <Field label="Vehículo">
          <View style={styles.chips}>
            {data.vehicles.map((v) => (
              <Chip
                key={v.id}
                label={v.nickname || vehicleTitle(v)}
                icon={v.type === 'moto' ? 'motorbike' : 'car-side'}
                color={v.color}
                selected={v.id === vehicleId}
                onPress={() => setVehicleId(v.id)}
              />
            ))}
          </View>
        </Field>
      ) : null}

      {overview ? (
        <Card tone="alt" style={styles.card}>
          <AppText variant="caption">Última lectura</AppText>
          <AppText variant="heading">
            {formatDistance(overview.odo.knownKm, unit)} · {formatDate(overview.odo.knownDate)}
          </AppText>
          {overview.odo.daysSinceReading > 0 ? (
            <AppText variant="small" muted>
              Calculamos que hoy anda por {formatDistance(overview.odo.estimatedKm, unit)}.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <NumberField
        label={`¿Cuántos ${unit} marca el tablero?`}
        value={km}
        onChangeText={(t) => {
          setKm(t);
          setError(undefined);
        }}
        suffix={unit}
        icon="speedometer"
        placeholder={overview ? String(overview.odo.estimatedKm) : '45000'}
        error={error}
        autoFocus
      />
      <DateField label="Fecha de la lectura" value={date} onChange={setDate} maximumDate={todayISO()} />
      <InfoBox
        icon="lightbulb-on-outline"
        text="Actualizarlo de vez en cuando (por ejemplo cuando cargas gasolina) hace que tus recordatorios sean mucho más exactos."
      />
      <AppText variant="caption" color={theme.textMuted} style={styles.note}>
        También usamos el kilometraje que anotas en cada servicio.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: { marginBottom: Spacing.lg, gap: 2 },
  note: { marginTop: Spacing.md },
});
