import type { Tone } from '@/components/ui';
import type { VehicleType } from '@/types';

export type Urgency = 'alta' | 'media' | 'baja';

export const URGENCY_INFO: Record<Urgency, { label: string; text: string }> = {
  alta: { label: 'Urgente', text: 'No lo dejes pasar: puede ser peligroso o salir muy caro.' },
  media: { label: 'Pronto', text: 'Llévalo a revisar en los próximos días.' },
  baja: { label: 'Sin prisa', text: 'Revísalo en tu próximo servicio.' },
};

export const URGENCY_TONE: Record<Urgency, Tone> = { alta: 'danger', media: 'warning', baja: 'success' };

export interface Symptom {
  id: string;
  title: string;
  emoji: string;
  appliesTo: VehicleType[];
  urgency: Urgency;
  description: string;
  causes: { text: string; categoryId?: string }[];
  checkYourself: string[];
  askMechanic: string[];
}

export const SYMPTOMS: Symptom[] = [
  {
    id: 'chilla_frenar',
    title: 'Chilla o rechina al frenar',
    emoji: '🛑',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description:
      'Un chillido agudo al frenar suele ser el "testigo" de desgaste de las pastillas avisando. Un ruido metálico grave (como de molido) es más serio.',
    causes: [
      { text: 'Pastillas (balatas) gastadas', categoryId: 'frenos' },
      { text: 'Discos rayados o con escalón', categoryId: 'discos' },
      { text: 'Polvo o humedad (si solo pasa en la mañana y se quita, puede ser normal)' },
    ],
    checkYourself: [
      '¿Pasa siempre o solo las primeras frenadas del día?',
      'Mira por los rayos del rin: ¿el disco tiene surcos profundos?',
    ],
    askMechanic: ['¿Cuántos milímetros les quedan a las pastillas?', '¿Los discos están dentro de la medida?'],
  },
  {
    id: 'pedal_esponjoso',
    title: 'El pedal de freno está esponjoso o se va al fondo',
    emoji: '⚠️',
    appliesTo: ['carro', 'moto'],
    urgency: 'alta',
    description: 'Indica aire o humedad en el líquido de frenos, una fuga o una falla en la bomba de frenos. Es un tema de seguridad.',
    causes: [
      { text: 'Líquido de frenos viejo o con aire', categoryId: 'liquido_frenos' },
      { text: 'Fuga en mangueras o calipers', categoryId: 'frenos' },
      { text: 'Falla de la bomba (cilindro maestro)', categoryId: 'frenos' },
    ],
    checkYourself: ['Revisa el nivel del depósito del líquido de frenos.', 'Busca manchas aceitosas cerca de las ruedas.'],
    askMechanic: ['¿Dónde está la fuga?', '¿Purgaron todo el sistema?'],
  },
  {
    id: 'volante_vibra',
    title: 'El volante vibra',
    emoji: '〰️',
    appliesTo: ['carro'],
    urgency: 'media',
    description:
      'Si vibra a cierta velocidad (80-110 km/h) suele ser balanceo. Si vibra solo al frenar, suelen ser los discos.',
    causes: [
      { text: 'Llantas desbalanceadas', categoryId: 'alineacion' },
      { text: 'Discos de freno deformados (vibra al frenar)', categoryId: 'discos' },
      { text: 'Llanta dañada (chipote) o rin doblado', categoryId: 'llantas' },
      { text: 'Piezas de suspensión gastadas', categoryId: 'suspension' },
    ],
    checkYourself: ['¿A qué velocidad empieza y termina la vibración?', '¿Vibra solo al frenar?', 'Revisa las llantas por bolas o chipotes.'],
    askMechanic: ['¿Revisaron balanceo y estado de rines?', '¿Los discos tienen alabeo?'],
  },
  {
    id: 'se_jala',
    title: 'Se jala hacia un lado',
    emoji: '↗️',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description: 'El vehículo se va hacia un lado en una recta o al frenar.',
    causes: [
      { text: 'Presión desigual en las llantas', categoryId: 'llantas' },
      { text: 'Alineación desajustada', categoryId: 'alineacion' },
      { text: 'Un freno que se queda pegado (se jala al frenar)', categoryId: 'frenos' },
      { text: 'Piezas de suspensión o dirección dañadas', categoryId: 'suspension' },
    ],
    checkYourself: ['Revisa la presión de todas las llantas.', '¿Se jala siempre o solo al frenar?'],
    askMechanic: ['¿Me das la hoja de alineación?', '¿Revisaron que los calipers no estén pegados?'],
  },
  {
    id: 'humo',
    title: 'Sale humo del escape',
    emoji: '💨',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description:
      'El color del humo da pistas. Blanco ligero en una mañana fría es condensación normal. Blanco abundante y con olor dulce, azul o negro no son normales.',
    causes: [
      { text: 'Humo AZUL: el motor quema aceite (anillos, sellos de válvula o turbo)', categoryId: 'aceite' },
      { text: 'Humo NEGRO: exceso de combustible (filtro de aire, inyectores, sensores)', categoryId: 'inyectores' },
      { text: 'Humo BLANCO abundante y dulce: entra anticongelante al motor (junta de cabeza)', categoryId: 'refrigerante' },
    ],
    checkYourself: ['¿De qué color es el humo?', '¿Baja el nivel de aceite o de anticongelante entre revisiones?'],
    askMechanic: ['¿Hicieron prueba de compresión?', '¿Revisaron fugas de anticongelante?'],
  },
  {
    id: 'se_calienta',
    title: 'Se calienta el motor',
    emoji: '🌡️',
    appliesTo: ['carro', 'moto'],
    urgency: 'alta',
    description: 'La aguja de temperatura sube más de lo normal o sale vapor del cofre. Seguir manejando puede dañar seriamente el motor.',
    causes: [
      { text: 'Nivel bajo de anticongelante o fuga', categoryId: 'refrigerante' },
      { text: 'Ventilador del radiador que no prende', categoryId: 'electrico' },
      { text: 'Termostato o bomba de agua dañados', categoryId: 'refrigerante' },
      { text: 'Radiador tapado', categoryId: 'refrigerante' },
    ],
    checkYourself: [
      'Oríllate y apaga el motor. No abras el radiador en caliente.',
      'Con el motor frío, revisa el nivel del depósito.',
      'Busca charcos verdes, rosas o naranjas.',
    ],
    askMechanic: ['¿Hicieron prueba de presión al sistema?', '¿Revisaron que el ventilador encienda?'],
  },
  {
    id: 'no_arranca',
    title: 'No arranca o solo hace "clic"',
    emoji: '🔇',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description:
      'Si hace clic o gira muy lento, casi siempre es batería. Si gira normal pero no enciende, es falta de combustible o chispa.',
    causes: [
      { text: 'Batería descargada o terminales sulfatadas', categoryId: 'bateria' },
      { text: 'Motor de arranque (marcha) dañado', categoryId: 'electrico' },
      { text: 'Falla de combustible (bomba, filtro) o de chispa', categoryId: 'filtro_combustible' },
      { text: 'Banda de distribución rota (gira "suelto" y no enciende)', categoryId: 'distribucion' },
    ],
    checkYourself: ['¿Las luces del tablero encienden fuerte?', '¿Los bornes de la batería tienen polvo blanco o verde?', '¿Tiene gasolina?'],
    askMechanic: ['¿Qué voltaje tiene la batería?', '¿La falla es la batería, la marcha o el alternador?'],
  },
  {
    id: 'check_engine',
    title: 'Se encendió el Check Engine',
    emoji: '🟡',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description:
      'La computadora detectó una falla. Si la luz parpadea, es urgente (fallas de encendido que dañan el catalizador).',
    causes: [
      { text: 'Tapón de gasolina flojo o dañado' },
      { text: 'Bujías o bobinas fallando', categoryId: 'bujias' },
      { text: 'Sensor de oxígeno o catalizador', categoryId: 'escape' },
      { text: 'Fugas de vacío o problemas de inyección', categoryId: 'inyectores' },
    ],
    checkYourself: ['Aprieta bien el tapón de gasolina hasta que truene.', '¿La luz está fija o parpadea?'],
    askMechanic: ['¿Qué código salió en el escáner?', '¿Qué pruebas hicieron para confirmar la pieza?'],
  },
  {
    id: 'olor_quemado',
    title: 'Huele a quemado',
    emoji: '🔥',
    appliesTo: ['carro', 'moto'],
    urgency: 'alta',
    description: 'El tipo de olor ayuda: aceite quemado, plástico o cable quemado, o el olor del clutch o los frenos sobrecalentados.',
    causes: [
      { text: 'Fuga de aceite cayendo sobre el escape', categoryId: 'aceite' },
      { text: 'Clutch patinando (olor fuerte en subidas)', categoryId: 'embrague' },
      { text: 'Frenos sobrecalentados o freno de mano puesto', categoryId: 'frenos' },
      { text: 'Corto circuito (olor a plástico)', categoryId: 'electrico' },
    ],
    checkYourself: ['¿Ves humo saliendo del cofre?', '¿Llevas el freno de mano puesto?'],
    askMechanic: ['¿De dónde viene la fuga o el olor?'],
  },
  {
    id: 'mancha',
    title: 'Hay una mancha debajo del vehículo',
    emoji: '💧',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description: 'El color del líquido te dice qué es. Usa el "Detector de fugas" en la sección Aprende.',
    causes: [
      { text: 'Aceite de motor (café oscuro)', categoryId: 'aceite' },
      { text: 'Anticongelante (verde, rosa o naranja)', categoryId: 'refrigerante' },
      { text: 'Líquido de transmisión o dirección (rojo)', categoryId: 'transmision' },
      { text: 'Agua del aire acondicionado (transparente: normal)' },
    ],
    checkYourself: ['Pon un cartón blanco debajo toda la noche para ver el color y el lugar.'],
    askMechanic: ['¿Qué empaque o manguera está fallando?'],
  },
  {
    id: 'golpeteo_topes',
    title: 'Golpeteo al pasar topes o baches',
    emoji: '🔨',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description: 'Ruidos secos o "tronidos" en la suspensión al pasar irregularidades.',
    causes: [
      { text: 'Amortiguadores gastados', categoryId: 'suspension' },
      { text: 'Bujes, rótulas o tornillería floja', categoryId: 'suspension' },
      { text: 'Terminales de dirección', categoryId: 'direccion' },
    ],
    checkYourself: ['Empuja con fuerza una esquina del carro y suelta: si rebota más de una vez, los amortiguadores están cansados.'],
    askMechanic: ['¿Qué pieza exactamente y me la pueden enseñar?', '¿Es urgente o puede esperar?'],
  },
  {
    id: 'truena_girar',
    title: 'Truena al dar vuelta',
    emoji: '🔄',
    appliesTo: ['carro'],
    urgency: 'media',
    description: 'Un "tac-tac-tac" al girar todo el volante y acelerar suele ser la junta homocinética (flecha).',
    causes: [
      { text: 'Junta homocinética (flecha) desgastada', categoryId: 'suspension' },
      { text: 'Terminales o cremallera de dirección', categoryId: 'direccion' },
    ],
    checkYourself: ['En un estacionamiento vacío, gira todo el volante y avanza despacio: ¿de qué lado suena?', 'Revisa si el guardapolvo (hule) de la flecha está roto.'],
    askMechanic: ['¿Es la homocinética interna o externa?', '¿Basta con cambiar el guardapolvo?'],
  },
  {
    id: 'clutch_patina',
    title: 'Acelero y no avanza igual (patina)',
    emoji: '🐢',
    appliesTo: ['carro', 'moto'],
    urgency: 'media',
    description: 'Las revoluciones suben pero la velocidad no. En estándar suele ser el clutch; en automático, la transmisión.',
    causes: [
      { text: 'Disco de clutch gastado', categoryId: 'embrague' },
      { text: 'Aceite de transmisión bajo o degradado', categoryId: 'transmision' },
    ],
    checkYourself: ['¿Pasa más en subidas o con el vehículo cargado?'],
    askMechanic: ['¿Es el clutch o la transmisión?', '¿Revisaron el nivel y estado del aceite de la caja?'],
  },
  {
    id: 'consumo_alto',
    title: 'Gasta más combustible que antes',
    emoji: '⛽',
    appliesTo: ['carro', 'moto'],
    urgency: 'baja',
    description: 'Un aumento de consumo suele ser la suma de varias cosas pequeñas.',
    causes: [
      { text: 'Llantas con poca presión', categoryId: 'llantas' },
      { text: 'Filtro de aire sucio', categoryId: 'filtro_aire' },
      { text: 'Bujías desgastadas', categoryId: 'bujias' },
      { text: 'Inyectores sucios', categoryId: 'inyectores' },
      { text: 'Frenos que se quedan pegados', categoryId: 'frenos' },
    ],
    checkYourself: ['Revisa la presión de las llantas.', 'Mide el rendimiento: llena el tanque, anota los km y vuelve a llenar.'],
    askMechanic: ['¿Escanearon sensores (oxígeno, MAF)?'],
  },
  {
    id: 'tiembla',
    title: 'El motor tiembla en marcha mínima',
    emoji: '📳',
    appliesTo: ['carro', 'moto'],
    urgency: 'baja',
    description: 'Detenido en un semáforo, el motor vibra de más o las revoluciones suben y bajan.',
    causes: [
      { text: 'Bujías o bobinas', categoryId: 'bujias' },
      { text: 'Cuerpo de aceleración o inyectores sucios', categoryId: 'inyectores' },
      { text: 'Soportes de motor dañados', categoryId: 'suspension' },
      { text: 'Carburador sucio (motos o carros antiguos)', categoryId: 'carburador' },
    ],
    checkYourself: ['¿Hay alguna luz encendida en el tablero?'],
    askMechanic: ['¿Qué códigos marca el escáner?', '¿Revisaron los soportes de motor?'],
  },
  {
    id: 'ac_no_enfria',
    title: 'El aire acondicionado no enfría',
    emoji: '🥵',
    appliesTo: ['carro'],
    urgency: 'baja',
    description: 'Sale aire pero no frío, o enfría poco.',
    causes: [
      { text: 'Falta de gas por fuga', categoryId: 'aire_acondicionado' },
      { text: 'Filtro de cabina tapado (sale poco aire)', categoryId: 'filtro_cabina' },
      { text: 'Compresor o ventilador del condensador dañado', categoryId: 'aire_acondicionado' },
    ],
    checkYourself: ['¿Sale con fuerza el aire?', '¿Escuchas un "clic" del compresor al prender el aire?'],
    askMechanic: ['¿Hay fuga? ¿Dónde?', '¿Qué presión tenía?'],
  },
  {
    id: 'cadena_ruido',
    title: 'La cadena de la moto hace ruido',
    emoji: '⛓️',
    appliesTo: ['moto'],
    urgency: 'media',
    description: 'Cascabeleo o golpeteo metálico que viene de la cadena.',
    causes: [
      { text: 'Cadena seca o sin tensión', categoryId: 'cadena_moto' },
      { text: 'Kit de arrastre gastado', categoryId: 'kit_arrastre' },
    ],
    checkYourself: ['Mide la holgura de la cadena.', 'Mira los dientes de la corona: ¿están puntiagudos o en forma de ola?'],
    askMechanic: ['¿Alcanza con tensar y lubricar o hay que cambiar el kit?'],
  },
  {
    id: 'moto_se_apaga',
    title: 'La moto se apaga o cuesta arrancarla',
    emoji: '🏍️',
    appliesTo: ['moto'],
    urgency: 'media',
    description: 'Se apaga en marcha mínima, al frenar, o tarda mucho en encender.',
    causes: [
      { text: 'Bujía desgastada', categoryId: 'bujias' },
      { text: 'Carburador o inyección sucios', categoryId: 'carburador' },
      { text: 'Filtro de aire tapado', categoryId: 'filtro_aire' },
      { text: 'Batería débil', categoryId: 'bateria' },
      { text: 'Válvulas descalibradas', categoryId: 'valvulas' },
    ],
    checkYourself: ['¿Cuándo fue la última vez que cambiaste bujía y filtro?'],
    askMechanic: ['¿Ajustaron la marcha mínima?', '¿Cómo venía la bujía?'],
  },
];

export function getSymptom(id: string): Symptom | undefined {
  return SYMPTOMS.find((s) => s.id === id);
}
