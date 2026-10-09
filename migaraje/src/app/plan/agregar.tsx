import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Card, EmptyState, ListRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { categoriesFor } from '@/data/categories';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';
import { intervalText, recommendedIntervalFor } from '@/logic/maintenance';
import { haptic } from '@/services/feedback';
import { useStore } from '@/store';

export default function AddPlanScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const theme = useTheme();
  const data = useAppData();
  const addPlan = useStore((s) => s.addPlan);
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este vehículo" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  const active = new Set(data.plans.filter((p) => p.vehicleId === vehicle.id && p.enabled).map((p) => p.categoryId));
  const options = categoriesFor(vehicle.type, vehicle.fuel).filter((c) => !active.has(c.id) && c.id !== 'otro');
  const unit = data.settings.distanceUnit;

  return (
    <Screen>
      <AppText muted style={styles.intro}>
        Elige qué más quieres que te recordemos. Después puedes ajustar cada cuándo.
      </AppText>
      <Card padded={false} style={styles.card}>
        {options.map((c, i) => {
          const rec = recommendedIntervalFor(c.id, vehicle, unit);
          return (
            <View key={c.id} style={i > 0 ? [styles.separator, { borderTopColor: theme.border }] : undefined}>
              <ListRow
                title={c.planLabel ?? c.name}
                subtitle={rec ? intervalText({ intervalKm: rec.km, intervalMonths: rec.months }, unit) : 'Sin intervalo fijo: cada año por defecto'}
                icon={c.icon}
                onPress={() => {
                  const id = addPlan(vehicle.id, c.id);
                  haptic('success');
                  router.replace(`/plan/${id}`);
                }}
              />
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Spacing.lg },
  card: { paddingHorizontal: Spacing.lg },
  separator: { borderTopWidth: StyleSheet.hairlineWidth },
});
