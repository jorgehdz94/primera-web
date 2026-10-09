import { router } from 'expo-router';

import { WorkshopForm } from '@/components/forms/WorkshopForm';
import { haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';

export default function NewWorkshopScreen() {
  const addWorkshop = useStore((s) => s.addWorkshop);
  return (
    <WorkshopForm
      submitLabel="Guardar taller"
      onSubmit={(values) => {
        const id = addWorkshop(values);
        haptic('success');
        toast('Taller guardado', '🔧');
        router.replace(`/taller/${id}`);
      }}
    />
  );
}
