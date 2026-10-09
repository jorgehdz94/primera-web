import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ServiceCard, workshopLabel } from '@/components/domain';
import { Chip, TextField } from '@/components/Form';
import { Screen, TabHeader } from '@/components/Screen';
import { Card, EmptyState, IconButton, StatBox } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getCategory } from '@/data/categories';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { formatMonthYear } from '@/logic/dates';
import { formatMoney, plural } from '@/logic/format';
import { sortServicesDesc } from '@/logic/overview';
import { spendingStats } from '@/logic/stats';
import type { ServiceRecord } from '@/types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function LogScreen() {
  const theme = useTheme();
  const data = useAppData();
  const [vehicleId, setVehicleId] = useState<string | 'todos'>('todos');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return sortServicesDesc(data.services).filter((s) => {
      if (vehicleId !== 'todos' && s.vehicleId !== vehicleId) return false;
      if (!q) return true;
      const haystack = normalize(
        [
          ...s.items.map((i) => `${getCategory(i.categoryId).name} ${i.detail ?? ''}`),
          workshopLabel(s, data.workshops) ?? '',
          s.mechanic ?? '',
          s.reason ?? '',
          s.diagnosis ?? '',
          s.notes ?? '',
        ].join(' '),
      );
      return haystack.includes(q);
    });
  }, [data.services, data.workshops, vehicleId, query]);

  const stats = spendingStats(filtered);
  const groups = useMemo(() => {
    const map = new Map<string, ServiceRecord[]>();
    for (const s of filtered) {
      const key = s.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [filtered]);

  const vehicleById = (id: string) => data.vehicles.find((v) => v.id === id);

  return (
    <Screen safeTop>
      <TabHeader
        subtitle="Historial"
        title="Bitácora"
        right={<IconButton icon="plus" label="Registrar servicio" onPress={() => router.push('/servicio/nuevo')} color="#FFFFFF" background={theme.primary} size={44} />}
      />

      {data.services.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📒"
            title="Aquí verás todo lo que le hacen a tus vehículos"
            text="Cada visita al taller queda registrada: qué le hicieron, cuándo, quién fue el responsable y cuánto costó."
            action="Registrar el primero"
            onAction={() => router.push('/servicio/nuevo')}
          />
        </Card>
      ) : (
        <>
          <TextField value={query} onChangeText={setQuery} placeholder="Buscar trabajo, taller, mecánico…" icon="magnify" autoCorrect={false} />
          {data.vehicles.length > 1 ? (
            <View style={styles.chips}>
              <Chip label="Todos" selected={vehicleId === 'todos'} onPress={() => setVehicleId('todos')} />
              {data.vehicles.map((v) => (
                <Chip
                  key={v.id}
                  label={v.nickname || v.model}
                  icon={v.type === 'moto' ? 'motorbike' : 'car-side'}
                  color={v.color}
                  selected={vehicleId === v.id}
                  onPress={() => setVehicleId(v.id)}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.stats}>
            <StatBox label="Servicios" value={String(stats.count)} />
            <StatBox label="Total invertido" value={formatMoney(stats.total, data.settings.currency)} />
            <StatBox label="Este año" value={formatMoney(stats.thisYear, data.settings.currency)} />
          </View>

          {filtered.length === 0 ? (
            <AppText muted center style={styles.none}>
              No hay servicios que coincidan con la búsqueda.
            </AppText>
          ) : null}

          {groups.map(([month, services]) => (
            <View key={month}>
              <View style={styles.monthRow}>
                <AppText variant="overline" style={styles.flex}>
                  {formatMonthYear(`${month}-01`)}
                </AppText>
                <AppText variant="caption">{plural(services.length, 'visita')}</AppText>
              </View>
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  vehicle={vehicleById(s.vehicleId)}
                  workshops={data.workshops}
                  showVehicle={data.vehicles.length > 1 && vehicleId === 'todos'}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  stats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  flex: { flex: 1 },
  none: { marginVertical: Spacing.xl },
});
