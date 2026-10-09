import type { Urgency } from '@/data/symptoms';

export interface Leak {
  id: string;
  color: string;
  label: string;
  fluid: string;
  where: string;
  urgency: Urgency;
  advice: string;
  categoryId?: string;
}

export const LEAKS: Leak[] = [
  {
    id: 'cafe',
    color: '#4A2E14',
    label: 'Café oscuro o negro',
    fluid: 'Aceite de motor',
    where: 'Debajo del motor, en la parte delantera.',
    urgency: 'media',
    advice:
      'Revisa el nivel con la varilla y rellena si hace falta. Llévalo a revisar: puede ser el tapón del cárter, el filtro o un empaque.',
    categoryId: 'aceite',
  },
  {
    id: 'rojo',
    color: '#C81E3A',
    label: 'Rojo o rosa',
    fluid: 'Líquido de transmisión automática o de dirección hidráulica',
    where: 'Al centro (transmisión) o adelante cerca de las ruedas (dirección).',
    urgency: 'media',
    advice: 'Revisa niveles y llévalo pronto al taller: quedarse sin este líquido daña piezas caras.',
    categoryId: 'transmision',
  },
  {
    id: 'verde',
    color: '#2FBF71',
    label: 'Verde, naranja o rosa brillante (olor dulce)',
    fluid: 'Anticongelante',
    where: 'Al frente, cerca del radiador, o debajo del motor.',
    urgency: 'alta',
    advice:
      'Vigila la temperatura del motor y revisa el nivel en frío. Limpia el charco: es tóxico y a las mascotas les atrae su sabor dulce.',
    categoryId: 'refrigerante',
  },
  {
    id: 'ambar',
    color: '#D9A441',
    label: 'Ámbar o amarillento, aceitoso, cerca de las ruedas',
    fluid: 'Líquido de frenos',
    where: 'Junto a una rueda o detrás del motor (bomba de frenos).',
    urgency: 'alta',
    advice: 'No manejes: sin líquido de frenos puedes quedarte sin frenos. Pide una grúa o un mecánico a domicilio.',
    categoryId: 'liquido_frenos',
  },
  {
    id: 'gasolina',
    color: '#E8D44D',
    label: 'Transparente o amarillento con olor a gasolina',
    fluid: 'Combustible',
    where: 'Cerca del tanque (atrás) o del motor.',
    urgency: 'alta',
    advice: 'Riesgo de incendio. No enciendas el motor ni fumes cerca; llama a un mecánico.',
    categoryId: 'filtro_combustible',
  },
  {
    id: 'azul',
    color: '#2F80ED',
    label: 'Azul',
    fluid: 'Líquido limpiaparabrisas',
    where: 'Al frente, cerca de una rueda delantera.',
    urgency: 'baja',
    advice: 'No es peligroso. Puede ser el depósito o una manguera rota.',
    categoryId: 'limpiaparabrisas',
  },
  {
    id: 'agua',
    color: '#BFE3F2',
    label: 'Transparente como agua, sin olor',
    fluid: 'Agua del aire acondicionado (condensación)',
    where: 'Debajo del área del copiloto.',
    urgency: 'baja',
    advice: '¡Es normal! El aire acondicionado saca la humedad del interior y la gotea afuera.',
  },
];

