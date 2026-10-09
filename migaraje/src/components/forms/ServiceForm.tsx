import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { Chip, Field, NumberField, StarRating, TextField } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { PhotoStrip } from '@/components/PhotoStrip';
import { Screen } from '@/components/Screen';
import { Button, Card, IconCircle, InfoBox, SectionHeader } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { todayISO } from '@/logic/dates';
import { formatDistance, formatMoney, newId, parseAmount, parseInteger, vehicleTitle } from '@/logic/format';
import { vehicleOverview } from '@/logic/overview';
import { haptic } from '@/services/feedback';
import type { ServiceDraft } from '@/store/draft';
import type { ISODate, ServiceRecord } from '@/types';

const REASONS = [
  'Mantenimiento preventivo',
  'Una falla o un ruido',
  'Revisión antes de un viaje',
  'Me lo recomendó el taller',
  'Garantía',
  'Choque o golpe',
];

interface ItemDraft {
  id: string;
  categoryId: string;
  detail: string;
  cost: string;
  nextKm: string;
  nextDate?: ISODate;
  open: boolean;
}

export interface ServiceFormValues extends Omit<ServiceRecord, 'id' | 'createdAt' | 'workshopId' | 'workshopName'> {
  workshop?: { id?: string; name: string };
}

interface Props {
  initial?: ServiceRecord;
  draft?: ServiceDraft | null;
  initialVehicleId?: string;
  initialCategoryId?: string;
  submitLabel: string;
  onSubmit: (values: ServiceFormValues) => void;
}

function firstSentence(text: string): string {
  const i = text.indexOf('. ');
  return i > 0 ? text.slice(0, i + 1) : text;
}

function toDraftItem(categoryId: string, detail = '', cost?: number, nextKm?: number, nextDate?: ISODate): ItemDraft {
  return {
    id: newId(),
    categoryId,
    detail,
    cost: cost !== undefined ? String(cost) : '',
    nextKm: nextKm !== undefined ? String(nextKm) : '',
    nextDate,
    open: false,
  };
}

