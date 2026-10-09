import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, TextField } from '@/components/Form';
import { Screen } from '@/components/Screen';
import { Button, InfoBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { DOCUMENT_KIND_ORDER, DOCUMENT_KINDS } from '@/data/documents';
import { useAppData } from '@/hooks/useAppData';
import { addMonths, todayISO } from '@/logic/dates';
import { vehicleTitle } from '@/logic/format';
import { haptic } from '@/services/feedback';
import type { DocumentKind, ISODate, VehicleDocument } from '@/types';

interface Props {
  initial?: VehicleDocument;
  initialVehicleId?: string;
  submitLabel: string;
  onSubmit: (values: Omit<VehicleDocument, 'id'>) => void;
  onDelete?: () => void;
}

export function DocumentForm({ initial, initialVehicleId, submitLabel, onSubmit, onDelete }: Props) {
  const data = useAppData();
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? initialVehicleId ?? data.vehicles[0]?.id);
  const [kind, setKind] = useState<DocumentKind>(initial?.kind ?? 'seguro');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [expiresAt, setExpiresAt] = useState<ISODate | undefined>(initial?.expiresAt ?? addMonths(todayISO(), 12));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    if (!vehicleId || !expiresAt) {
      setError(!vehicleId ? 'Elige el vehículo.' : 'Elige la fecha de vencimiento.');
      haptic('warning');
      return;
    }
    onSubmit({ vehicleId, kind, title: title.trim() || DOCUMENT_KINDS[kind].label, expiresAt, notes: notes.trim() || undefined });
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button title={submitLabel} size="lg" full icon="check" onPress={submit} />
          {onDelete ? <Button title="Eliminar" variant="danger" icon="delete-outline" onPress={onDelete} /> : null}
        </View>
      }>
      {data.vehicles.length > 1 ? (
        <Field label="Vehículo" error={!vehicleId ? error : undefined}>
          <View style={styles.chips}>
            {data.vehicles.map((v) => (
              <Chip key={v.id} label={v.nickname || vehicleTitle(v)} color={v.color} selected={v.id === vehicleId} onPress={() => setVehicleId(v.id)} />
            ))}
          </View>
        </Field>
      ) : null}
      <Field label="¿Qué es?" hint={DOCUMENT_KINDS[kind].hint}>
        <View style={styles.chips}>
          {DOCUMENT_KIND_ORDER.map((k) => (
            <Chip key={k} label={DOCUMENT_KINDS[k].label} emoji={DOCUMENT_KINDS[k].emoji} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      </Field>
      <TextField label="Nombre (opcional)" value={title} onChangeText={setTitle} placeholder={DOCUMENT_KINDS[kind].label} hint="Ej. «Seguro amplio» o «Verificación 2.º semestre»." />
      <DateField label="Fecha de vencimiento" value={expiresAt} onChange={setExpiresAt} />
      <TextField label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline placeholder="Número de póliza, teléfono de la aseguradora…" />
      <InfoBox icon="bell-ring-outline" tone="primary" text="Te avisaremos 30 días antes, 7 días antes y el día que vence." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: { gap: Spacing.sm },
});
