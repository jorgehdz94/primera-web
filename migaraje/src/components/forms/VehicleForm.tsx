import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DateField } from '@/components/DateField';
import { ChipSelect, Field, NumberField, Segmented, TextField } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, InfoBox, SectionHeader } from '@/components/ui';
import { Spacing, VEHICLE_COLORS } from '@/constants/theme';
import { FUEL_LABELS, OIL_TYPE_LABELS } from '@/data/categories';
import { useSettings } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { todayISO } from '@/logic/dates';
import { formatNumber, parseInteger } from '@/logic/format';
import { haptic } from '@/services/feedback';
import type { NewVehicleInput } from '@/store';
import type { FuelType, ISODate, OilType, Vehicle, VehicleType } from '@/types';

const VISCOSITIES: Record<VehicleType, string[]> = {
  carro: ['0W-20', '5W-20', '5W-30', '5W-40', '10W-30', '10W-40', '15W-40', '20W-50'],
  moto: ['10W-30', '10W-40', '15W-50', '20W-50'],
};
const MONTHLY: number[] = [300, 600, 1000, 1500, 2000, 3000];

export type VehicleFormValues = Omit<NewVehicleInput, 'createdAt'>;

interface Props {
  initial?: Vehicle;
  onSubmit: (values: VehicleFormValues) => void;
  submitLabel: string;
}

