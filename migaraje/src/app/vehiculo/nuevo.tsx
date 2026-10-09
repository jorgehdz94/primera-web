import { router } from 'expo-router';

import { VehicleForm } from '@/components/forms/VehicleForm';
import { todayISO } from '@/logic/dates';
import { haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';

export default function NewVehicleScreen() {
  const addVehicle = useStore((s) => s.addVehicle);
  return (
    <VehicleForm
      submitLabel="Agregar a mi garaje"
      onSubmit={(values) => {
        const id = addVehicle({ ...values, createdAt: todayISO() });
        haptic('success');
        toast(`¡${values.nickname || values.brand || 'Tu vehículo'} ya está en tu garaje!`, '🎉');
        router.replace(`/vehiculo/${id}`);
      }}
    />
  );
}
