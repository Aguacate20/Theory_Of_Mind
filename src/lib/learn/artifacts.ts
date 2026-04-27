export type Relation = "apoya" | "contradice" | "matiza" | "extiende";

export type DepositedArtifact = {
  id: string;
  node: ArtifactNode;
  relation?: string;
  deposited_by?: string;
  group?: number;
};

export type ArtifactNode =
  | "falsa_creencia"
  | "tomm"
  | "metarrepresentacion"
  | "cambio_conceptual"
  | "simulacion"
  | "neuronas_espejo"
  | "perspectiva"
  | "modularidad"
  | "encapsulamiento"
  | "autismo"
  | "interaccion_primaria"
  | "intersubjetividad"
  | "segunda_persona"
  | "tipo1_tipo2"
  | "neurociencia_social"
  | "teoria_teoria";

export type Artifact = {
  id: string;
  title: string;
  room: "sur" | "oeste" | "este" | "norte" | "centro";
  // Group 1 = TT (Wellman, Leslie), Group 2 = Sim+Int (Goldman, Gallagher), Group 3 = Mod+Integ (Scholl, Apperly/Bohl)
  primaryGroup: 1 | 2 | 3;
  reading: string;
  // The fragment shown — blanks marked as [BLANK:word]
  fragmentFull: string;
  fragmentBlanks: string; // same text with [BLANK] replacing key words
  blanks: string[]; // the hidden words in order
  targetNode: ArtifactNode;
  // How this artifact relates to already-placed artifacts (filled after deposit)
  relations: { toNode: ArtifactNode; type: Relation; label: string }[];
  // Color for the artifact sprite
  color: string;
  icon: string; // emoji-style label (single char drawn on canvas)
};

