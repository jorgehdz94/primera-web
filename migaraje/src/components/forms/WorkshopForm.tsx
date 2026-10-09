import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Field, TextField } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';
import type { Workshop } from '@/types';

interface Props {
  initial?: Workshop;
  submitLabel: string;
  onSubmit: (values: Omit<Workshop, 'id' | 'createdAt'>) => void;
}

export function WorkshopForm({ initial, submitLabel, onSubmit }: Props) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [mechanics, setMechanics] = useState<string[]>(initial?.mechanics ?? []);
  const [newMechanic, setNewMechanic] = useState('');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | undefined>();

  const addMechanic = () => {
    const m = newMechanic.trim();
    if (!m || mechanics.some((x) => x.toLowerCase() === m.toLowerCase())) return;
    setMechanics([...mechanics, m]);
    setNewMechanic('');
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Escribe el nombre del taller.');
      haptic('warning');
      return;
    }
    const pending = newMechanic.trim();
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      mechanics: pending && !mechanics.includes(pending) ? [...mechanics, pending] : mechanics,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Screen footer={<Button title={submitLabel} size="lg" full icon="check" onPress={submit} />}>
      <TextField label="Nombre del taller" value={name} onChangeText={(t) => { setName(t); setError(undefined); }} placeholder="Ej. Taller Mecánico López" icon="store-outline" error={error} />
      <TextField label="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="55 1234 5678" icon="phone-outline" />
      <TextField label="Dirección (opcional)" value={address} onChangeText={setAddress} placeholder="Calle, número, colonia" icon="map-marker-outline" />

      <Field label="Mecánicos" hint="Así podrás elegir rápido quién fue el responsable de cada trabajo.">
        {mechanics.length > 0 ? (
          <View style={styles.list}>
            {mechanics.map((m) => (
              <View key={m} style={[styles.mechanic, { backgroundColor: theme.cardAlt }]}>
                <Icon name="account-wrench" size={18} color={theme.textMuted} />
                <AppText style={styles.flex}>{m}</AppText>
                <Pressable accessibilityLabel={`Quitar ${m}`} hitSlop={8} onPress={() => setMechanics(mechanics.filter((x) => x !== m))}>
                  <Icon name="close" size={18} color={theme.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.addRow}>
          <View style={styles.flex}>
            <TextField value={newMechanic} onChangeText={setNewMechanic} placeholder="Nombre del mecánico" onSubmitEditing={addMechanic} returnKeyType="done" />
          </View>
          <Button title="Agregar" variant="soft" onPress={addMechanic} style={styles.addButton} />
        </View>
      </Field>

      <TextField label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline placeholder="Horario, especialidad, si dan garantía…" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: Spacing.sm },
  mechanic: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  addRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginBottom: -Spacing.lg },
  addButton: { height: 48 },
});
