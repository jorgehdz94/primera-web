import type { IconName } from '@/components/Icon';

export type LightColor = 'rojo' | 'amarillo' | 'verde' | 'azul';

export interface DashboardLight {
  id: string;
  name: string;
  icon: IconName;
  color: LightColor;
  meaning: string;
  action: string;
  /** ¿Se puede seguir manejando? */
  canDrive: 'no' | 'con_cuidado' | 'si';
  moto?: boolean;
}

export const LIGHT_COLOR_INFO: Record<LightColor, { label: string; text: string }> = {
  rojo: { label: 'Rojo', text: 'Problema serio o de seguridad. Detente en cuanto sea seguro.' },
  amarillo: { label: 'Amarillo / ámbar', text: 'Algo necesita atención pronto. Puedes seguir con cuidado y llevarlo a revisar.' },
  verde: { label: 'Verde', text: 'Informativo: un sistema está encendido y funcionando.' },
  azul: { label: 'Azul', text: 'Informativo: normalmente las luces altas.' },
};

export const LIGHTS: DashboardLight[] = [
  {
    id: 'aceite',
    name: 'Presión de aceite',
    icon: 'oil',
    color: 'rojo',
    meaning: 'El motor no tiene suficiente presión de aceite: puede estar muy bajo de aceite o fallar la bomba.',
    action:
      'Oríllate y apaga el motor lo antes posible. Espera unos minutos y revisa el nivel con la varilla. Si está bajo, rellena; si la luz sigue, no lo manejes: llama a una grúa.',
    canDrive: 'no',
  },
  {
    id: 'temperatura',
    name: 'Temperatura del motor',
    icon: 'coolant-temperature',
    color: 'rojo',
    meaning: 'El motor se está sobrecalentando.',
    action:
      'Oríllate, apaga el aire acondicionado y el motor. NO abras el tapón del radiador en caliente. Cuando enfríe (30 min o más) revisa el nivel del anticongelante y busca fugas.',
    canDrive: 'no',
  },
  {
    id: 'bateria',
    name: 'Batería / sistema de carga',
    icon: 'car-battery',
    color: 'rojo',
    meaning:
      'La batería no se está cargando: casi siempre es el alternador o la banda que lo mueve. Estás funcionando solo con la batería.',
    action:
      'Apaga radio, aire acondicionado y todo lo que no sea indispensable y ve directo a un taller cercano. No apagues el motor hasta llegar: puede que ya no vuelva a arrancar.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'frenos',
    name: 'Frenos',
    icon: 'car-brake-alert',
    color: 'rojo',
    meaning: 'El freno de mano está puesto o el líquido de frenos está bajo (o hay una falla en el sistema).',
    action:
      'Revisa que el freno de mano esté totalmente abajo. Si la luz sigue, revisa el nivel del líquido de frenos. Si el pedal se siente raro, no manejes.',
    canDrive: 'no',
  },
  {
    id: 'freno_mano',
    name: 'Freno de estacionamiento',
    icon: 'car-brake-parking',
    color: 'rojo',
    meaning: 'El freno de mano está activado.',
    action: 'Quítalo antes de avanzar. Manejar con él puesto lo desgasta y lo calienta.',
    canDrive: 'si',
  },
  {
    id: 'check_engine',
    name: 'Check Engine (falla de motor)',
    icon: 'engine-outline',
    color: 'amarillo',
    meaning:
      'La computadora del vehículo detectó una falla en el motor o en el control de emisiones. Puede ser algo simple (tapón de gasolina flojo) o algo más serio.',
    action:
      'Si está fija: revisa el tapón de gasolina y llévalo a escanear pronto. Si PARPADEA: hay fallas de encendido fuertes; baja la velocidad y llévalo al taller cuanto antes, porque puedes dañar el catalizador.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'abs',
    name: 'ABS',
    icon: 'car-brake-abs',
    color: 'amarillo',
    meaning: 'El sistema antibloqueo de frenos tiene una falla. Los frenos normales funcionan, pero las ruedas podrían bloquearse en una frenada fuerte.',
    action: 'Maneja con más distancia y llévalo a revisar.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'airbag',
    name: 'Bolsas de aire',
    icon: 'airbag',
    color: 'rojo',
    meaning: 'Falla en el sistema de bolsas de aire: podrían no abrirse en un choque.',
    action: 'Puedes manejar, pero llévalo a revisar pronto: es un sistema de seguridad.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'tpms',
    name: 'Presión de llantas',
    icon: 'car-tire-alert',
    color: 'amarillo',
    meaning: 'Una o más llantas tienen la presión baja. Si parpadea al encender, puede ser falla de un sensor.',
    action: 'Revisa e infla las llantas a la presión de la etiqueta de la puerta. Busca clavos o daños.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'direccion',
    name: 'Dirección asistida',
    icon: 'steering',
    color: 'amarillo',
    meaning: 'Falla en la asistencia de la dirección: el volante se sentirá muy duro.',
    action: 'Maneja con cuidado y despacio; llévalo a revisar.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'estabilidad',
    name: 'Control de estabilidad / tracción',
    icon: 'car-traction-control',
    color: 'amarillo',
    meaning:
      'Si PARPADEA mientras manejas, el sistema está trabajando porque el piso está resbaloso. Si se queda FIJA, el sistema se apagó o tiene una falla.',
    action: 'Si parpadea, baja la velocidad. Si está fija y no la apagaste tú, llévalo a revisar.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'mantenimiento',
    name: 'Servicio / mantenimiento',
    icon: 'wrench',
    color: 'amarillo',
    meaning: 'Recordatorio de mantenimiento programado (cambio de aceite o servicio).',
    action: 'Agenda tu servicio y regístralo aquí en MiGaraje. El taller la apaga al terminar.',
    canDrive: 'si',
  },
  {
    id: 'precalentamiento',
    name: 'Bujías de precalentamiento (diésel)',
    icon: 'car-defrost-front',
    color: 'amarillo',
    meaning: 'En motores diésel: las bujías de precalentamiento se están calentando para arrancar.',
    action: 'Espera a que se apague antes de dar marcha. Si parpadea con el motor encendido, hay una falla.',
    canDrive: 'si',
  },
  {
    id: 'combustible',
    name: 'Combustible bajo',
    icon: 'gas-station',
    color: 'amarillo',
    meaning: 'Te queda poco combustible (normalmente para 40-80 km).',
    action: 'Carga combustible pronto. Andar seguido en reserva puede dañar la bomba de gasolina.',
    canDrive: 'si',
  },
  {
    id: 'refrigerante_nivel',
    name: 'Nivel de anticongelante',
    icon: 'car-coolant-level',
    color: 'amarillo',
    meaning: 'El nivel de anticongelante está bajo.',
    action: 'Con el motor frío, rellena el depósito con el anticongelante correcto y busca fugas.',
    canDrive: 'con_cuidado',
  },
  {
    id: 'puerta',
    name: 'Puerta abierta',
    icon: 'car-door',
    color: 'rojo',
    meaning: 'Una puerta, la cajuela o el cofre no están bien cerrados.',
    action: 'Detente y ciérralos bien.',
    canDrive: 'si',
  },
  {
    id: 'cinturon',
    name: 'Cinturón de seguridad',
    icon: 'seatbelt',
    color: 'rojo',
    meaning: 'Alguien no se ha puesto el cinturón.',
    action: 'Abróchate. Es lo que más vidas salva en un choque.',
    canDrive: 'si',
  },
  {
    id: 'luces_altas',
    name: 'Luces altas',
    icon: 'car-light-high',
    color: 'azul',
    meaning: 'Tienes las luces altas encendidas.',
    action: 'Bájalas cuando venga alguien de frente o lleves un vehículo adelante.',
    canDrive: 'si',
  },
  {
    id: 'luces',
    name: 'Luces encendidas',
    icon: 'car-light-dimmed',
    color: 'verde',
    meaning: 'Las luces bajas o de posición están encendidas.',
    action: 'Nada que hacer; solo recuerda apagarlas al estacionarte si tu vehículo no lo hace solo.',
    canDrive: 'si',
  },
  {
    id: 'crucero',
    name: 'Control crucero',
    icon: 'car-cruise-control',
    color: 'verde',
    meaning: 'El control de velocidad crucero está activo.',
    action: 'Nada que hacer. Evita usarlo con lluvia o en curvas.',
    canDrive: 'si',
  },
  {
    id: 'neutral',
    name: 'Neutral (moto)',
    icon: 'alpha-n-box',
    color: 'verde',
    meaning: 'La transmisión está en neutral.',
    action: 'Nada que hacer: es solo informativo.',
    canDrive: 'si',
    moto: true,
  },
];