export const ARTIFACTS: Artifact[] = [
  // ── SALA SUR: Teoría-Teoría ──────────────────────────────────────────────
  {
    id: "tt_01",
    title: "El niño científico",
    room: "sur",
    primaryGroup: 1,
    reading: "Why the Child's Theory of Mind Really Is a Theory (Gopnik & Wellman)",
    fragmentFull: "Los niños poseen representaciones reales de las mentes ajenas y una teoría de cómo operan. El desarrollo progresa de una teoría de deseo/percepción a una teoría completa de deseo/creencia/percepción, comparable a la evolución de una teoría científica.",
    fragmentBlanks: "Los niños poseen representaciones reales de las mentes ajenas y una [BLANK] de cómo operan. El desarrollo progresa de una teoría de [BLANK]/percepción a una teoría completa de deseo/[BLANK]/percepción.",
    blanks: ["teoría", "deseo", "creencia"],
    targetNode: "teoria_teoria",
    relations: [
      { toNode: "cambio_conceptual", type: "apoya", label: "el progreso de TT implica cambio conceptual" },
      { toNode: "falsa_creencia", type: "extiende", label: "la TT predice cuándo aparece la falsa creencia" },
    ],
    color: "#7F77DD",
    icon: "T",
  },
  {
    id: "tt_02",
    title: "La tarea de la caja de Smarties",
    room: "sur",
    primaryGroup: 1,
    reading: "Why the Child's Theory of Mind Really Is a Theory (Gopnik & Wellman)",
    fragmentFull: "Antes de los 4 años, los niños no comprenden que alguien puede tener una creencia falsa sobre el contenido de una caja. Este fracaso revela que aún no han adquirido la representación de que las creencias pueden diferir de la realidad.",
    fragmentBlanks: "Antes de los [BLANK] años, los niños no comprenden que alguien puede tener una [BLANK] falsa sobre el contenido de una caja. Este fracaso revela que aún no han adquirido la representación de que las [BLANK] pueden diferir de la realidad.",
    blanks: ["4", "creencia", "creencias"],
    targetNode: "falsa_creencia",
    relations: [
      { toNode: "teoria_teoria", type: "apoya", label: "evidencia empírica central de TT" },
      { toNode: "tomm", type: "matiza", label: "TT y ToMM explican el mismo fenómeno diferente" },
    ],
    color: "#7F77DD",
    icon: "F",
  },
  {
    id: "tt_03",
    title: "Cambio de teoría como Kuhn",
    room: "sur",
    primaryGroup: 1,
    reading: "Why the Child's Theory of Mind Really Is a Theory (Gopnik & Wellman)",
    fragmentFull: "El progreso cognitivo infantil es comparable a la evolución de las teorías científicas: hay reinterpretación de evidencia, hipótesis auxiliares y resistencia al cambio antes de la revisión conceptual completa.",
    fragmentBlanks: "El progreso cognitivo infantil es comparable a la evolución de las [BLANK] científicas: hay reinterpretación de evidencia, hipótesis [BLANK] y resistencia al cambio antes de la revisión [BLANK] completa.",
    blanks: ["teorías", "auxiliares", "conceptual"],
    targetNode: "cambio_conceptual",
    relations: [
      { toNode: "teoria_teoria", type: "apoya", label: "el mecanismo de cambio en TT" },
      { toNode: "modularidad", type: "contradice", label: "TT = cambio; módulo = desarrollo fijo" },
    ],
    color: "#7F77DD",
    icon: "K",
  },
  {
    id: "tt_04",
    title: "ToMM y el juego de ficción",
    room: "sur",
    primaryGroup: 1,
    reading: "Pretending and Believing: Issues in the Theory of ToMM (Leslie)",
    fragmentFull: "El juego de ficción requiere desacoplar una representación primaria para sostener una secundaria sin contaminarla. Este mecanismo de desacoplamiento es precisamente lo que el ToMM provee, y su ausencia explica los déficits en autismo.",
    fragmentBlanks: "El juego de ficción requiere [BLANK] una representación primaria para sostener una [BLANK] sin contaminarla. Este mecanismo de [BLANK] es precisamente lo que el ToMM provee.",
    blanks: ["desacoplar", "secundaria", "desacoplamiento"],
    targetNode: "tomm",
    relations: [
      { toNode: "metarrepresentacion", type: "apoya", label: "desacoplamiento = base de metarrepresentación" },
      { toNode: "autismo", type: "extiende", label: "ausencia de ToMM explica déficit en autismo" },
    ],
    color: "#7F77DD",
    icon: "M",
  },
  {
    id: "tt_05",
    title: "Metarrepresentación",
    room: "sur",
    primaryGroup: 1,
    reading: "Pretending and Believing: Issues in the Theory of ToMM (Leslie)",
    fragmentFull: "El ToMM construye metarrepresentaciones: descripciones de situaciones centradas en el agente que permiten interpretar el comportamiento relacionándolo con las actitudes del agente hacia la verdad de las proposiciones.",
    fragmentBlanks: "El ToMM construye [BLANK]: descripciones de situaciones centradas en el agente que permiten interpretar el comportamiento relacionándolo con las [BLANK] del agente hacia la verdad de las [BLANK].",
    blanks: ["metarrepresentaciones", "actitudes", "proposiciones"],
    targetNode: "metarrepresentacion",
    relations: [
      { toNode: "tomm", type: "apoya", label: "la metarrepresentación es el producto del ToMM" },
      { toNode: "falsa_creencia", type: "extiende", label: "entender FC requiere metarrepresentación" },
    ],
    color: "#7F77DD",
    icon: "R",
  },

  // ── SALA ESTE: Simulación + Interaccionismo ───────────────────────────────
  {
    id: "sim_01",
    title: "La mente como espejo",
    room: "este",
    primaryGroup: 2,
    reading: "Simulation Theory (Shanton & Goldman)",
    fragmentFull: "La lectura mental implica la imitación, copia o re-experiencia de los procesos mentales del objetivo. El simulador usa su propia maquinaria mental como modelo para generar predicciones sobre el estado del otro.",
    fragmentBlanks: "La lectura mental implica la imitación, copia o re-experiencia de los [BLANK] mentales del objetivo. El [BLANK] usa su propia maquinaria mental como modelo para generar [BLANK] sobre el estado del otro.",
    blanks: ["procesos", "simulador", "predicciones"],
    targetNode: "simulacion",
    relations: [
      { toNode: "perspectiva", type: "apoya", label: "simular = adoptar perspectiva del otro" },
      { toNode: "teoria_teoria", type: "contradice", label: "no necesitamos teoría, simulamos" },
    ],
    color: "#1D9E75",
    icon: "S",
  },
  {
    id: "sim_02",
    title: "Neuronas espejo",
    room: "este",
    primaryGroup: 2,
    reading: "Simulation Theory (Shanton & Goldman)",
    fragmentFull: "Las neuronas espejo se activan tanto al realizar una acción como al observarla. Proporcionan un substrato neural para la resonancia motora y afectiva con el otro, consistente con una cuenta simulacionista de la comprensión social.",
    fragmentBlanks: "Las neuronas [BLANK] se activan tanto al realizar una acción como al [BLANK]. Proporcionan un substrato neural para la resonancia [BLANK] y afectiva con el otro.",
    blanks: ["espejo", "observarla", "motora"],
    targetNode: "neuronas_espejo",
    relations: [
      { toNode: "simulacion", type: "apoya", label: "base neural de la simulación" },
      { toNode: "neurociencia_social", type: "extiende", label: "evidencia neurocientífica de ST" },
    ],
    color: "#1D9E75",
    icon: "N",
  },
  {
    id: "sim_03",
    title: "Simulación y memoria episódica",
    room: "este",
    primaryGroup: 2,
    reading: "Simulation Theory (Shanton & Goldman)",
    fragmentFull: "La simulación no solo opera en la lectura mental sino también en la memoria episódica y la prospección. Las tres áreas comparten mecanismos de re-experiencia, lo que sugiere que la simulación es un proceso cognitivo de propósito general.",
    fragmentBlanks: "La simulación no solo opera en la lectura mental sino también en la memoria [BLANK] y la [BLANK]. Las tres áreas comparten mecanismos de re-[BLANK].",
    blanks: ["episódica", "prospección", "experiencia"],
    targetNode: "simulacion",
    relations: [
      { toNode: "neurociencia_social", type: "matiza", label: "simulación más amplia que ToM" },
    ],
    color: "#1D9E75",
    icon: "E",
  },
  {
    id: "int_01",
    title: "La interacción primaria",
    room: "este",
    primaryGroup: 2,
    reading: "The Practice of Mind (Gallagher)",
    fragmentFull: "La intersubjetividad primaria es la coordinación díadica, prelingüística, basada en el contacto afectivo cara a cara entre el bebé y el cuidador. No requiere inferir estados mentales: los estados del otro son directamente perceptibles en su conducta.",
    fragmentBlanks: "La intersubjetividad [BLANK] es la coordinación díadica, prelingüística, basada en el contacto [BLANK] cara a cara. No requiere inferir estados mentales: los estados del otro son directamente [BLANK] en su conducta.",
    blanks: ["primaria", "afectivo", "perceptibles"],
    targetNode: "interaccion_primaria",
    relations: [
      { toNode: "segunda_persona", type: "apoya", label: "la interacción primaria es de segunda persona" },
      { toNode: "teoria_teoria", type: "contradice", label: "no hay teoría en la interacción primaria" },
      { toNode: "simulacion", type: "contradice", label: "tampoco hay simulación, es percepción directa" },
    ],
    color: "#1D9E75",
    icon: "I",
  },
  {
    id: "int_02",
    title: "Intersubjetividad secundaria",
    room: "este",
    primaryGroup: 2,
    reading: "The Practice of Mind (Gallagher)",
    fragmentFull: "La intersubjetividad secundaria surge alrededor de los 9-12 meses e incluye a un objeto compartido: la triada yo-tú-objeto. La atención conjunta y la acción coordinada alrededor de objetos del mundo definen esta etapa.",
    fragmentBlanks: "La intersubjetividad [BLANK] surge alrededor de los 9-12 meses e incluye un objeto [BLANK]: la triada yo-tú-objeto. La atención [BLANK] y la acción coordinada definen esta etapa.",
    blanks: ["secundaria", "compartido", "conjunta"],
    targetNode: "intersubjetividad",
    relations: [
      { toNode: "interaccion_primaria", type: "extiende", label: "la secundaria añade objeto a la díada" },
      { toNode: "segunda_persona", type: "apoya", label: "aún es interacción de segunda persona" },
    ],
    color: "#1D9E75",
    icon: "J",
  },
  {
    id: "int_03",
    title: "Crítica a la perspectiva de terceros",
    room: "este",
    primaryGroup: 2,
    reading: "The Practice of Mind (Gallagher)",
    fragmentFull: "TT y ST definen las relaciones intersubjetivas de manera demasiado estrecha: las limitan a explicar y predecir estados mentales desde una perspectiva de terceros. Pero la interacción cotidiana es principalmente de segunda persona, cara a cara.",
    fragmentBlanks: "TT y ST definen las relaciones [BLANK] de manera demasiado estrecha: las limitan a explicar y predecir estados mentales desde una perspectiva de [BLANK]. Pero la interacción cotidiana es principalmente de [BLANK] persona.",
    blanks: ["intersubjetivas", "terceros", "segunda"],
    targetNode: "segunda_persona",
    relations: [
      { toNode: "teoria_teoria", type: "contradice", label: "TT opera en tercera persona" },
      { toNode: "simulacion", type: "matiza", label: "ST puede ser segunda persona en low-level" },
    ],
    color: "#1D9E75",
    icon: "C",
  },

  // ── SALA OESTE: Modularidad ──────────────────────────────────────────────
  {
    id: "mod_01",
    title: "El módulo ToM",
    room: "oeste",
    primaryGroup: 3,
    reading: "Modularity, Development and Theory of Mind (Scholl & Leslie)",
    fragmentFull: "Un módulo cognitivo es encapsulado informativamente, de dominio específico y con un curso de desarrollo relativamente fijo. La ToM puede estar basada en un módulo y aun así permitir desarrollo: los módulos deben 'entrar en línea' y pueden desarrollarse internamente.",
    fragmentBlanks: "Un módulo cognitivo es [BLANK] informativamente, de dominio [BLANK] y con un curso de desarrollo relativamente fijo. La ToM puede estar basada en un [BLANK] y aun así permitir desarrollo.",
    blanks: ["encapsulado", "específico", "módulo"],
    targetNode: "modularidad",
    relations: [
      { toNode: "encapsulamiento", type: "apoya", label: "encapsulamiento es propiedad clave del módulo" },
      { toNode: "cambio_conceptual", type: "contradice", label: "módulo ≠ cambio teórico libre" },
    ],
    color: "#EF9F27",
    icon: "O",
  },
  {
    id: "mod_02",
    title: "Parametrización del módulo",
    room: "oeste",
    primaryGroup: 3,
    reading: "Modularity, Development and Theory of Mind (Scholl & Leslie)",
    fragmentFull: "La parametrización es el modelo para explicar cómo ocurre el desarrollo dentro de un módulo. Los parámetros del módulo se van fijando según la experiencia, pero el módulo mismo no cambia su naturaleza fundamental.",
    fragmentBlanks: "La [BLANK] es el modelo para explicar cómo ocurre el desarrollo dentro de un módulo. Los [BLANK] del módulo se van fijando según la experiencia, pero el módulo mismo no cambia su naturaleza [BLANK].",
    blanks: ["parametrización", "parámetros", "fundamental"],
    targetNode: "encapsulamiento",
    relations: [
      { toNode: "modularidad", type: "apoya", label: "la parametrización explica desarrollo modular" },
    ],
    color: "#EF9F27",
    icon: "P",
  },
  {
    id: "mod_03",
    title: "Autismo y ToM",
    room: "oeste",
    primaryGroup: 3,
    reading: "Pretending and Believing: Issues in the Theory of ToMM (Leslie)",
    fragmentFull: "Niños con autismo de coeficiente intelectual normal fallan específicamente en tareas de falsa creencia, mientras que niños con síndrome de Down de CI menor las superan. Esta disociación doble es evidencia de un déficit modular selectivo, no de un déficit general.",
    fragmentBlanks: "Niños con autismo de CI normal fallan específicamente en tareas de [BLANK] creencia, mientras que niños con síndrome de Down las [BLANK]. Esta [BLANK] doble es evidencia de un déficit modular selectivo.",
    blanks: ["falsa", "superan", "disociación"],
    targetNode: "autismo",
    relations: [
      { toNode: "tomm", type: "apoya", label: "autismo = déficit en ToMM" },
      { toNode: "modularidad", type: "apoya", label: "disociación = evidencia de módulo" },
      { toNode: "falsa_creencia", type: "extiende", label: "FC es la tarea diagnóstica" },
    ],
    color: "#EF9F27",
    icon: "A",
  },

  // ── SALA NORTE: Neurociencia + Integración ───────────────────────────────
  {
    id: "neu_01",
    title: "El límite de la neuroimagen",
    room: "norte",
    primaryGroup: 3,
    reading: "Beyond Simulation-Theory and Theory-Theory (Apperly)",
    fragmentFull: "La investigación conductual no ha logrado proporcionar métodos claros para discriminar entre TT y ST. Los datos de neuroimagen tampoco han logrado discriminar realmente entre ambas respecto a la adscripción de actitudes proposicionales.",
    fragmentBlanks: "La investigación [BLANK] no ha logrado proporcionar métodos claros para discriminar entre TT y ST. Los datos de [BLANK] tampoco han logrado discriminar entre ambas respecto a la adscripción de actitudes [BLANK].",
    blanks: ["conductual", "neuroimagen", "proposicionales"],
    targetNode: "neurociencia_social",
    relations: [
      { toNode: "teoria_teoria", type: "matiza", label: "la neuroimagen no confirma ni refuta TT" },
      { toNode: "simulacion", type: "matiza", label: "tampoco confirma ni refuta ST" },
    ],
    color: "#D4537E",
    icon: "L",
  },
  {
    id: "neu_02",
    title: "Más allá de TT y ST",
    room: "norte",
    primaryGroup: 3,
    reading: "Beyond Simulation-Theory and Theory-Theory (Apperly)",
    fragmentFull: "El problema radica en el debate ST/TT mismo, no en los métodos de la neurociencia. La neuroimagen debe contribuir al desarrollo de modelos teóricos más fundamentados en procesos cognitivos y neuronales específicos.",
    fragmentBlanks: "El problema radica en el debate [BLANK] mismo, no en los métodos de la neurociencia. La neuroimagen debe contribuir al desarrollo de modelos [BLANK] más fundamentados en procesos [BLANK] específicos.",
    blanks: ["ST/TT", "teóricos", "cognitivos"],
    targetNode: "neurociencia_social",
    relations: [
      { toNode: "tipo1_tipo2", type: "extiende", label: "propone ir hacia modelos de proceso dual" },
    ],
    color: "#D4537E",
    icon: "B",
  },
  {
    id: "int2_01",
    title: "Sistema dual en ToM",
    room: "norte",
    primaryGroup: 3,
    reading: "Toward an Integrative Account of Social Cognition (Bohl & van den Bos)",
    fragmentFull: "Los procesos de Tipo 1 son rápidos, eficientes e impulsados por estímulos, asociados al interaccionismo. Los de Tipo 2 son lentos, costosos y flexibles, asociados a la ToM clásica. La interacción social real suele involucrar ambos simultáneamente.",
    fragmentBlanks: "Los procesos de Tipo [BLANK] son rápidos, eficientes e impulsados por estímulos. Los de Tipo [BLANK] son lentos, costosos y flexibles. La interacción social real suele involucrar [BLANK] simultáneamente.",
    blanks: ["1", "2", "ambos"],
    targetNode: "tipo1_tipo2",
    relations: [
      { toNode: "simulacion", type: "matiza", label: "ST ≈ Tipo 1 en low-level" },
      { toNode: "teoria_teoria", type: "matiza", label: "TT ≈ Tipo 2" },
      { toNode: "interaccion_primaria", type: "apoya", label: "interaccionismo ≈ Tipo 1" },
    ],
    color: "#D4537E",
    icon: "D",
  },
  {
    id: "int2_02",
    title: "Integración: no son opuestos",
    room: "norte",
    primaryGroup: 3,
    reading: "Toward an Integrative Account of Social Cognition (Bohl & van den Bos)",
    fragmentFull: "El objetivo es superar la visión de ToM e interaccionismo como oponentes mutuamente excluyentes y crear un marco teórico único y comprensivo que explique cómo ambos tipos de proceso se coordinan en la cognición social real.",
    fragmentBlanks: "El objetivo es superar la visión de ToM e interaccionismo como [BLANK] mutuamente excluyentes y crear un marco [BLANK] único que explique cómo ambos tipos de proceso se [BLANK] en la cognición social real.",
    blanks: ["oponentes", "teórico", "coordinan"],
    targetNode: "tipo1_tipo2",
    relations: [
      { toNode: "neurociencia_social", type: "apoya", label: "el marco integrador necesita la neurociencia" },
      { toNode: "modularidad", type: "matiza", label: "el módulo podría ser el Tipo 1" },
    ],
    color: "#D4537E",
    icon: "G",
  },
];

