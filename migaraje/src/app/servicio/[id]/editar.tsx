import { useLocalSearchParams } from 'expo-router';

import { ServiceForm } from '@/components/forms/ServiceForm';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { toast } from '@/services/feedback';
import { deletePhotos } from '@/services/photos';
import { useStore } from '@/store';
import { saveService } from '@/store/actions';
import { goBack } from '@/services/navigation';

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const service = useStore((s) => s.services.find((x) => x.id === id));

  if (!service) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este servicio" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  return (
    <ServiceForm
      initial={service}
      submitLabel="Guardar cambios"
      onSubmit={(values) => {
        saveService(values, service.id);
        deletePhotos(service.photos.filter((p) => !values.photos.includes(p)));
        toast('Cambios guardados');
        goBack();
      }}
    />
  );
}
