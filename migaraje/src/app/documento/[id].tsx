import { useLocalSearchParams } from 'expo-router';

import { DocumentForm } from '@/components/forms/DocumentForm';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { confirm, toast } from '@/services/feedback';
import { useStore } from '@/store';
import { goBack } from '@/services/navigation';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = useStore((s) => s.documents.find((d) => d.id === id));
  const updateDocument = useStore((s) => s.updateDocument);
  const removeDocument = useStore((s) => s.removeDocument);

  if (!doc) {
    return (
      <Screen>
        <EmptyState emoji="🤷" title="No encontramos este documento" text="Quizá fue eliminado." />
      </Screen>
    );
  }

  return (
    <DocumentForm
      initial={doc}
      submitLabel="Guardar cambios"
      onSubmit={(values) => {
        updateDocument(doc.id, values);
        toast('Cambios guardados');
        goBack();
      }}
      onDelete={async () => {
        if (await confirm('¿Eliminar este documento?', 'Ya no recibirás avisos de su vencimiento.', 'Eliminar', true)) {
          removeDocument(doc.id);
          goBack();
        }
      }}
    />
  );
}