// ── Concept map nodes ─────────────────────────────────────────────────────────

export type MapNode = {
  id: ArtifactNode;
  label: string;
  x: number; // 0-1 relative position
  y: number;
  group: 1 | 2 | 3 | 0; // 0 = central/shared
  description: string;
  color: string;
};

export const MAP_NODES: MapNode[] = [
  { id: "teoria_teoria",      label: "Teoría-Teoría",          x: 0.25, y: 0.75, group: 1, color: "#7F77DD", description: "Los niños construyen teorías implícitas sobre la mente" },
  { id: "falsa_creencia",     label: "Falsa creencia",         x: 0.15, y: 0.55, group: 1, color: "#7F77DD", description: "La tarea paradigmática de ToM: entender que otro puede creer algo falso" },
  { id: "tomm",               label: "ToMM",                   x: 0.35, y: 0.55, group: 1, color: "#7F77DD", description: "Mecanismo de Teoría de la Mente (Leslie)" },
  { id: "metarrepresentacion",label: "Metarrepresentación",    x: 0.30, y: 0.35, group: 1, color: "#534AB7", description: "Representar representaciones — base del ToMM" },
  { id: "cambio_conceptual",  label: "Cambio conceptual",      x: 0.12, y: 0.35, group: 1, color: "#534AB7", description: "La ToM se desarrolla como una teoría científica" },
  { id: "autismo",            label: "Autismo y ToM",          x: 0.50, y: 0.70, group: 0, color: "#888780", description: "Déficit selectivo en ToM como evidencia del módulo" },
  { id: "simulacion",         label: "Simulación",             x: 0.75, y: 0.75, group: 2, color: "#1D9E75", description: "Comprender al otro simulando sus estados desde dentro" },
  { id: "neuronas_espejo",    label: "Neuronas espejo",        x: 0.88, y: 0.55, group: 2, color: "#1D9E75", description: "Substrato neural de la resonancia motora y afectiva" },
  { id: "perspectiva",        label: "Toma de perspectiva",    x: 0.68, y: 0.55, group: 2, color: "#0F6E56", description: "Adoptar el punto de vista del otro" },
  { id: "interaccion_primaria",label:"Interacción primaria",   x: 0.80, y: 0.35, group: 2, color: "#0F6E56", description: "Coordinación díadica prelingüística" },
  { id: "intersubjetividad",  label: "Intersubjetividad",      x: 0.65, y: 0.35, group: 2, color: "#1D9E75", description: "Comprensión mutua en la interacción cara a cara" },
  { id: "segunda_persona",    label: "Segunda persona",        x: 0.72, y: 0.18, group: 2, color: "#0F6E56", description: "La relación directa yo-tú, no observación de terceros" },
  { id: "modularidad",        label: "Modularidad",            x: 0.50, y: 0.45, group: 3, color: "#EF9F27", description: "ToM como módulo cognitivo innato y específico" },
  { id: "encapsulamiento",    label: "Encapsulamiento",        x: 0.50, y: 0.25, group: 3, color: "#BA7517", description: "El módulo no accede libremente a otros sistemas" },
  { id: "tipo1_tipo2",        label: "Tipo 1 / Tipo 2",        x: 0.50, y: 0.08, group: 3, color: "#D4537E", description: "Procesos automáticos vs. deliberativos en ToM" },
  { id: "neurociencia_social",label: "Neurociencia social",    x: 0.50, y: 0.62, group: 0, color: "#888780", description: "Modelos neurales de la cognición social" },
];