export function VehicleForm({ initial, onSubmit, submitLabel }: Props) {
  const theme = useTheme();
  const settings = useSettings();
  const unit = settings.distanceUnit;
  const isNew = !initial;

  const [type, setType] = useState<VehicleType>(initial?.type ?? 'carro');
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial?.year ? String(initial.year) : '');
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [vin, setVin] = useState(initial?.vin ?? '');
  const [color, setColor] = useState(initial?.color ?? VEHICLE_COLORS[0]);
  const [fuel, setFuel] = useState<FuelType>(initial?.fuel ?? 'gasolina');
  const [oilType, setOilType] = useState<OilType>(initial?.oilType ?? 'sintetico');
  const [viscosity, setViscosity] = useState(initial?.oilViscosity ?? '');
  const [km, setKm] = useState(initial ? String(initial.initialKm) : '');
  const [monthly, setMonthly] = useState(String(initial?.monthlyKm ?? 1000));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [oilDate, setOilDate] = useState<ISODate | undefined>();
  const [oilKm, setOilKm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    const kmValue = parseInteger(km);
    const yearValue = parseInteger(year);
    const monthlyValue = parseInteger(monthly);
    if (!brand.trim() && !nickname.trim()) next.brand = 'Escribe al menos la marca o un apodo.';
    if (isNew && kmValue === undefined) next.km = '¿Cuántos kilómetros marca el tablero? Si no sabes, pon un aproximado.';
    if (year && (yearValue === undefined || yearValue < 1900 || yearValue > new Date().getFullYear() + 1)) next.year = 'Revisa el año.';
    if (oilKm && kmValue !== undefined && (parseInteger(oilKm) ?? 0) > kmValue) next.oilKm = 'No puede ser mayor al kilometraje actual.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('warning');
      return;
    }
    onSubmit({
      type,
      nickname: nickname.trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: yearValue,
      plate: plate.trim().toUpperCase() || undefined,
      vin: vin.trim().toUpperCase() || undefined,
      color,
      fuel,
      oilType,
      oilViscosity: viscosity.trim() || undefined,
      monthlyKm: monthlyValue ?? 1000,
      initialKm: kmValue ?? initial?.initialKm ?? 0,
      notes: notes.trim() || undefined,
      lastOilChange: isNew && oilDate ? { date: oilDate, km: parseInteger(oilKm) } : undefined,
    });
  };

  return (
    <Screen footer={<Button title={submitLabel} size="lg" full icon="check" onPress={submit} />}>
      <Field label="¿Qué tipo de vehículo es?">
        <Segmented<VehicleType>
          value={type}
          onChange={setType}
          options={[
            { value: 'carro', label: 'Carro', icon: 'car-side' },
            { value: 'moto', label: 'Moto', icon: 'motorbike' },
          ]}
        />
      </Field>

      <TextField label="Apodo (opcional)" value={nickname} onChangeText={setNickname} placeholder={type === 'moto' ? 'Ej. La Negra' : 'Ej. El Rayo'} hint="Así lo verás en la app." />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Marca" value={brand} onChangeText={setBrand} placeholder={type === 'moto' ? 'Honda' : 'Nissan'} error={errors.brand} />
        </View>
        <View style={styles.flex}>
          <TextField label="Modelo" value={model} onChangeText={setModel} placeholder={type === 'moto' ? 'CB190R' : 'Versa'} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <NumberField label="Año" value={year} onChangeText={setYear} placeholder="2020" maxLength={4} error={errors.year} />
        </View>
        <View style={styles.flex}>
          <TextField label="Placas" value={plate} onChangeText={setPlate} placeholder="ABC-123" autoCapitalize="characters" />
        </View>
      </View>

      <Field label="Color en la app">
        <View style={styles.colors}>
          {VEHICLE_COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityState={{ selected: c === color }}
              accessibilityLabel={`Color ${c}`}
              onPress={() => {
                haptic('selection');
                setColor(c);
              }}
              style={[styles.color, { backgroundColor: c, borderColor: c === color ? theme.text : 'transparent' }]}>
              {c === color ? <Icon name="check-bold" size={18} color="#FFFFFF" /> : null}
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Combustible">
        <ChipSelect<FuelType>
          value={fuel}
          onChange={(v) => v && setFuel(v)}
          options={(Object.keys(FUEL_LABELS) as FuelType[]).map((f) => ({ value: f, label: FUEL_LABELS[f] }))}
        />
      </Field>

      {isNew ? (
        <>
          <SectionHeader title="Kilometraje" />
          <NumberField
            label={`¿Cuántos ${unit} marca hoy el tablero?`}
            value={km}
            onChangeText={setKm}
            placeholder="45,000"
            suffix={unit}
            error={errors.km}
            icon="speedometer"
          />
        </>
      ) : null}
      <Field
        label={`¿Cuántos ${unit} recorres al mes, más o menos?`}
        hint="Lo usamos para calcular cuándo te tocará cada servicio mientras juntamos tus lecturas reales.">
        <ChipSelect<string>
          value={MONTHLY.map(String).includes(monthly) ? monthly : undefined}
          onChange={(v) => v && setMonthly(v)}
          options={MONTHLY.map((m) => ({ value: String(m), label: formatNumber(m) }))}
        />
        <NumberField value={monthly} onChangeText={setMonthly} suffix={`${unit}/mes`} placeholder="1,000" />
      </Field>

      {fuel !== 'electrico' ? (
        <>
          <SectionHeader title="Aceite del motor" />
          <Card tone="alt" style={styles.card}>
            <Field label="Tipo de aceite que usa">
              <ChipSelect<OilType>
                value={oilType}
                onChange={(v) => v && setOilType(v)}
                options={(Object.keys(OIL_TYPE_LABELS) as OilType[]).map((o) => ({ value: o, label: OIL_TYPE_LABELS[o] }))}
              />
            </Field>
            <AppText variant="caption" style={styles.help}>
              💡 ¿No sabes? Revisa la nota de tu último cambio o pregúntale al taller. Los motores de los últimos 10-15 años suelen usar sintético o semisintético. Con esto calculamos cada cuándo cambiarlo.
            </AppText>
            <Field label="Viscosidad (opcional)">
              <ChipSelect<string>
                allowNone
                value={VISCOSITIES[type].includes(viscosity) ? viscosity : undefined}
                onChange={(v) => setViscosity(v ?? '')}
                options={VISCOSITIES[type].map((v) => ({ value: v, label: v }))}
              />
            </Field>
          </Card>

          {isNew ? (
            <>
              <SectionHeader title="¿Cuándo fue tu último cambio de aceite?" />
              <InfoBox
                icon="oil"
                tone="primary"
                text="Si lo sabes, te podemos avisar desde hoy cuándo toca el siguiente. Si no lo recuerdas, déjalo vacío: empezaremos a contar desde tu próximo cambio."
              />
              <View style={styles.spacer} />
              <DateField label="Fecha (aproximada)" value={oilDate} onChange={setOilDate} maximumDate={todayISO()} optional placeholder="No lo sé" />
              {oilDate ? (
                <NumberField
                  label={`Kilometraje en ese cambio (opcional)`}
                  value={oilKm}
                  onChangeText={setOilKm}
                  suffix={unit}
                  hint="Revisa la calcomanía del parabrisas o la nota del taller."
                  error={errors.oilKm}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <SectionHeader title="Más datos (opcional)" />
      <TextField label="Número de serie (VIN)" value={vin} onChangeText={setVin} autoCapitalize="characters" placeholder="17 caracteres" hint="Útil para pedir refacciones exactas. Viene en la tarjeta de circulación." />
      <TextField label="Notas" value={notes} onChangeText={setNotes} multiline placeholder="Ruidos que has notado, detalles de la compra…" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  color: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: Spacing.sm },
  help: { marginTop: -Spacing.sm, marginBottom: Spacing.lg },
  spacer: { height: Spacing.lg },
});
