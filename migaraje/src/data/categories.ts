import type { IconName } from '@/components/Icon';
import type { FuelType, OilType, VehicleType } from '@/types';

export type CategoryGroup =
  | 'motor'
  | 'filtros'
  | 'frenos'
  | 'llantas'
  | 'suspension'
  | 'electrico'
  | 'fluidos'
  | 'transmision'
  | 'moto'
  | 'confort'
  | 'general';

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  motor: 'Motor',
  filtros: 'Filtros',
  frenos: 'Frenos',
  llantas: 'Llantas y alineación',
  suspension: 'Suspensión y dirección',
  electrico: 'Eléctrico',
  fluidos: 'Líquidos',
  transmision: 'Transmisión y embrague',
  moto: 'Exclusivo de moto',
  confort: 'Confort y carrocería',
  general: 'Revisiones y otros',
};

export interface Interval {
  km?: number;
  months?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  /** Texto corto para los recordatorios, p. ej. "Revisar frenos". */
  planLabel?: string;
  icon: IconName;
  group: CategoryGroup;
  appliesTo: VehicleType[];
  /** Qué es, en palabras sencillas. */
  what: string;
  /** Por qué se hace. */
  why: string;
  /** Señales de que lo necesitas. */
  signs: string[];
  /** Qué pasa si no se hace. */
  ifIgnored: string;
  tips: string[];
  /** Preguntas para hacerle al mecánico. */
  askMechanic: string[];
  interval?: Partial<Record<VehicleType, Interval>>;
  intervalNote?: string;
  /** Si se agrega al plan de mantenimiento de un vehículo nuevo. */
  trackedFor?: VehicleType[];
  /** Trabajos que suelen hacerse en la misma visita. */
  related?: string[];
  /** No aplica a estos tipos de combustible. */
  notFor?: FuelType[];
  /** Explicaciones a fondo. */
  extra?: { title: string; body: string }[];
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'aceite',
    name: 'Cambio de aceite',
    planLabel: 'Cambio de aceite',
    icon: 'oil',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what:
      'Se drena el aceite viejo del motor y se rellena con aceite nuevo del tipo y viscosidad que indica el fabricante (por ejemplo 5W-30). Casi siempre se cambia también el filtro de aceite.',
    why:
      'El aceite lubrica las piezas que se mueven dentro del motor, reduce la fricción, ayuda a enfriarlo y arrastra la suciedad. Con el calor y el uso pierde sus propiedades y se contamina; un aceite gastado protege menos y el motor se desgasta más rápido.',
    signs: [
      'Ya pasaste el kilometraje o el tiempo recomendado.',
      'En la varilla el aceite se ve negro, espeso o huele a quemado.',
      'El nivel está por debajo de la marca mínima.',
      'Se encendió el testigo de aceite o el de mantenimiento (la llave).',
      'El motor suena más de lo normal (golpeteo o "taqueteo").',
    ],
    ifIgnored:
      'El aceite degradado forma lodos que tapan los conductos. El motor se desgasta, se calienta de más y en casos graves se "desviela" o se funde: una de las reparaciones más caras que existen.',
    tips: [
      'Usa la viscosidad y especificación del manual (por ejemplo 5W-30 API SP). No "porque es más espeso protege más".',
      'Revisa el nivel con la varilla cada 2 semanas: motor frío, piso plano.',
      'Tráfico pesado, viajes muy cortos, polvo, calor extremo o remolcar se considera "uso severo": acorta el intervalo.',
      'Pide que te enseñen el aceite y el filtro nuevos (sellados) antes de ponerlos.',
      'En moto revisa además que el aceite sea para moto 4T con embrague húmedo (norma JASO MA/MA2) si tu moto lo requiere.',
    ],
    askMechanic: [
      '¿Qué marca, viscosidad y tipo de aceite pusieron?',
      '¿Cuántos litros lleva mi motor y cuántos pusieron?',
      '¿Cambiaron también el filtro de aceite? ¿De qué marca?',
      '¿Vieron alguna fuga o partículas metálicas en el aceite viejo?',
      '¿Revisaron los demás niveles (frenos, anticongelante, limpiaparabrisas)?',
    ],
    interval: { carro: { km: 10000, months: 12 }, moto: { km: 4000, months: 6 } },
    intervalNote:
      'Depende del tipo de aceite. Como guía: mineral 5,000 km, semisintético 7,500 km y sintético 10,000 km o un año en carros; en motos entre 2,500 y 6,000 km. Manda lo que diga el manual de tu vehículo.',
    trackedFor: ['carro', 'moto'],
    related: ['filtro_aceite', 'filtro_aire', 'filtro_cabina'],
    notFor: ['electrico'],
    extra: [
      {
        title: '¿Qué significa 5W-30?',
        body:
          'Es la viscosidad, qué tan "espeso" es el aceite. El primer número con la W (de Winter, invierno) indica cómo fluye en frío: entre más bajo, mejor protege al arrancar. El segundo número indica qué tan espeso se mantiene a temperatura de trabajo (100 °C). Un 5W-30 fluye en frío mejor que un 20W-50 y es igual de protector en caliente para los motores diseñados para él.',
      },
      {
        title: 'Mineral, semisintético o sintético',
        body:
          'El mineral se refina directo del petróleo: es el más barato y el que menos dura. El sintético se fabrica con bases químicas más puras: resiste mejor el calor, protege más y dura más kilómetros. El semisintético es una mezcla de ambos. Los motores modernos (turbo, inyección directa) normalmente piden sintético.',
      },
      {
        title: '¿Qué es API SP o ILSAC?',
        body:
          'Son certificaciones de calidad impresas en la botella. La letra más avanzada es la más reciente (SP es más nueva que SN). Tu manual indica la mínima que necesitas.',
      },
    ],
  },
  {
    id: 'filtro_aceite',
    name: 'Filtro de aceite',
    icon: 'filter',
    group: 'filtros',
    appliesTo: ['carro', 'moto'],
    what:
      'Cartucho que atrapa partículas de metal, carbón y suciedad del aceite mientras circula por el motor.',
    why:
      'Si el filtro se satura, el aceite circula sin filtrar y desgasta el motor aunque el aceite sea nuevo. Por eso se cambia junto con el aceite.',
    signs: [
      'Toca cambio de aceite.',
      'El filtro está golpeado, oxidado o con fugas.',
    ],
    ifIgnored:
      'Un filtro tapado deja pasar suciedad al motor (se abre una válvula de alivio). Las piezas internas se rayan y se desgastan antes de tiempo.',
    tips: [
      'Un filtro de buena marca cuesta poco comparado con lo que protege.',
      'Al instalarlo se le pone un poco de aceite al empaque y se aprieta a mano, no con fuerza excesiva.',
    ],
    askMechanic: ['¿Qué marca de filtro pusieron?', '¿El empaque del filtro viejo salió completo?'],
    interval: { carro: { km: 10000, months: 12 }, moto: { km: 4000, months: 6 } },
    intervalNote: 'Con cada cambio de aceite.',
    related: ['aceite'],
    notFor: ['electrico'],
  },
  {
    id: 'filtro_aire',
    name: 'Filtro de aire del motor',
    planLabel: 'Cambiar filtro de aire',
    icon: 'air-filter',
    group: 'filtros',
    appliesTo: ['carro', 'moto'],
    what:
      'Filtro (de papel, espuma o algodón) que limpia el aire que entra al motor para quemar el combustible.',
    why:
      'El motor necesita mucho aire limpio. Si el filtro está tapado, el motor "respira" mal: pierde fuerza y gasta más combustible. Si está roto, entra polvo que raya los cilindros.',
    signs: [
      'El filtro se ve gris u oscuro al sacarlo (debería verse casi blanco o del color original).',
      'Pérdida de potencia al acelerar.',
      'Mayor consumo de combustible.',
      'Manejas seguido en terracería o zonas con mucho polvo.',
    ],
    ifIgnored:
      'Más consumo de combustible, menos potencia y, si se rompe, desgaste interno del motor por el polvo.',
    tips: [
      'Es de los mantenimientos más fáciles: en muchos carros se cambia en 5 minutos sin herramienta.',
      'Si manejas en caminos de tierra, revísalo en cada cambio de aceite.',
      'Los de espuma (comunes en motos) se lavan y se vuelven a aceitar.',
    ],
    askMechanic: ['¿Me enseñas cómo estaba el filtro viejo?', '¿Era necesario cambiarlo o solo limpiarlo?'],
    interval: { carro: { km: 15000, months: 12 }, moto: { km: 10000, months: 12 } },
    trackedFor: ['carro', 'moto'],
    notFor: ['electrico'],
  },
  {
    id: 'filtro_cabina',
    name: 'Filtro de cabina (A/C)',
    planLabel: 'Cambiar filtro de cabina',
    icon: 'air-purifier',
    group: 'filtros',
    appliesTo: ['carro'],
    what:
      'También llamado filtro de polen. Limpia el aire que entra al interior del carro por la ventilación y el aire acondicionado.',
    why:
      'Retiene polvo, polen y contaminantes. Sucio, reduce el flujo de aire, provoca malos olores y hace trabajar de más al aire acondicionado.',
    signs: [
      'Sale poco aire por las ventilas aunque el ventilador esté al máximo.',
      'Olor a humedad o a "calcetín" al prender el aire.',
      'Los vidrios se empañan más de lo normal.',
    ],
    ifIgnored: 'Aire de mala calidad dentro del carro, malos olores y más esfuerzo del sistema de ventilación.',
    tips: [
      'Suele estar detrás de la guantera y cambiarlo es sencillo.',
      'Si tienes alergias, existen versiones con carbón activado.',
    ],
    askMechanic: ['¿Lo cambiaron o solo lo sopletearon?'],
    interval: { carro: { km: 15000, months: 12 } },
    trackedFor: ['carro'],
  },
  {
    id: 'filtro_combustible',
    name: 'Filtro de combustible',
    planLabel: 'Cambiar filtro de combustible',
    icon: 'gas-station',
    group: 'filtros',
    appliesTo: ['carro', 'moto'],
    what: 'Filtro que limpia la gasolina o el diésel antes de que llegue a los inyectores o al carburador.',
    why:
      'El combustible puede traer impurezas o agua. El filtro las detiene para proteger la bomba y los inyectores, que son piezas delicadas y caras.',
    signs: [
      'El motor se "jalonea" o pierde fuerza al acelerar o en subidas.',
      'Cuesta arrancar.',
      'En diésel: se encendió el testigo de agua en el combustible.',
    ],
    ifIgnored: 'Inyectores tapados, bomba de combustible forzada y fallas de motor.',
    tips: [
      'En muchos carros modernos el filtro va dentro del tanque y dura muchísimo; revisa tu manual antes de pagar por cambiarlo.',
      'En diésel es mucho más importante y frecuente.',
    ],
    askMechanic: ['¿Mi carro tiene filtro externo o va dentro del tanque?', '¿Qué tan sucio venía?'],
    interval: { carro: { km: 40000, months: 36 }, moto: { km: 20000 } },
    intervalNote: 'Varía mucho entre modelos: en diésel suele ser cada 20,000 km o menos.',
    notFor: ['electrico'],
  },
  {
    id: 'bujias',
    name: 'Bujías',
    planLabel: 'Cambiar bujías',
    icon: 'flash',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what:
      'Piezas que producen la chispa que enciende la mezcla de aire y gasolina dentro de cada cilindro.',
    why:
      'Con el uso su punta se desgasta y la chispa se debilita: el motor falla, tiembla, cuesta arrancarlo y gasta más combustible.',
    signs: [
      'El motor tiembla en marcha mínima o "falla" al acelerar.',
      'Cuesta arrancar, sobre todo en frío.',
      'Mayor consumo de gasolina.',
      'Se encendió el Check Engine (códigos tipo P0300 a P0306).',
    ],
    ifIgnored:
      'Fallas de encendido que dañan el catalizador (pieza cara) y desgaste de las bobinas.',
    tips: [
      'Hay bujías de cobre (duran menos), platino e iridio (pueden durar 60,000 a 100,000 km).',
      'Usa el tipo y la calibración que indica el fabricante.',
      'Los motores diésel no tienen bujías de chispa: tienen "bujías de precalentamiento", que son otra cosa.',
    ],
    askMechanic: [
      '¿Qué marca y tipo de bujías pusieron (cobre, platino, iridio)?',
      '¿Cómo venían las viejas? (su color dice mucho del estado del motor)',
    ],
    interval: { carro: { km: 40000 }, moto: { km: 10000 } },
    intervalNote: 'De cobre: 20,000-30,000 km. De iridio o platino: 60,000-100,000 km.',
    trackedFor: ['carro', 'moto'],
    notFor: ['electrico', 'diesel'],
  },
  {
    id: 'afinacion',
    name: 'Afinación / mantenimiento mayor',
    icon: 'car-wrench',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what:
      'Paquete de mantenimiento que, según el taller, suele incluir cambio de bujías, filtros (aire y combustible), limpieza de inyectores o del cuerpo de aceleración, revisión de cables y escaneo. No significa lo mismo en todos los talleres.',
    why: 'Recupera la eficiencia del motor: mejor arranque, menor consumo y menos emisiones contaminantes.',
    signs: [
      'El motor tiembla o falla.',
      'Consumo de combustible más alto que antes.',
      'Te toca la verificación de emisiones.',
    ],
    ifIgnored: 'El motor pierde rendimiento poco a poco y pueden dañarse piezas más caras como el catalizador.',
    tips: [
      'Pide por escrito QUÉ INCLUYE exactamente la afinación y su precio desglosado.',
      'Registra en la app cada trabajo por separado (bujías, filtros…) para que tus recordatorios sean exactos.',
    ],
    askMechanic: [
      '¿Qué incluye exactamente la afinación?',
      '¿Qué piezas cambiaron y cuáles solo limpiaron?',
      '¿Me puedes dar las piezas viejas?',
    ],
    related: ['bujias', 'filtro_aire', 'filtro_combustible', 'inyectores'],
    notFor: ['electrico'],
  },
  {
    id: 'frenos',
    name: 'Frenos (pastillas / balatas)',
    planLabel: 'Revisar frenos',
    icon: 'car-brake-alert',
    group: 'frenos',
    appliesTo: ['carro', 'moto'],
    what:
      'Revisión o cambio de las pastillas (también llamadas balatas) o zapatas: las piezas con material de fricción que presionan el disco o tambor para detener el vehículo.',
    why:
      'Se desgastan con cada frenada. Si se acaban, el metal toca el disco: frenas peor y dañas el disco, que cuesta mucho más.',
    signs: [
      'Chillido agudo al frenar (muchas pastillas traen un testigo metálico que chilla a propósito).',
      'Rechinido metálico o sensación de "molido".',
      'El vehículo tarda más en detenerse.',
      'Testigo de frenos encendido.',
      'Vibración en el pedal o en el volante al frenar.',
    ],
    ifIgnored:
      'Frenadas más largas (riesgo de choque) y daño a los discos o tambores. Es un tema de seguridad: no lo pospongas.',
    tips: [
      'Las delanteras se gastan más rápido que las traseras.',
      'Las pastillas se cambian siempre por pares (ambas ruedas del mismo eje).',
      'Después de cambiarlas, frena suave los primeros kilómetros para que "asienten".',
    ],
    askMechanic: [
      '¿Cuánto material les quedaba a las pastillas viejas (en mm o %)?',
      '¿Los discos están bien o hay que rectificarlos o cambiarlos?',
      '¿Qué marca de pastillas pusieron? ¿Cerámicas o semimetálicas?',
      '¿Revisaron el líquido de frenos?',
    ],
    interval: { carro: { km: 10000, months: 12 }, moto: { km: 8000, months: 12 } },
    intervalNote:
      'Revisarlos cada 10,000 km. El cambio depende del desgaste: muchas veces entre 30,000 y 60,000 km en carro.',
    trackedFor: ['carro', 'moto'],
    related: ['discos', 'liquido_frenos'],
  },
  {
    id: 'discos',
    name: 'Discos o tambores de freno',
    icon: 'disc',
    group: 'frenos',
    appliesTo: ['carro', 'moto'],
    what:
      'Rectificar o cambiar los discos (o tambores) de freno: la superficie metálica que gira con la rueda y contra la que presionan las pastillas. Rectificar es "lijarlos" en un torno para dejarlos planos.',
    why:
      'Si se deforman o se desgastan, el pedal o el volante vibran al frenar y la frenada es menos efectiva.',
    signs: [
      'Vibración en el volante o en el pedal al frenar.',
      'Surcos o rayas profundas en el disco.',
      'Un borde (escalón) marcado en la orilla del disco.',
    ],
    ifIgnored: 'Frenadas menos efectivas y desgaste acelerado de pastillas nuevas.',
    tips: [
      'Cada disco tiene un grosor mínimo grabado. Si ya está por debajo, NO se rectifica: se cambia.',
      'No todos los talleres rectifican siempre; en muchos carros modernos se recomienda cambiar.',
    ],
    askMechanic: ['¿Qué grosor tienen los discos y cuál es el mínimo?', '¿Por qué rectificar en lugar de cambiar (o al revés)?'],
    related: ['frenos'],
  },
  {
    id: 'liquido_frenos',
    name: 'Líquido de frenos',
    planLabel: 'Cambiar líquido de frenos',
    icon: 'car-brake-fluid-level',
    group: 'fluidos',
    appliesTo: ['carro', 'moto'],
    what:
      'Cambio (purga) del líquido hidráulico que transmite la fuerza del pedal (o de la palanca, en motos) hasta los frenos.',
    why:
      'Absorbe humedad del ambiente con el tiempo. Eso baja su punto de ebullición: en frenadas fuertes puede hervir y el pedal "se va al fondo". También oxida el sistema por dentro. Por eso se cambia por TIEMPO, aunque manejes poco.',
    signs: [
      'El pedal se siente esponjoso o baja más de lo normal.',
      'El líquido se ve oscuro (nuevo es ámbar claro, casi transparente).',
      'El nivel del depósito bajó (puede ser desgaste de pastillas o una fuga).',
      'Testigo de frenos encendido.',
    ],
    ifIgnored: 'Pérdida de frenado en frenadas largas o fuertes y corrosión de piezas caras como el módulo ABS.',
    tips: [
      'Usa el tipo indicado en la tapa del depósito (DOT 3, DOT 4, DOT 5.1). Nunca mezcles con DOT 5 (silicón).',
      'Es corrosivo para la pintura: si cae, limpia de inmediato.',
    ],
    askMechanic: ['¿Qué tipo de líquido pusieron (DOT 3, DOT 4…)?', '¿Purgaron las cuatro ruedas?'],
    interval: { carro: { months: 24 }, moto: { months: 24 } },
    intervalNote: 'Cada 2 años sin importar el kilometraje.',
    trackedFor: ['carro', 'moto'],
    related: ['frenos'],
  },
  {
    id: 'llantas',
    name: 'Llantas (neumáticos)',
    icon: 'tire',
    group: 'llantas',
    appliesTo: ['carro', 'moto'],
    what:
      'Cambio o reparación de llantas (también llamadas neumáticos o cauchos). Normalmente incluye montaje, válvula nueva y balanceo.',
    why:
      'Son lo único que toca el piso: de ellas depende frenar, dar vuelta y no derrapar con lluvia.',
    signs: [
      'El dibujo llega al indicador de desgaste (TWI) o tiene menos de 1.6 mm. Para lluvia lo ideal es más de 3 mm.',
      'Grietas, "chipotes" o bolas en los costados.',
      'Desgaste disparejo (más en un borde que en el otro).',
      'Tienen más de 5 o 6 años aunque se vean bien.',
      'Pierden aire con frecuencia.',
    ],
    ifIgnored: 'Riesgo de reventón, derrapes con lluvia y frenadas más largas.',
    tips: [
      'Infla a la presión que indica la etiqueta en el marco de la puerta del conductor, NO la máxima escrita en la llanta.',
      'Revisa la presión una vez al mes con las llantas frías.',
      'El código DOT dice cuándo se fabricó: "2321" = semana 23 del año 2021.',
      'Si cambias solo dos, las nuevas van atrás (en la mayoría de carros) para evitar que el carro "se coletee".',
    ],
    askMechanic: [
      '¿Qué fecha de fabricación (DOT) tienen las llantas nuevas?',
      '¿Hicieron balanceo? ¿Cambiaron válvulas?',
      '¿A qué presión las inflaron?',
    ],
    related: ['alineacion', 'rotacion'],
    extra: [
      {
        title: '¿Cómo leer tu llanta? (ej. 205/55 R16 91V)',
        body:
          '205 = ancho en milímetros. 55 = altura del costado como % del ancho. R = construcción radial. 16 = diámetro del rin en pulgadas. 91 = índice de carga (cuánto peso soporta). V = índice de velocidad máxima. Al cambiar llantas, respeta las medidas e índices del fabricante.',
      },
    ],
  },
  {
    id: 'rotacion',
    name: 'Rotación de llantas',
    planLabel: 'Rotar llantas',
    icon: 'sync',
    group: 'llantas',
    appliesTo: ['carro'],
    what: 'Cambiar las llantas de posición (delanteras atrás y viceversa) siguiendo un patrón.',
    why:
      'Las llantas delanteras se gastan distinto que las traseras (cargan el motor y la dirección). Rotarlas iguala el desgaste y alarga su vida, así compras llantas con menos frecuencia.',
    signs: ['Las delanteras se ven más gastadas que las traseras.', 'Ya pasaron 10,000 km desde la última rotación.'],
    ifIgnored: 'Tendrás que cambiar las llantas antes de tiempo y por pares desiguales.',
    tips: ['Aprovecha para hacerla junto con la alineación y balanceo.'],
    askMechanic: ['¿Qué patrón de rotación usaron?', '¿Cómo ven el desgaste de cada llanta?'],
    interval: { carro: { km: 10000, months: 12 } },
    trackedFor: ['carro'],
    related: ['alineacion'],
  },
  {
    id: 'alineacion',
    name: 'Alineación y balanceo',
    planLabel: 'Alineación y balanceo',
    icon: 'car-traction-control',
    group: 'llantas',
    appliesTo: ['carro', 'moto'],
    what:
      'Alineación: ajustar los ángulos de las ruedas para que vayan rectas y paralelas. Balanceo: poner pequeños contrapesos en el rin para que la rueda gire sin vibrar.',
    why:
      'Una mala alineación hace que el carro "se jale" hacia un lado y gasta las llantas disparejo. Una rueda desbalanceada vibra (sobre todo entre 80 y 110 km/h) y desgasta la suspensión.',
    signs: [
      'El carro se va hacia un lado en una recta.',
      'El volante no queda derecho cuando vas recto.',
      'Vibración del volante a cierta velocidad.',
      'Desgaste en los bordes de las llantas.',
      'Pegaste fuerte en un bache o banqueta.',
    ],
    ifIgnored: 'Llantas gastadas antes de tiempo, más consumo y un manejo menos seguro.',
    tips: [
      'Siempre que cambies llantas pide balanceo.',
      'Después de cambiar piezas de suspensión o dirección, siempre se alinea.',
    ],
    askMechanic: ['¿Me das la hoja con las medidas antes y después de la alineación?', '¿Cuántos contrapesos le pusieron a cada rueda?'],
    interval: { carro: { km: 10000, months: 12 } },
    trackedFor: ['carro'],
    related: ['rotacion', 'llantas'],
  },
  {
    id: 'suspension',
    name: 'Suspensión (amortiguadores, rótulas, bujes)',
    planLabel: 'Revisar suspensión',
    icon: 'car-cog',
    group: 'suspension',
    appliesTo: ['carro', 'moto'],
    what:
      'Revisión o cambio de las piezas que mantienen las llantas pegadas al piso y absorben los golpes: amortiguadores, resortes, rótulas, bujes, terminales y barras. En motos: las barras de la horquilla (con su aceite y retenes) y el amortiguador trasero.',
    why:
      'Se desgastan con baches y topes. Una suspensión en mal estado alarga la distancia de frenado, hace inestable el vehículo y gasta las llantas.',
    signs: [
      'Golpeteo o ruidos al pasar topes o baches.',
      'El vehículo rebota varias veces después de un tope.',
      'Se "clava" de frente al frenar.',
      'Fugas de aceite en los amortiguadores (o en las barras de la moto).',
      'Desgaste irregular de las llantas.',
    ],
    ifIgnored: 'Menos control al frenar y dar vuelta, desgaste de llantas y daños en otras piezas de la suspensión.',
    tips: [
      'Los amortiguadores se cambian por pares (los dos de un mismo eje).',
      'Pasa los topes despacio y de frente: tu suspensión te lo agradecerá.',
    ],
    askMechanic: [
      '¿Qué pieza exactamente está dañada y cómo lo comprobaron?',
      '¿Me la pueden enseñar con el carro levantado?',
      '¿Es urgente o puede esperar?',
    ],
    interval: { carro: { km: 20000, months: 12 }, moto: { km: 20000, months: 24 } },
    intervalNote: 'Revisión periódica. En motos, el aceite de las barras se cambia aprox. cada 20,000 km o 2 años.',
    trackedFor: ['carro', 'moto'],
    related: ['alineacion'],
  },
  {
    id: 'direccion',
    name: 'Dirección',
    icon: 'steering',
    group: 'suspension',
    appliesTo: ['carro'],
    what:
      'Sistema que hace girar las ruedas al mover el volante: cremallera, bomba o motor de asistencia, terminales y el líquido de dirección hidráulica.',
    why: 'Si falla, el volante se pone duro, hace ruido o tiene juego, y pierdes precisión al manejar.',
    signs: [
      'Volante duro, sobre todo al estacionarte.',
      'Zumbido o chillido al girar el volante.',
      'Holgura: mueves el volante y las ruedas tardan en responder.',
      'Fuga de líquido rojizo o ámbar cerca de las ruedas delanteras.',
      'Tronido al dar vuelta (puede ser también la junta homocinética).',
    ],
    ifIgnored: 'Pérdida de control y daños mayores en la cremallera o la bomba.',
    tips: ['No mantengas el volante girado hasta el tope por varios segundos: fuerza la bomba.'],
    askMechanic: ['¿La falla es de la cremallera, de la bomba o de los terminales?', '¿Mi dirección es hidráulica o eléctrica?'],
    related: ['alineacion', 'suspension'],
  },
  {
    id: 'bateria',
    name: 'Batería',
    planLabel: 'Revisar batería',
    icon: 'car-battery',
    group: 'electrico',
    appliesTo: ['carro', 'moto'],
    what: 'Revisión, carga o cambio del acumulador que da la energía para arrancar y alimenta la electrónica con el motor apagado.',
    why:
      'Su vida típica es de 3 a 5 años en carros y de 2 a 3 en motos. El calor y los trayectos cortos la desgastan. Revisarla una vez al año evita quedarte tirado.',
    signs: [
      'Al dar marcha, el motor gira lento.',
      'Las luces del tablero bajan o parpadean al arrancar.',
      'Bornes con polvo blanco o verde (sulfato).',
      'Testigo de batería encendido (también puede ser el alternador).',
      'Tiene más de 3 años.',
    ],
    ifIgnored: 'Te quedas sin arrancar en el peor momento.',
    tips: [
      'Si vas a dejar el vehículo parado semanas, desconecta el borne negativo o usa un cargador de mantenimiento.',
      'Revisa la fecha de fabricación al comprarla: una batería "nueva" que lleva un año en bodega dura menos.',
    ],
    askMechanic: [
      '¿Qué voltaje y CCA marcó la prueba?',
      '¿La falla es la batería o el alternador (sistema de carga)?',
      '¿Qué garantía tiene la batería nueva?',
    ],
    interval: { carro: { months: 12 }, moto: { months: 12 } },
    intervalNote: 'Revisión anual. Cambio aproximado cada 3-5 años (2-3 en moto).',
    trackedFor: ['carro', 'moto'],
    extra: [
      {
        title: '¿Qué son los CCA?',
        body:
          'Cold Cranking Amps: la corriente que la batería puede entregar en frío para arrancar. Una batería con menos CCA de lo que pide tu vehículo batallará para arrancar, sobre todo en la mañana.',
      },
    ],
  },
  {
    id: 'electrico',
    name: 'Sistema eléctrico (alternador, marcha, luces)',
    icon: 'lightning-bolt',
    group: 'electrico',
    appliesTo: ['carro', 'moto'],
    what:
      'Reparaciones del alternador (carga la batería), el motor de arranque o "marcha", luces, fusibles, cables y sensores.',
    why: 'Una falla eléctrica puede dejarte sin arrancar, sin luces o con la batería descargada.',
    signs: [
      'Testigo de batería encendido con el motor en marcha.',
      'Focos fundidos o luces que parpadean.',
      'Al dar marcha se oye solo un "clic".',
      'Cosas eléctricas que fallan de forma intermitente.',
    ],
    ifIgnored: 'Batería descargada, riesgo en la noche sin luces y multas.',
    tips: ['Revisa una vez al mes que funcionen todas las luces, incluidas las de freno y direccionales.'],
    askMechanic: ['¿Qué voltaje de carga da el alternador?', '¿Cuál fue la causa de la falla?'],
    related: ['bateria'],
  },
  {
    id: 'refrigerante',
    name: 'Anticongelante / refrigerante',
    planLabel: 'Cambiar anticongelante',
    icon: 'coolant-temperature',
    group: 'fluidos',
    appliesTo: ['carro', 'moto'],
    what:
      'Cambio o relleno del líquido (mezcla de anticongelante y agua desmineralizada) que circula por el motor y el radiador para mantener la temperatura correcta. Incluye revisar mangueras, radiador y tapón.',
    why:
      'Evita que el motor se sobrecaliente. Con el tiempo pierde sus aditivos anticorrosión y puede dañar el radiador, la bomba de agua y los empaques.',
    signs: [
      'La aguja de temperatura sube más de lo normal.',
      'Charcos verdes, rosas o naranjas bajo el vehículo.',
      'Olor dulce después de manejar.',
      'Nivel bajo en el depósito.',
      'Vapor saliendo del cofre.',
    ],
    ifIgnored:
      'Sobrecalentamiento, que puede deformar la cabeza del motor y quemar la junta: una reparación muy costosa.',
    tips: [
      'NUNCA abras el tapón del radiador con el motor caliente: el líquido sale hirviendo a presión.',
      'No uses solo agua de la llave: oxida el sistema por dentro.',
      'No mezcles colores o tipos distintos de anticongelante sin preguntar.',
      'En motos solo aplica si el motor es enfriado por líquido (tiene radiador).',
    ],
    askMechanic: ['¿Qué tipo de anticongelante pusieron y en qué proporción?', '¿Revisaron mangueras y la bomba de agua?'],
    interval: { carro: { km: 40000, months: 24 }, moto: { km: 20000, months: 24 } },
    intervalNote: 'Los anticongelantes de larga duración pueden llegar a 5 años; revisa tu manual.',
    trackedFor: ['carro'],
  },
  {
    id: 'distribucion',
    name: 'Banda o cadena de distribución',
    planLabel: 'Banda de distribución',
    icon: 'cog',
    group: 'motor',
    appliesTo: ['carro'],
    what:
      'Cambio de la banda dentada (o revisión de la cadena) que sincroniza el giro del cigüeñal con el de los árboles de levas, para que las válvulas abran y cierren en el momento exacto.',
    why:
      'Si una banda se rompe con el motor encendido, en muchos motores los pistones golpean las válvulas: reparación muy costosa. Por eso se cambia de forma preventiva por kilometraje o años, junto con tensores y a veces la bomba de agua.',
    signs: [
      'Normalmente NO avisa. Por eso es tan importante tener el registro.',
      'Chirrido o golpeteo en la parte delantera del motor.',
      'El motor no arranca de repente (gira pero no enciende).',
    ],
    ifIgnored: 'Si se rompe, el motor puede sufrir daños internos graves (válvulas dobladas, pistones dañados).',
    tips: [
      'Averigua si tu motor usa banda o cadena: las cadenas normalmente no tienen cambio periódico.',
      'Es buen momento para cambiar también la bomba de agua si la mueve la misma banda.',
    ],
    askMechanic: [
      '¿Mi motor usa banda o cadena?',
      '¿Cambiaron tensor, poleas y bomba de agua?',
      '¿Qué marca de kit pusieron?',
    ],
    interval: { carro: { km: 80000, months: 60 } },
    intervalNote: 'Entre 60,000 y 160,000 km según el motor. Si tu motor usa cadena, puedes desactivar este recordatorio.',
    trackedFor: ['carro'],
    related: ['refrigerante', 'banda_accesorios'],
    notFor: ['electrico'],
  },
  {
    id: 'banda_accesorios',
    name: 'Banda de accesorios (alternador)',
    icon: 'sine-wave',
    group: 'motor',
    appliesTo: ['carro'],
    what:
      'Banda que mueve el alternador, la bomba de dirección, el compresor del aire acondicionado y a veces la bomba de agua.',
    why:
      'Con el tiempo se agrieta o se estira. Si se rompe, la batería deja de cargarse, el volante se pone duro y el motor puede calentarse.',
    signs: ['Chillido al arrancar o al girar el volante.', 'Grietas visibles en la banda.', 'Testigo de batería encendido.'],
    ifIgnored: 'Si se rompe en camino te puedes quedar varado.',
    tips: ['Revísala cada vez que hagas cambio de aceite: es fácil ver si tiene grietas.'],
    askMechanic: ['¿Cambiaron también el tensor?'],
    interval: { carro: { km: 60000, months: 48 } },
  },
  {
    id: 'transmision',
    name: 'Aceite de transmisión',
    planLabel: 'Aceite de transmisión',
    icon: 'car-shift-pattern',
    group: 'transmision',
    appliesTo: ['carro', 'moto'],
    what:
      'Cambio del aceite que lubrica los engranes de la caja de velocidades (ATF en automáticas, aceite CVT en transmisiones CVT, o aceite de engranes en manuales).',
    why:
      'Lubrica y enfría. En las automáticas además transmite la presión hidráulica para hacer los cambios. Degradado causa cambios bruscos, patinamiento y desgaste muy costoso.',
    signs: [
      'Cambios duros, bruscos o tardíos.',
      'La transmisión "patina": suben las revoluciones pero no avanzas igual.',
      'Ruidos al cambiar de velocidad.',
      'Fugas rojizas bajo el carro (automáticas).',
    ],
    ifIgnored: 'Desgaste interno de la transmisión; repararla es de lo más caro de un vehículo.',
    tips: [
      'Algunas marcas dicen "de por vida"; muchos mecánicos recomiendan cambiarlo igual entre 60,000 y 100,000 km.',
      'Usa exactamente el tipo indicado (ATF, CVT, 75W-90…): uno incorrecto puede dañarla.',
    ],
    askMechanic: ['¿Qué aceite pusieron y cuántos litros?', '¿Cambiaron también el filtro de la transmisión?'],
    interval: { carro: { km: 60000 } },
    trackedFor: ['carro'],
    notFor: ['electrico'],
  },
  {
    id: 'embrague',
    name: 'Embrague (clutch)',
    icon: 'car-clutch',
    group: 'transmision',
    appliesTo: ['carro', 'moto'],
    what:
      'Mecanismo que conecta y desconecta el motor de la transmisión para poder cambiar de velocidad (carros estándar y motos). Incluye disco, plato opresor y collarín (en motos, discos de embrague y cable).',
    why: 'El disco se desgasta con el uso, sobre todo en tráfico y en pendientes.',
    signs: [
      'El motor sube de revoluciones pero el vehículo no acelera igual (patina).',
      'El pedal (o la palanca) se siente duro, muy alto o muy bajo.',
      'Cuesta meter los cambios.',
      'Olor a quemado al subir pendientes.',
    ],
    ifIgnored: 'Te puedes quedar sin poder avanzar.',
    tips: [
      'No manejes con el pie apoyado en el pedal del clutch.',
      'En semáforos largos ponte en neutral.',
      'En motos ajusta el juego del cable según el manual.',
    ],
    askMechanic: ['¿Cambiaron el kit completo (disco, plato y collarín)?', '¿Rectificaron el volante motor?'],
  },
  {
    id: 'aire_acondicionado',
    name: 'Aire acondicionado',
    icon: 'snowflake',
    group: 'confort',
    appliesTo: ['carro'],
    what: 'Revisión y recarga del gas refrigerante, limpieza del sistema y revisión de fugas y del compresor.',
    why:
      'El sistema pierde un poco de gas con los años. Si enfría poco, muchas veces hay una fuga. Además ayuda a desempañar los vidrios en lluvia.',
    signs: ['Sale aire, pero no frío.', 'Ruido al prender el aire.', 'Malos olores.', 'Gotea agua dentro del carro.'],
    ifIgnored: 'Sin aire en temporada de calor y posible daño del compresor.',
    tips: [
      'Úsalo unos minutos cada semana, aun en invierno, para lubricar los sellos.',
      'Si hay que recargarlo cada año, pide que busquen la fuga con tinte o detector.',
    ],
    askMechanic: ['¿Qué presión tenía el sistema?', '¿Encontraron alguna fuga?', '¿Qué tipo de gas usa mi carro (R134a o R1234yf)?'],
    related: ['filtro_cabina'],
  },
  {
    id: 'inyectores',
    name: 'Limpieza de inyectores / cuerpo de aceleración',
    icon: 'spray',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what:
      'Los inyectores rocían el combustible dentro del motor y el cuerpo de aceleración regula cuánto aire entra. Se limpian con equipo de ultrasonido o con líquidos especiales.',
    why: 'Acumulan carbón y barniz con el tiempo: el motor tiembla en marcha mínima, falla, gasta y contamina más.',
    signs: ['Marcha mínima inestable.', 'Tironeos al acelerar.', 'Mayor consumo.', 'Arranque difícil.'],
    ifIgnored: 'Más consumo y emisiones; a la larga, inyectores dañados.',
    tips: ['Cargar gasolina de buena calidad ayuda a mantenerlos limpios.'],
    askMechanic: ['¿Limpiaron los inyectores fuera del motor (ultrasonido) o con aditivo?', '¿Cambiaron los empaques (o-rings)?'],
    notFor: ['electrico'],
  },
  {
    id: 'escape',
    name: 'Escape y catalizador',
    icon: 'smoke',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what:
      'Reparación de los tubos que sacan los gases del motor, el silenciador y el catalizador (que convierte los gases más tóxicos en otros menos dañinos).',
    why:
      'Una fuga de escape es peligrosa: el monóxido de carbono puede entrar a la cabina. Un catalizador tapado "ahoga" el motor.',
    signs: [
      'Ruido fuerte o "petardeo".',
      'Olor a huevo podrido (azufre).',
      'Pérdida de potencia.',
      'Check Engine encendido.',
      'Te rechazaron en la verificación de emisiones.',
    ],
    ifIgnored: 'Riesgo de intoxicación, multas y menor rendimiento.',
    tips: ['Si sientes olor a gases dentro del carro, abre las ventanas y llévalo a revisar cuanto antes.'],
    askMechanic: ['¿La fuga está antes o después del catalizador?', '¿Es soldadura o pieza nueva?'],
    notFor: ['electrico'],
  },
  {
    id: 'cadena_moto',
    name: 'Lubricar y tensar cadena',
    planLabel: 'Lubricar cadena',
    icon: 'link-variant',
    group: 'moto',
    appliesTo: ['moto'],
    what: 'Limpiar la cadena de transmisión, aplicarle lubricante especial y ajustar su tensión (holgura) según el manual.',
    why:
      'Una cadena seca o floja se desgasta muy rápido, desgasta los piñones, hace ruido y puede salirse o romperse en marcha.',
    signs: [
      'Ruido metálico o "cascabeleo" en la cadena.',
      'Se ve oxidada o seca.',
      'Cuelga demasiado (más de lo que indica el manual, normalmente 2 a 3 cm).',
      'Tirones al acelerar o soltar el acelerador.',
    ],
    ifIgnored: 'La cadena y los piñones se acaban rápido y una cadena que se sale puede bloquear la rueda trasera.',
    tips: [
      'Lubrícala tibia (después de rodar) y limpia el exceso.',
      'Si te agarró la lluvia, lubrícala al llegar.',
      'Mide la holgura con la moto en su soporte, como indica el manual.',
    ],
    askMechanic: ['¿Cómo está el desgaste del kit de arrastre?', '¿Qué lubricante usaron?'],
    interval: { moto: { km: 800, months: 1 } },
    intervalNote: 'Cada 500 a 1,000 km o después de rodar con lluvia.',
    trackedFor: ['moto'],
    related: ['kit_arrastre'],
  },
  {
    id: 'kit_arrastre',
    name: 'Kit de arrastre (cadena, piñón y corona)',
    planLabel: 'Kit de arrastre',
    icon: 'cogs',
    group: 'moto',
    appliesTo: ['moto'],
    what: 'Cambio del conjunto cadena + piñón (engrane pequeño) + corona (engrane grande de la rueda trasera).',
    why: 'Se desgastan juntos: si cambias solo la cadena, los engranes gastados la acaban rápido.',
    signs: [
      'Dientes de la corona en forma de "ola" o puntiagudos.',
      'La cadena se estiró y ya no se puede tensar más.',
      'Puedes separar la cadena de la corona jalándola hacia atrás.',
    ],
    ifIgnored: 'Tirones, ruido y riesgo de que la cadena se rompa.',
    tips: ['Cambia siempre las tres piezas juntas.'],
    askMechanic: ['¿Qué marca de kit pusieron?', '¿Es de la misma relación (número de dientes) que el original?'],
    interval: { moto: { km: 20000 } },
    intervalNote: 'Entre 15,000 y 30,000 km según el cuidado de la cadena.',
    trackedFor: ['moto'],
    related: ['cadena_moto'],
  },
  {
    id: 'valvulas',
    name: 'Calibración de válvulas',
    planLabel: 'Calibrar válvulas',
    icon: 'valve',
    group: 'motor',
    appliesTo: ['carro', 'moto'],
    what: 'Ajustar la holgura (luz) de las válvulas del motor a la medida que indica el fabricante.',
    why:
      'Con el uso esa holgura cambia. Muy cerrada: la válvula no cierra bien, pierde compresión y se puede quemar. Muy abierta: hace ruido (taqueteo) y el motor rinde menos.',
    signs: ['Taqueteo metálico en la parte alta del motor.', 'Pérdida de potencia.', 'Arranque difícil en caliente.'],
    ifIgnored: 'Válvulas quemadas y pérdida de compresión: reparación costosa.',
    tips: ['Es un mantenimiento clave en motos. Muchos carros modernos tienen ajuste hidráulico y no lo necesitan.'],
    askMechanic: ['¿Qué medidas encontraron y a cuánto las dejaron?', '¿Cambiaron el empaque de la tapa de punterías?'],
    interval: { moto: { km: 12000 }, carro: { km: 60000 } },
    intervalNote: 'En motos pequeñas puede ser cada 6,000-8,000 km. Revisa tu manual.',
    trackedFor: ['moto'],
    notFor: ['electrico'],
  },
  {
    id: 'carburador',
    name: 'Carburador / sincronización',
    icon: 'tune-variant',
    group: 'moto',
    appliesTo: ['moto', 'carro'],
    what: 'Limpieza y ajuste del carburador: la pieza que mezcla aire y gasolina en motores sin inyección.',
    why: 'Se ensucia con el tiempo o con gasolina vieja. Un carburador sucio o mal ajustado hace que el motor falle y gaste de más.',
    signs: ['La moto se apaga en marcha mínima.', 'Cuesta arrancarla.', 'Petardeos.', 'Mayor consumo.'],
    ifIgnored: 'Fallas de motor y consumo excesivo.',
    tips: ['Si vas a guardar la moto mucho tiempo, vacía el carburador o usa estabilizador de gasolina.'],
    askMechanic: ['¿Cambiaron empaques o el kit del carburador?', '¿Ajustaron la mezcla y la marcha mínima?'],
    notFor: ['electrico'],
  },
  {
    id: 'limpiaparabrisas',
    name: 'Plumas limpiaparabrisas',
    planLabel: 'Cambiar plumas',
    icon: 'wiper',
    group: 'confort',
    appliesTo: ['carro'],
    what: 'Cambio de las gomas (plumas o escobillas) que limpian el parabrisas.',
    why: 'El caucho se endurece con el sol. Si dejan rayas o brincan, no limpian bien con lluvia: ver bien es seguridad.',
    signs: ['Dejan rayas o zonas sin limpiar.', 'Rechinan o brincan.', 'La goma está agrietada.'],
    ifIgnored: 'Mala visibilidad con lluvia.',
    tips: ['Rellena el depósito con líquido limpiaparabrisas, no solo agua.'],
    askMechanic: ['¿Qué medida llevan?'],
    interval: { carro: { months: 12 } },
    trackedFor: ['carro'],
  },
  {
    id: 'diagnostico',
    name: 'Diagnóstico / escaneo',
    icon: 'stethoscope',
    group: 'general',
    appliesTo: ['carro', 'moto'],
    what:
      'El mecánico conecta un escáner al puerto OBD2 para leer los códigos de falla de la computadora del vehículo, o hace una revisión general buscando la causa de un problema.',
    why: 'Permite encontrar la causa de una luz encendida (como el Check Engine) sin adivinar ni cambiar piezas de más.',
    signs: ['Una luz de advertencia se encendió.', 'Un ruido o comportamiento extraño.', 'Antes de comprar un vehículo usado.'],
    ifIgnored: 'Un problema pequeño puede convertirse en uno grande.',
    tips: [
      'Pide el código exacto (por ejemplo P0301) y anótalo: te sirve para comparar presupuestos.',
      'Un código indica el sistema con problema, no siempre la pieza exacta.',
      'Existen lectores OBD2 baratos que se conectan al celular.',
    ],
    askMechanic: ['¿Qué códigos de falla salieron?', '¿Qué pruebas hicieron para confirmar la pieza dañada?'],
  },
  {
    id: 'servicio_agencia',
    name: 'Servicio programado (de agencia)',
    icon: 'clipboard-check',
    group: 'general',
    appliesTo: ['carro', 'moto'],
    what:
      'Mantenimiento que indica el fabricante en el manual para cierto kilometraje (por ejemplo "servicio de 20,000 km"): incluye una lista de revisiones y cambios.',
    why: 'Cumplir los servicios del fabricante mantiene la garantía y evita fallas.',
    signs: ['Llegaste al kilometraje o tiempo del servicio en tu póliza de garantía.'],
    ifIgnored: 'Puedes perder la garantía de fábrica.',
    tips: [
      'Pide la hoja de puntos revisados y la lista de piezas cambiadas.',
      'En la app marca también cada trabajo (aceite, filtros, rotación…) para que tus recordatorios se actualicen.',
      'Durante la garantía, un taller independiente también puede hacer el servicio si usa piezas y aceites de la especificación y te da factura (pregunta las condiciones de tu marca).',
    ],
    askMechanic: ['¿Qué incluye este servicio según el manual?', '¿Qué trabajos extra me están recomendando y por qué?'],
    related: ['aceite', 'filtro_aceite', 'filtro_aire', 'rotacion'],
  },
  {
    id: 'carroceria',
    name: 'Carrocería y pintura',
    icon: 'format-paint',
    group: 'confort',
    appliesTo: ['carro', 'moto'],
    what: 'Reparación de golpes (hojalatería), pintura, pulido, cristales, espejos o defensas.',
    why: 'Además de la estética, evita que el metal expuesto se oxide.',
    signs: ['Rayones que llegan al metal.', 'Burbujas en la pintura (óxido debajo).', 'Golpes o piezas flojas.'],
    ifIgnored: 'El óxido avanza y la reparación se vuelve más cara.',
    tips: ['Pide fotos del antes y después.', 'Pregunta si la pintura tiene garantía.'],
    askMechanic: ['¿La pieza se reparó o se cambió?', '¿Qué garantía tiene la pintura?'],
  },
  {
    id: 'lavado',
    name: 'Lavado y detallado',
    icon: 'car-wash',
    group: 'confort',
    appliesTo: ['carro', 'moto'],
    what: 'Lavado exterior, aspirado, encerado o detallado.',
    why: 'Protege la pintura y te ayuda a detectar a tiempo golpes, fugas o llantas dañadas.',
    signs: ['Polvo, salitre o excremento de aves en la pintura.'],
    ifIgnored: 'La pintura se opaca y se daña.',
    tips: ['Retira cuanto antes el excremento de aves y la savia de los árboles: dañan la pintura.'],
    askMechanic: [],
  },
  {
    id: 'otro',
    name: 'Otro trabajo',
    icon: 'wrench',
    group: 'general',
    appliesTo: ['carro', 'moto'],
    what: 'Cualquier otro trabajo que no esté en la lista.',
    why: 'Todo lo que se le hace a tu vehículo vale la pena registrarlo: sirve para darle seguimiento, para reclamar garantías y aumenta su valor al venderlo.',
    signs: [],
    ifIgnored: '',
    tips: ['Describe el trabajo en el detalle para encontrarlo después.'],
    askMechanic: ['¿Qué pieza cambiaron y por qué?', '¿Tiene garantía?'],
  },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

