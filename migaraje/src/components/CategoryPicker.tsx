import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { categoriesFor, GROUP_LABELS, type CategoryGroup, type ServiceCategory } from '@/data/categories';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/services/feedback';
import type { FuelType, VehicleType } from '@/types';

import { AppText } from './AppText';
import { TextField } from './Form';
import { Icon } from './Icon';
import { Button } from './ui';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface Props {
  visible: boolean;
  onClose: () => void;
  vehicleType: VehicleType;
  fuel?: FuelType;
  selected: string[];
  onToggle: (categoryId: string) => void;
}

/** Hoja para elegir los trabajos que se hicieron, agrupados y con buscador. */
export function CategoryPicker({ visible, onClose, vehicleType, fuel, selected, onToggle }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const list = categoriesFor(vehicleType, fuel).filter(
      (c) => !q || normalize(c.name).includes(q) || normalize(c.what).includes(q),
    );
    const map = new Map<CategoryGroup, ServiceCategory[]>();
    for (const c of list) map.set(c.group, [...(map.get(c.group) ?? []), c]);
    return [...map.entries()];
  }, [query, vehicleType, fuel]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}>
      <View style={[styles.root, { backgroundColor: theme.background, paddingTop: Spacing.lg }]}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <AppText variant="title" style={styles.flex}>
              ¿Qué le hicieron?
            </AppText>
            <Button title="Listo" size="sm" onPress={onClose} />
          </View>
          <AppText muted style={styles.sub}>
            Elige todos los trabajos de esta visita. Puedes buscar por nombre.
          </AppText>
          <TextField value={query} onChangeText={setQuery} placeholder="Buscar: aceite, frenos, batería…" icon="magnify" autoCorrect={false} />
        </View>
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xxl }]} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            {groups.length === 0 ? (
              <AppText muted center>
                No encontramos ese trabajo. Usa «Otro trabajo» y descríbelo en el detalle.
              </AppText>
            ) : null}
            {groups.map(([group, cats]) => (
              <View key={group} style={styles.group}>
                <AppText variant="overline" style={styles.groupTitle}>
                  {GROUP_LABELS[group]}
                </AppText>
                <View style={styles.grid}>
                  {cats.map((c) => {
                    const isSelected = selected.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => {
                          haptic('selection');
                          onToggle(c.id);
                        }}
                        style={({ pressed }) => [
                          styles.tile,
                          {
                            backgroundColor: isSelected ? theme.primarySoft : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <Icon name={c.icon} size={26} color={isSelected ? theme.primary : theme.textMuted} />
                        <AppText variant="smallStrong" center numberOfLines={3}>
                          {c.name}
                        </AppText>
                        {isSelected ? (
                          <View style={[styles.check, { backgroundColor: theme.primary }]}>
                            <Icon name="check-bold" size={12} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  sub: { marginTop: 4, marginBottom: Spacing.md },
  list: { paddingTop: Spacing.sm },
  group: { marginBottom: Spacing.lg },
  groupTitle: { marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '31.8%',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