export interface GlossaryTerm {
  term: string;
  aka?: string;
  definition: string;
  categoryId?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'ABS', definition: 'Sistema antibloqueo de frenos: evita que las ruedas se bloqueen en una frenada fuerte para que puedas seguir girando el volante.' },
  { term: 'Afinación', definition: 'Paquete de mantenimiento del motor (bujías, filtros, limpieza). Cada taller incluye cosas distintas: pide el detalle.', categoryId: 'afinacion' },
  { term: 'Alternador', definition: 'Generador movido por el motor que carga la batería y alimenta la electricidad con el motor encendido.', categoryId: 'electrico' },
  { term: 'Amortiguador', definition: 'Pieza de la suspensión que controla el rebote de los resortes para que las llantas no pierdan contacto con el piso.', categoryId: 'suspension' },
  { term: 'Anticongelante', aka: 'Refrigerante', definition: 'Líquido que circula por el motor y el radiador para mantener la temperatura correcta.', categoryId: 'refrigerante' },
  { term: 'Árbol de levas', definition: 'Eje con "levas" que abre y cierra las válvulas del motor en el momento exacto.' },
  { term: 'ATF', definition: 'Automatic Transmission Fluid: aceite especial para transmisiones automáticas, normalmente rojo.', categoryId: 'transmision' },
  { term: 'Balatas', aka: 'Pastillas de freno', definition: 'Piezas con material de fricción que presionan el disco para frenar.', categoryId: 'frenos' },
  { term: 'Balanceo', definition: 'Colocar contrapesos en el rin para que la llanta gire sin vibrar.', categoryId: 'alineacion' },
  { term: 'Banda de distribución', aka: 'Correa de tiempo', definition: 'Banda dentada que sincroniza el cigüeñal con los árboles de levas. Si se rompe puede dañar el motor.', categoryId: 'distribucion' },
  { term: 'Bobina', definition: 'Transforma los 12 voltios de la batería en miles de voltios para que la bujía haga chispa.', categoryId: 'bujias' },
  { term: 'Bujes', definition: 'Piezas de hule que unen partes de la suspensión y absorben vibraciones.', categoryId: 'suspension' },
  { term: 'Bujía', definition: 'Produce la chispa que enciende la mezcla aire-gasolina en cada cilindro.', categoryId: 'bujias' },
  { term: 'Caliper', aka: 'Mordaza', definition: 'Pieza que sostiene las pastillas y las presiona contra el disco con la fuerza del líquido de frenos.', categoryId: 'frenos' },
  { term: 'Cárter', definition: 'Depósito en la parte de abajo del motor donde se junta el aceite.', categoryId: 'aceite' },
  { term: 'Catalizador', definition: 'Pieza del escape que convierte los gases más contaminantes en otros menos dañinos.', categoryId: 'escape' },
  { term: 'Check Engine', definition: 'Luz amarilla del tablero que indica que la computadora detectó una falla del motor o de emisiones.', categoryId: 'diagnostico' },
  { term: 'Cigüeñal', definition: 'Eje principal del motor que convierte el movimiento de subir y bajar de los pistones en giro.' },
  { term: 'Clutch', aka: 'Embrague', definition: 'Conecta y desconecta el motor de la transmisión para poder cambiar de velocidad.', categoryId: 'embrague' },
  { term: 'Corona', definition: 'En motos: el engrane grande de la rueda trasera por donde pasa la cadena.', categoryId: 'kit_arrastre' },
  { term: 'Cremallera', definition: 'Mecanismo de la dirección que convierte el giro del volante en movimiento lateral de las ruedas.', categoryId: 'direccion' },
  { term: 'Cuerpo de aceleración', definition: 'Válvula que regula cuánto aire entra al motor cuando aceleras.', categoryId: 'inyectores' },
  { term: 'CVT', definition: 'Transmisión de variación continua: no tiene "cambios" fijos; usa poleas y una banda o cadena.', categoryId: 'transmision' },
  { term: 'Desvielar', definition: 'Daño grave del motor (normalmente por falta de aceite) en el que se dañan bielas y cojinetes.', categoryId: 'aceite' },
  { term: 'Disco de freno', aka: 'Rotor', definition: 'Disco metálico que gira con la rueda y contra el que presionan las pastillas.', categoryId: 'discos' },
  { term: 'DOT', definition: 'En llantas: código con la fecha de fabricación (semana y año). En frenos: tipo de líquido (DOT 3, DOT 4…).' },
  { term: 'Empaque', aka: 'Junta', definition: 'Pieza que sella la unión entre dos partes para evitar fugas.' },
  { term: 'Escáner', definition: 'Aparato que se conecta al puerto OBD2 para leer los códigos de falla de la computadora.', categoryId: 'diagnostico' },
  { term: 'Flecha', aka: 'Semieje', definition: 'Eje que lleva la fuerza de la transmisión a las ruedas. Sus extremos son las juntas homocinéticas.' },
  { term: 'Holgura', definition: 'Juego o espacio entre piezas. Muy poco o demasiado puede causar fallas.' },
  { term: 'Homocinética', definition: 'Junta en los extremos de la flecha que permite transmitir fuerza a las ruedas mientras giran y suben y bajan.' },
  { term: 'Horquilla', aka: 'Barras', definition: 'En motos: la suspensión delantera, formada por dos barras con aceite y retenes.', categoryId: 'suspension' },
  { term: 'Inyector', definition: 'Rocía el combustible dentro del motor en la cantidad exacta.', categoryId: 'inyectores' },
  { term: 'Junta de cabeza', definition: 'Empaque entre el bloque y la cabeza del motor. Se "quema" si el motor se sobrecalienta.', categoryId: 'refrigerante' },
  { term: 'Kit de arrastre', definition: 'En motos: cadena, piñón y corona. Se cambian juntos.', categoryId: 'kit_arrastre' },
  { term: 'Marcha', aka: 'Motor de arranque', definition: 'Motor eléctrico que hace girar el motor para encenderlo.', categoryId: 'electrico' },
  { term: 'Marcha mínima', aka: 'Ralentí', definition: 'Las revoluciones del motor cuando está encendido sin acelerar.' },
  { term: 'OBD2', definition: 'Puerto de diagnóstico (normalmente bajo el volante) donde se conecta el escáner.', categoryId: 'diagnostico' },
  { term: 'Piñón', definition: 'En motos: el engrane pequeño de salida del motor que mueve la cadena.', categoryId: 'kit_arrastre' },
  { term: 'Purgar', definition: 'Sacar el aire de un sistema hidráulico (como los frenos) para que funcione bien.', categoryId: 'liquido_frenos' },
  { term: 'Radiador', definition: 'Intercambiador de calor al frente del vehículo que enfría el anticongelante.', categoryId: 'refrigerante' },
  { term: 'Rectificar', definition: 'Maquinar una pieza para dejarla plana o a medida (discos de freno, cabeza del motor).', categoryId: 'discos' },
  { term: 'Retén', definition: 'Sello de hule que evita que salga aceite por donde pasa un eje que gira.' },
  { term: 'Rótula', definition: 'Articulación de la suspensión que permite que la rueda suba, baje y gire.', categoryId: 'suspension' },
  { term: 'Sensor de oxígeno', definition: 'Mide el oxígeno en el escape para que la computadora ajuste la mezcla de combustible.', categoryId: 'escape' },
  { term: 'Termostato', definition: 'Válvula que abre o cierra el paso del anticongelante al radiador según la temperatura del motor.', categoryId: 'refrigerante' },
  { term: 'Terminales', definition: 'Articulaciones en los extremos de la dirección que conectan la cremallera con las ruedas.', categoryId: 'direccion' },
  { term: 'TPMS', definition: 'Sistema de sensores que avisa cuando una llanta tiene la presión baja.', categoryId: 'llantas' },
  { term: 'Turbo', definition: 'Compresor movido por los gases del escape que mete más aire al motor para dar más potencia.' },
  { term: 'Válvulas', definition: 'Abren y cierran el paso de aire y gases en cada cilindro.', categoryId: 'valvulas' },
  { term: 'Viscosidad', definition: 'Qué tan espeso es el aceite. En "5W-30", el 5W indica cómo fluye en frío y el 30 en caliente.', categoryId: 'aceite' },
];

