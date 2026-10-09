import { useLocalSearchParams } from 'expo-router';

import { WorkshopForm } from '@/components/forms/WorkshopForm';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { toast } from '@/services/feedback';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function EditWorkshopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workshop = useStore((s) => s.workshops.find((w) => w.id === id));
  const updateWorkshop = useStore((s) => s.updateWorkshop);

  if (!workshop) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este taller" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  return (
    <WorkshopForm
      initial={workshop}
      submitLabel="Guardar cambios"
      onSubmit={(values) => {
        updateWorkshop(workshop.id, values);
        toast('Cambios guardados');
        goBack();
      }}
    />
  );
}
