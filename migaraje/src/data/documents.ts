import type { IconName } from '@/components/Icon';
import type { DocumentKind } from '@/types';

export const DOCUMENT_KINDS: Record<DocumentKind, { label: string; emoji: string; icon: IconName; hint: string }> = {
  seguro: { label: 'Seguro', emoji: '🛡️', icon: 'shield-car', hint: 'Póliza de seguro del vehículo.' },
  verificacion: {
    label: 'Verificación / revisión técnica',
    emoji: '🧪',
    icon: 'clipboard-check',
    hint: 'Verificación de emisiones o revisión técnico-mecánica, según tu ciudad.',
  },
  tenencia: { label: 'Tenencia / impuesto vehicular', emoji: '🧾', icon: 'cash', hint: 'Pago anual de impuestos o derechos del vehículo.' },
  licencia: { label: 'Licencia de conducir', emoji: '🪪', icon: 'card-account-details', hint: 'Tu licencia o la de quien maneja el vehículo.' },
  tarjeta: { label: 'Tarjeta de circulación', emoji: '📄', icon: 'file-document-outline', hint: 'Documento de registro del vehículo.' },
  otro: { label: 'Otro', emoji: '📌', icon: 'calendar-alert', hint: 'Cualquier otra fecha importante.' },
};

export const DOCUMENT_KIND_ORDER: DocumentKind[] = ['seguro', 'verificacion', 'tenencia', 'licencia', 'tarjeta', 'otro'];