export interface WorkshopTip {
  emoji: string;
  title: string;
  text: string;
}

export const WORKSHOP_TIPS: WorkshopTip[] = [
  { emoji: '📝', title: 'Pide el presupuesto por escrito', text: 'Antes de autorizar, pide el desglose de piezas y mano de obra. Que te avisen antes de hacer cualquier trabajo extra.' },
  { emoji: '🔍', title: 'Pide que te enseñen la falla', text: 'Un buen mecánico no tiene problema en mostrarte la pieza dañada con el vehículo levantado o en una foto.' },
  { emoji: '♻️', title: 'Pide las piezas viejas', text: 'Es tu derecho. Así confirmas que sí se cambiaron.' },
  { emoji: '📸', title: 'Toma fotos', text: 'Del tablero (kilometraje y luces) al dejarlo y al recogerlo, y de la factura. Guárdalas aquí en MiGaraje.' },
  { emoji: '🛡️', title: 'Pregunta por la garantía', text: '¿Cuánto tiempo o kilómetros cubre la pieza y la mano de obra? Anótala en el registro del servicio.' },
  { emoji: '🧭', title: 'Busca una segunda opinión', text: 'Si te presupuestan algo caro o "urgente" que no esperabas, está bien preguntar en otro taller.' },
  { emoji: '📖', title: 'Conoce tu manual', text: 'Los intervalos del fabricante mandan. Si te recomiendan algo mucho antes de lo indicado, pregunta por qué.' },
  { emoji: '🧾', title: 'Pide factura o nota detallada', text: 'Con fecha, kilometraje, piezas con marca y quién hizo el trabajo. Te sirve para garantías y para vender el vehículo.' },
  { emoji: '🙋', title: 'No hay preguntas tontas', text: '"¿Qué es esto?", "¿por qué se dañó?", "¿qué pasa si lo dejo para después?" son preguntas válidas. Usa las preguntas sugeridas en cada servicio.' },
  { emoji: '⭐', title: 'Califica y lleva historial', text: 'Registra quién te atendió y qué tal te fue. Con el tiempo sabrás en qué taller y con qué mecánico confiar.' },
];

