import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ServiceForm } from '@/components/forms/ServiceForm';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { haptic, toast } from '@/services/feedback';
import { useStore } from '@/store';
import { saveService } from '@/store/actions';
import { useDraftStore } from '@/store/draft';

export default function NewServiceScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string; categoryId?: string; draft?: string }>();
  const hasVehicles = useStore((s) => s.vehicles.length > 0);
  const setServiceDraft = useDraftStore((s) => s.setServiceDraft);
  const [draft] = useState(() => (params.draft === '1' ? useDraftStore.getState().serviceDraft : null));

  if (!hasVehicles) {
    return (
      <Screen>
        <EmptyState
          emoji="🚗"
          title="Primero agrega un vehículo"
          text="Para registrar un servicio necesitamos saber a qué carro o moto se lo hicieron."
          action="Agregar vehículo"
          onAction={() => router.replace('/vehiculo/nuevo')}
        />
      </Screen>
    );
  }

  return (
    <ServiceForm
      draft={draft}
      initialVehicleId={params.vehicleId}
      initialCategoryId={params.categoryId}
      submitLabel="Guardar en la bitácora"
      onSubmit={(values) => {
        const id = saveService(values);
        setServiceDraft(null);
        haptic('success');
        const hasOil = values.items.some((i) => i.categoryId === 'aceite');
        toast(hasOil ? '¡Listo! Te avisaremos del próximo cambio de aceite' : '¡Servicio registrado en tu bitácora!', '🔧');
        router.replace(`/servicio/${id}`);
      }}
    />
  );
}
