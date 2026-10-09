import { useLocalSearchParams } from 'expo-router';

import { DocumentForm } from '@/components/forms/DocumentForm';
import { haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function NewDocumentScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const addDocument = useStore((s) => s.addDocument);
  return (
    <DocumentForm
      initialVehicleId={vehicleId}
      submitLabel="Guardar"
      onSubmit={(values) => {
        addDocument(values);
        haptic('success');
        toast('Te avisaremos antes de que venza', '📄');
        goBack();
      }}
    />
  );
}