const FALLBACK = CATEGORIES[CATEGORIES.length - 1];

export function getCategory(id: string): ServiceCategory {
  return BY_ID.get(id) ?? FALLBACK;
}

export function hasCategory(id: string): boolean {
  return BY_ID.has(id);
}

export function categoriesFor(type: VehicleType, fuel?: FuelType): ServiceCategory[] {
  return CATEGORIES.filter((c) => c.appliesTo.includes(type) && !(fuel && c.notFor?.includes(fuel)));
}

const OIL_INTERVALS: Record<VehicleType, Record<OilType, Interval>> = {
  carro: {
    mineral: { km: 5000, months: 6 },
    semisintetico: { km: 7500, months: 6 },
    sintetico: { km: 10000, months: 12 },
  },
  moto: {
    mineral: { km: 2500, months: 6 },
    semisintetico: { km: 4000, months: 6 },
    sintetico: { km: 6000, months: 12 },
  },
};

/** Intervalo recomendado para un trabajo en un vehículo concreto. */
export function recommendedInterval(
  categoryId: string,
  type: VehicleType,
  oilType: OilType = 'sintetico',
): Interval | undefined {
  if (categoryId === 'aceite' || categoryId === 'filtro_aceite') {
    return OIL_INTERVALS[type][oilType];
  }
  return getCategory(categoryId).interval?.[type];
}

export const OIL_TYPE_LABELS: Record<OilType, string> = {
  mineral: 'Mineral',
  semisintetico: 'Semisintético',
  sintetico: 'Sintético',
};

export const FUEL_LABELS: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  hibrido: 'Híbrido',
  electrico: 'Eléctrico',
  gas: 'Gas (GLP/GNV)',
};