export function ServiceForm({ initial, draft, initialVehicleId, initialCategoryId, submitLabel, onSubmit }: Props) {
  const theme = useTheme();
  const data = useAppData();
  const { settings } = data;
  const unit = settings.distanceUnit;

  const defaultVehicle = initial?.vehicleId ?? draft?.vehicleId ?? initialVehicleId ?? (data.vehicles.length === 1 ? data.vehicles[0].id : undefined);
  const initialWorkshop = initial?.workshopId ? data.workshops.find((w) => w.id === initial.workshopId) : undefined;
  const draftWorkshop = draft?.workshopName
    ? data.workshops.find((w) => w.name.trim().toLowerCase() === draft.workshopName?.trim().toLowerCase())
    : undefined;

  const [vehicleId, setVehicleId] = useState<string | undefined>(defaultVehicle);
  const [date, setDate] = useState<ISODate | undefined>(initial?.date ?? draft?.date ?? todayISO());
  const [km, setKm] = useState(initial?.km !== undefined ? String(initial.km) : draft?.km !== undefined ? String(draft.km) : '');
  const [items, setItems] = useState<ItemDraft[]>(() => {
    if (initial) return initial.items.map((i) => ({ ...toDraftItem(i.categoryId, i.detail, i.cost, i.nextKm, i.nextDate), id: i.id }));
    if (draft) return draft.items.map((i) => toDraftItem(i.categoryId, i.detail, i.cost));
    return initialCategoryId ? [toDraftItem(initialCategoryId)] : [];
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState<string | undefined>(initialWorkshop?.id ?? draftWorkshop?.id);
  const [workshopText, setWorkshopText] = useState(
    initialWorkshop ? '' : (initial?.workshopName ?? (draftWorkshop ? '' : (draft?.workshopName ?? ''))),
  );
  const [mechanic, setMechanic] = useState(initial?.mechanic ?? draft?.mechanic ?? '');
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? draft?.diagnosis ?? '');
  const [labor, setLabor] = useState(
    initial?.laborCost !== undefined ? String(initial.laborCost) : draft?.laborCost !== undefined ? String(draft.laborCost) : '',
  );
  const [total, setTotal] = useState(
    initial?.totalCost !== undefined ? String(initial.totalCost) : draft?.totalCost !== undefined ? String(draft.totalCost) : '',
  );
  const [warrantyUntil, setWarrantyUntil] = useState<ISODate | undefined>(initial?.warrantyUntil);
  const [warrantyKm, setWarrantyKm] = useState(initial?.warrantyKm !== undefined ? String(initial.warrantyKm) : '');
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? draft?.photos ?? []);
  const [rating, setRating] = useState<number | undefined>(initial?.rating);
  const [notes, setNotes] = useState(initial?.notes ?? draft?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicle = data.vehicles.find((v) => v.id === vehicleId);
  const overview = useMemo(() => (vehicleId ? vehicleOverview(data, vehicleId) : undefined), [data, vehicleId]);
  const workshop = data.workshops.find((w) => w.id === workshopId);
  const selectedIds = items.map((i) => i.categoryId);
  const itemsSum = items.reduce((sum, i) => sum + (parseAmount(i.cost) ?? 0), 0);
  const computedTotal = itemsSum + (parseAmount(labor) ?? 0);

  const suggestions = useMemo(() => {
    if (!vehicle) return [];
    const ids = new Set<string>();
    for (const id of selectedIds) for (const r of getCategory(id).related ?? []) ids.add(r);
    return [...ids]
      .filter((id) => !selectedIds.includes(id))
      .map(getCategory)
      .filter((c) => c.appliesTo.includes(vehicle.type) && !c.notFor?.includes(vehicle.fuel))
      .slice(0, 4);
  }, [selectedIds, vehicle]);

  const recentWorkshops = useMemo(() => {
    const lastUse = new Map<string, string>();
    for (const s of data.services) {
      if (s.workshopId && (lastUse.get(s.workshopId) ?? '') < s.date) lastUse.set(s.workshopId, s.date);
    }
    const key = (id: string, createdAt: string) => lastUse.get(id) ?? createdAt.slice(0, 10);
    return [...data.workshops].sort((a, b) => key(b.id, b.createdAt).localeCompare(key(a.id, a.createdAt))).slice(0, 8);
  }, [data.services, data.workshops]);

  const toggleCategory = (categoryId: string) => {
    setItems((prev) =>
      prev.some((i) => i.categoryId === categoryId) ? prev.filter((i) => i.categoryId !== categoryId) : [...prev, toDraftItem(categoryId)],
    );
  };

  const updateItem = (id: string, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!vehicleId) next.vehicle = 'Elige el vehículo.';
    if (!date) next.date = 'Elige la fecha.';
    if (items.length === 0) next.items = 'Agrega al menos un trabajo.';
    const kmValue = parseInteger(km);
    setErrors(next);
    if (Object.keys(next).length > 0 || !vehicleId || !date) {
      haptic('warning');
      return;
    }
    const typedName = workshopText.trim();
    const totalValue = parseAmount(total);
    onSubmit({
      vehicleId,
      date,
      km: kmValue,
      workshop: workshop ? { id: workshop.id, name: workshop.name } : typedName ? { name: typedName } : undefined,
      mechanic: mechanic.trim() || undefined,
      items: items.map((i) => ({
        id: i.id,
        categoryId: i.categoryId,
        detail: i.detail.trim() || undefined,
        cost: parseAmount(i.cost),
        nextKm: parseInteger(i.nextKm),
        nextDate: i.nextDate,
      })),
      laborCost: parseAmount(labor),
      totalCost: totalValue !== undefined && Math.abs(totalValue - computedTotal) > 0.009 ? totalValue : undefined,
      reason: reason.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
      notes: notes.trim() || undefined,
      photos,
      warrantyUntil,
      warrantyKm: parseInteger(warrantyKm),
      rating,
    });
  };

  return (
    <Screen footer={<Button title={submitLabel} size="lg" full icon="check" onPress={submit} />}>
      {draft ? (
        <>
          <InfoBox
            icon="robot-outline"
            tone="accent"
            title="Datos leídos de tu factura"
            text="Revisa que todo esté correcto antes de guardar. Puedes cambiar lo que haga falta."
          />
          <View style={styles.spacer} />
        </>
      ) : null}

      {data.vehicles.length > 1 || !vehicle ? (
        <Field label="Vehículo" error={errors.vehicle}>
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

      <View style={styles.row}>
        <View style={styles.flex}>
          <DateField label="¿Cuándo?" value={date} onChange={setDate} maximumDate={todayISO()} />
        </View>
      </View>
      <NumberField
        label="Kilometraje del tablero"
        value={km}
        onChangeText={setKm}
        suffix={unit}
        icon="speedometer"
        placeholder={overview ? String(overview.odo.estimatedKm) : '45000'}
        hint={
          overview
            ? `Hoy tu vehículo tiene aprox. ${formatDistance(overview.odo.estimatedKm, unit)}. Lo encuentras en la nota del taller o en la calcomanía.`
            : 'Lo encuentras en la nota del taller o en la calcomanía del parabrisas.'
        }
      />

      <SectionHeader title="¿Qué le hicieron?" />
      {errors.items ? (
        <AppText variant="caption" color={theme.danger} style={styles.error}>
          {errors.items}
        </AppText>
      ) : null}
      {items.map((item) => {
        const c = getCategory(item.categoryId);
        return (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <IconCircle icon={c.icon} color={theme.primary} background={theme.primarySoft} size={40} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{c.name}</AppText>
                {item.cost ? <AppText variant="caption">{formatMoney(parseAmount(item.cost), settings.currency)}</AppText> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${c.name}`}
                hitSlop={8}
                onPress={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}>
                <Icon name="close-circle" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/guia/servicio/${c.id}`)}
              style={[styles.explain, { backgroundColor: theme.infoSoft }]}>
              <AppText variant="small" style={styles.flex}>
                💡 {firstSentence(c.what)} <AppText variant="smallStrong" color={theme.info}>¿Por qué se hace?</AppText>
              </AppText>
            </Pressable>
            {item.open ? (
              <View style={styles.itemDetails}>
                <TextField
                  label="Detalle (opcional)"
                  value={item.detail}
                  onChangeText={(t) => updateItem(item.id, { detail: t })}
                  placeholder={item.categoryId === 'aceite' ? 'Ej. Sintético 5W-30, 4 litros' : 'Marca, pieza, especificación…'}
                />
                <NumberField
                  decimal
                  label="Costo de este trabajo (opcional)"
                  value={item.cost}
                  onChangeText={(t) => updateItem(item.id, { cost: t })}
                  prefix={settings.currency}
                  placeholder="0"
                />
                {getCategory(item.categoryId).interval ? (
                  <NumberField
                    label={item.categoryId === 'aceite' ? 'Próximo cambio según la calcomanía (opcional)' : 'El taller dijo que el próximo es a los… (opcional)'}
                    value={item.nextKm}
                    onChangeText={(t) => updateItem(item.id, { nextKm: t })}
                    suffix={unit}
                    hint="Si lo llenas, tu recordatorio usará este dato en lugar del intervalo recomendado."
                  />
                ) : null}
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => updateItem(item.id, { open: true })} style={styles.addDetails}>
                <Icon name="pencil-outline" size={16} color={theme.primary} />
                <AppText variant="smallStrong" color={theme.primary}>
                  {item.detail || item.cost ? 'Editar detalle y costo' : 'Agregar detalle, costo o próximo cambio'}
                </AppText>
              </Pressable>
            )}
          </Card>
        );
      })}
      <Button
        title={items.length === 0 ? 'Elegir trabajos' : 'Agregar otro trabajo'}
        icon="plus"
        variant={items.length === 0 ? 'primary' : 'soft'}
        disabled={!vehicle}
        onPress={() => setPickerOpen(true)}
      />
      {!vehicle ? (
        <AppText variant="caption" center style={styles.error}>
          Primero elige el vehículo.
        </AppText>
      ) : null}
      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <AppText variant="caption">¿También te hicieron…?</AppText>
          <View style={styles.chips}>
            {suggestions.map((c) => (
              <Chip key={c.id} label={c.name} icon="plus" onPress={() => toggleCategory(c.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="¿Quién lo hizo?" />
      <Field label="Taller" hint={workshop ? undefined : 'Elige uno o escribe el nombre de uno nuevo: lo guardamos en tus talleres.'}>
        {recentWorkshops.length > 0 ? (
          <View style={styles.chips}>
            {recentWorkshops.map((w) => (
              <Chip
                key={w.id}
                label={w.name}
                icon="store"
                selected={w.id === workshopId}
                onPress={() => {
                  setWorkshopId(w.id === workshopId ? undefined : w.id);
                  setWorkshopText('');
                }}
              />
            ))}
          </View>
        ) : null}
        {!workshop ? (
          <TextField value={workshopText} onChangeText={setWorkshopText} placeholder="Nombre del taller o agencia" icon="store-outline" />
        ) : null}
      </Field>
      <TextField
        label="Mecánico responsable"
        value={mechanic}
        onChangeText={setMechanic}
        placeholder="¿Quién te atendió o hizo el trabajo?"
        icon="account-wrench"
        hint="Si algo falla después, sabrás a quién reclamar."
      />
      {workshop && workshop.mechanics.length > 0 ? (
        <View style={[styles.chips, styles.mechanicChips]}>
          {workshop.mechanics.map((m) => (
            <Chip key={m} label={m} selected={mechanic === m} onPress={() => setMechanic(mechanic === m ? '' : m)} />
          ))}
        </View>
      ) : null}

      <SectionHeader title="¿Por qué lo llevaste?" />
      <View style={[styles.chips, styles.reasonChips]}>
        {REASONS.map((r) => (
          <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(reason === r ? '' : r)} />
        ))}
      </View>
      <TextField
        label="¿Qué te explicó el mecánico? (opcional)"
        value={diagnosis}
        onChangeText={setDiagnosis}
        multiline
        placeholder="Ej. Las balatas tenían 2 mm y los discos se rectificaron."
        hint="Anotarlo te ayuda a recordar por qué se hizo y a comparar después."
      />

      <SectionHeader title="Costos" />
      <NumberField decimal label="Mano de obra (opcional)" value={labor} onChangeText={setLabor} prefix={settings.currency} placeholder="0" />
      <NumberField
        decimal
        label="Total pagado"
        value={total}
        onChangeText={setTotal}
        prefix={settings.currency}
        placeholder={computedTotal > 0 ? String(computedTotal) : '0'}
        hint={computedTotal > 0 ? `Suma de trabajos + mano de obra: ${formatMoney(computedTotal, settings.currency)}. Déjalo vacío para usar esa suma.` : 'Lo que pagaste en total.'}
      />

      <SectionHeader title="Garantía" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <DateField label="Válida hasta" value={warrantyUntil} onChange={setWarrantyUntil} minimumDate={date} optional placeholder="Sin garantía" />
        </View>
      </View>
      <NumberField label={`O por cuántos ${unit} (opcional)`} value={warrantyKm} onChangeText={setWarrantyKm} suffix={unit} />

      <SectionHeader title="Fotos" />
      <AppText variant="caption" style={styles.photoHint}>
        Factura, piezas cambiadas, el tablero… Te sirven como respaldo para reclamar garantías.
      </AppText>
      <PhotoStrip photos={photos} onChange={setPhotos} />

      <SectionHeader title="¿Cómo te fue?" />
      <Card tone="alt" style={styles.rating}>
        <StarRating value={rating} onChange={setRating} size={34} />
        <AppText variant="caption">Califica el servicio para recordar en qué taller confiar.</AppText>
      </Card>
      <TextField label="Notas" value={notes} onChangeText={setNotes} multiline placeholder="Cualquier otra cosa que quieras recordar." />

      {vehicle ? (
        <CategoryPicker
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          vehicleType={vehicle.type}
          fuel={vehicle.fuel}
          selected={selectedIds}
          onToggle={toggleCategory}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  error: { marginBottom: Spacing.sm },
  itemCard: { marginBottom: Spacing.md, gap: Spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  explain: { borderRadius: Radius.sm, padding: Spacing.sm, flexDirection: 'row' },
  itemDetails: { marginTop: Spacing.sm },
  addDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  suggestions: { gap: Spacing.sm, marginTop: Spacing.md },
  mechanicChips: { marginTop: -Spacing.sm, marginBottom: Spacing.lg },
  reasonChips: { marginBottom: Spacing.lg },
  photoHint: { marginBottom: Spacing.sm },
  rating: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
});
