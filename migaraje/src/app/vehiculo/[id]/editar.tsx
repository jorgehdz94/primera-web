import { useLocalSearchParams } from 'expo-router';

import { VehicleForm } from '@/components/forms/VehicleForm';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { toast } from '@/services/feedback';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useStore((s) => s.vehicles.find((v) => v.id === id));
  const updateVehicle = useStore((s) => s.updateVehicle);

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este vehículo" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  return (
    <VehicleForm
      initial={vehicle}
      submitLabel="Guardar cambios"
      onSubmit={(values) => {
        const { lastOilChange: _ignored, ...patch } = values;
        updateVehicle(vehicle.id, patch);
        toast('Cambios guardados');
        goBack();
      }}
    />
  );
}