export const DAILY_TIPS: string[] = [
  'Revisa la presión de tus llantas una vez al mes, en frío. La presión correcta está en una etiqueta en el marco de la puerta del conductor.',
  'Revisa el nivel de aceite cada dos semanas: motor frío, piso plano, saca la varilla, límpiala, métela y vuelve a sacarla.',
  'Si una luz roja se enciende en el tablero, detente en cuanto sea seguro. Las amarillas te dan algo de margen.',
  'Pasa los topes despacio y de frente: tu suspensión y tus llantas duran más.',
  'Calentar el motor parado varios minutos no es necesario en motores modernos: maneja suave los primeros kilómetros.',
  'Anda con al menos un cuarto de tanque: la bomba de gasolina se enfría con el mismo combustible.',
  'Un historial de mantenimiento completo puede aumentar el valor de tu vehículo al venderlo. ¡Sigue registrando!',
  'Las llantas también caducan: después de 5 o 6 años el hule se endurece aunque se vean bien.',
  'Usa el aire acondicionado unos minutos cada semana, incluso en invierno, para mantener lubricados sus sellos.',
  'Si tu moto se mojó con lluvia, lubrica la cadena al llegar.',
  'Escuchar ruidos nuevos a tiempo ahorra dinero: cuando notes algo raro, anótalo en las notas del vehículo.',
  'El líquido de frenos se cambia por tiempo (cada 2 años), no por kilómetros.',
  'Manejar agresivo (acelerones y frenones) puede subir el consumo de combustible hasta un 30%.',
  'Lava tu vehículo también por debajo después de manejar en lodo o cerca del mar: evita el óxido.',
  'Antes de un viaje largo revisa: llantas (incluida la de refacción), aceite, anticongelante, frenos y luces.',
  'Cuando el taller te recomiende algo, abre la guía de ese servicio en "Aprende" para entender qué es y qué preguntar.',
  'Si tu carro tiene banda de distribución, no la pases del kilometraje recomendado: casi nunca avisa antes de romperse.',
  'El polvo blanco o verde en los bornes de la batería se limpia con agua y bicarbonato (con el motor apagado).',
];
