export type Question = {
  id: number;
  article: string;
  q: string;
  opts: string[];
  ans: number;
  explanation: string;
  group: 1 | 2 | 3;
};

export const QUESTIONS: Question[] = [
  // --- GROUP 1: Teoría-Teoría ---
  {
    id: 1, group: 1,
    article: "Why the Child's Theory of Mind Really Is a Theory (Wellman)",
    q: "Según Wellman, ¿por qué el conocimiento infantil sobre la mente es una verdadera 'teoría'?",
    opts: ["Porque los niños aprenden reglas explícitas en el colegio","Porque es un sistema coherente de conceptos que genera predicciones","Porque imitan las teorías adultas por observación","Porque está modularmente encapsulado desde el nacimiento"],
    ans: 1,
    explanation: "Wellman: la ToM infantil es un sistema conceptual coherente que organiza evidencia y genera predicciones, como cualquier teoría científica — aunque sea implícita.",
  },
  {
    id: 2, group: 1,
    article: "Why the Child's Theory of Mind Really Is a Theory (Wellman)",
    q: "¿Qué cambio conceptual describe Wellman entre los 3 y los 5 años?",
    opts: ["Pasa de psicología del deseo a psicología de creencia-deseo","El módulo ToMM madura neurológicamente","Empieza a simular perspectivas ajenas","Aparece la interacción de segunda persona"],
    ans: 0,
    explanation: "Wellman describe la transición de una psicología basada solo en deseos (3 años) a una que incorpora creencias representacionales (4-5 años): un cambio teórico genuino.",
  },
  {
    id: 3, group: 1,
    article: "Why the Child's Theory of Mind Really Is a Theory (Wellman)",
    q: "¿En qué se parece la ToM infantil al trabajo de un científico, según Wellman?",
    opts: ["Ambos usan laboratorios para confirmar hipótesis","Ambos construyen teorías revisables a partir de la evidencia","Ambos dependen de un módulo innato","Ambos requieren lenguaje formal para operar"],
    ans: 1,
    explanation: "Para Wellman, los niños son 'científicos intuitivos': construyen, usan y eventualmente revisan teorías sobre la mente según la evidencia disponible.",
  },
  {
    id: 4, group: 1,
    article: "Pretending and believing: issues in the theory of ToMM (Leslie)",
    q: "Leslie propone que el juego de ficción requiere ToMM porque:",
    opts: ["Implica simular los estados mentales de un compañero imaginario","Requiere desacoplar una representación primaria para sostener una secundaria sin contaminarla","Activa la interacción de segunda persona con objetos","Evidencia un cambio en la teoría implícita del niño"],
    ans: 1,
    explanation: "Para Leslie, 'el plátano es un teléfono' exige mantener dos representaciones simultáneas sin que la secundaria (ficticia) contamine la primaria (real). Ese mecanismo ES el ToMM.",
  },
  {
    id: 5, group: 1,
    article: "Pretending and believing: issues in the theory of ToMM (Leslie)",
    q: "¿Qué predice la teoría de Leslie sobre niños con autismo respecto al juego simbólico?",
    opts: ["Jugarán igual que niños típicos porque el juego no requiere ToMM","Mostrarán déficits en juego simbólico por disfunción del mecanismo de desacoplamiento","Compensarán con simulación offline de estados ajenos","Desarrollarán el juego simbólico más tarde pero de forma completa"],
    ans: 1,
    explanation: "Si el ToMM está afectado, el mecanismo de desacoplamiento falla → déficit en juego simbólico. Esto es consistente con la evidencia empírica en autismo.",
  },
  {
    id: 6, group: 1,
    article: "Pretending and believing: issues in the theory of ToMM (Leslie)",
    q: "En el modelo de Leslie, ¿qué diferencia una 'representación primaria' de una 'representación secundaria'?",
    opts: ["La primaria es falsa; la secundaria es verdadera","La primaria copia la realidad directamente; la secundaria está desacoplada y puede ser ficticia o hipotética","La primaria requiere lenguaje; la secundaria es preverbal","La primaria es consciente; la secundaria es automática"],
    ans: 1,
    explanation: "Representación primaria = copia directa del mundo (verdadera, literal). Representación secundaria = desacoplada, puede ser contrafáctica, ficticia o atribuida a otro agente.",
  },

  // --- GROUP 2: Simulación e Interaccionismo ---
  {
    id: 7, group: 2,
    article: "Simulation theory (Gordon / Goldman)",
    q: "¿Cuál es la afirmación central de la Teoría de la Simulación?",
    opts: ["Necesitamos una teoría explícita para comprender la mente ajena","Usamos nuestra propia maquinaria mental para simular off-line al otro","La comprensión social emerge de la interacción corporal directa","Un módulo innato procesa los estados mentales ajenos"],
    ans: 1,
    explanation: "La simulación propone que 'nos ponemos en el lugar del otro' usando nuestros propios sistemas cognitivos y afectivos como modelo — sin necesitar teorías abstractas.",
  },
  {
    id: 8, group: 2,
    article: "Simulation theory (Gordon / Goldman)",
    q: "¿Qué rol juegan las neuronas espejo en la versión neurocientífica de la Teoría de la Simulación?",
    opts: ["Implementan el módulo ToMM en el córtex prefrontal","Proveen un substrato neural para la resonancia motora y afectiva con el otro","Generan representaciones secundarias desacopladas","Son el mecanismo de la interacción de primera persona"],
    ans: 1,
    explanation: "Las neuronas espejo se activan tanto al hacer una acción como al observarla → resonancia motora. Algunos teóricos las ven como el substrato de la simulación encarnada.",
  },
  {
    id: 9, group: 2,
    article: "Simulation theory (Gordon / Goldman)",
    q: "Goldman distingue entre simulación 'low-level' y 'high-level'. ¿Cuál es la diferencia?",
    opts: ["Low-level es consciente; high-level es automática","Low-level es automática y somática (ej. contagio emocional); high-level es deliberada y mental","Low-level opera en adultos; high-level en niños","Son sinónimos usados por distintos autores"],
    ans: 1,
    explanation: "Simulación low-level: automática, somática, preverbal (imitar expresiones, contagio emocional). High-level: deliberada, implica adoptar intencionalmente la perspectiva ajena.",
  },
  {
    id: 10, group: 2,
    article: "The Practice of Mind: Theory, Simulation or Primary Interaction? (Gallagher)",
    q: "¿Cuál es la crítica central de Gallagher tanto a la Teoría-Teoría como a la Simulación?",
    opts: ["Ambas ignoran el rol del módulo ToMM","Ambas asumen que comprender al otro requiere procesos inferenciales internos, ignorando la comprensión directa en la interacción","Ambas son incompatibles con la evidencia neurocientífica","Ambas sobrevaloran el rol del lenguaje en la ToM"],
    ans: 1,
    explanation: "Gallagher: TT y TS asumen que primero percibimos conducta y luego inferimos mente. Él propone que en la interacción cara a cara, los estados del otro son directamente visibles — no inferidos.",
  },
  {
    id: 11, group: 2,
    article: "The Practice of Mind: Theory, Simulation or Primary Interaction? (Gallagher)",
    q: "¿Qué significa 'intersubjetividad primaria' en el marco de Gallagher y Trevarthen?",
    opts: ["La capacidad de los niños de 4 años para pasar la tarea de falsa creencia","La coordinación díadica (yo-tú) prelingüística basada en el contacto afectivo cara a cara","La simulación automática de estados emocionales del cuidador","El módulo de atención conjunta que madura a los 9-12 meses"],
    ans: 1,
    explanation: "Intersubjetividad primaria (0-9 meses): coordinación directa, díadica, afectiva entre bebé y cuidador — sin necesidad de representar estados mentales.",
  },
  {
    id: 12, group: 2,
    article: "The Practice of Mind: Theory, Simulation or Primary Interaction? (Gallagher)",
    q: "¿Qué añade la 'intersubjetividad secundaria' a la primaria?",
    opts: ["El lenguaje formal para describir estados mentales","La inclusión de objetos compartidos en la interacción: atención conjunta y acción compartida","La capacidad de simular off-line perspectivas ajenas","La maduración del módulo ToMM"],
    ans: 1,
    explanation: "Intersubjetividad secundaria (9-12 meses en adelante): la triada yo-tú-objeto. Atención conjunta, referencia social y acción coordinada alrededor de objetos del mundo.",
  },
  {
    id: 13, group: 2,
    article: "Beyond Simulation-Theory and Theory-Theory (Saxe et al.)",
    q: "¿Por qué Saxe argumenta que la neurociencia cognitiva social debería usar sus propios conceptos en lugar de TT o TS?",
    opts: ["Porque TT y TS son teorías filosóficas sin valor empírico","Porque el nivel de análisis neural no se mapea limpiamente a los constructos de TT/TS, y fuerza el encaje distorsiona los hallazgos","Porque el fMRI no puede medir estados mentales","Porque TT y TS ya han sido refutadas experimentalmente"],
    ans: 1,
    explanation: "Saxe: forzar datos neurales en el molde TT vs TS crea pseudoexplicaciones. La neurociencia debe construir sus propios modelos del nivel computacional-neural de la cognición social.",
  },

  // --- GROUP 3: Modularidad e Integración ---
  {
    id: 14, group: 3,
    article: "Modularity, development and Theory of Mind (Baron-Cohen / Scholl & Leslie)",
    q: "¿Qué significa que el ToMM sea un módulo en el sentido de Fodor?",
    opts: ["Que es aprendido culturalmente y varía entre sociedades","Que es encapsulado informativamente, de dominio específico, y de desarrollo relativamente fijo","Que puede ser simulado mediante introspección deliberada","Que es idéntico en todas las especies de primates"],
    ans: 1,
    explanation: "Un módulo fodoriano: encapsulado (no accede libremente a otros sistemas), dominio-específico (procesa solo cierto input), con curso de desarrollo canónico.",
  },
  {
    id: 15, group: 3,
    article: "Modularity, development and Theory of Mind (Baron-Cohen / Scholl & Leslie)",
    q: "Baron-Cohen propone una secuencia de cuatro mecanismos para ToM. ¿Cuáles son?",
    opts: ["TT → TS → Módulo → Integración","ID (detector de intencionalidad) → EDD (detector de dirección ocular) → SAM (mecanismo de atención compartida) → ToMM","Simulación → Teoría → Módulo → Práctica","Deseo → Creencia → Falsa creencia → Metarrepresentación"],
    ans: 1,
    explanation: "Baron-Cohen: ID detecta agentes con metas; EDD detecta hacia dónde mira el agente; SAM integra yo-agente-objeto en triada; ToMM atribuye estados mentales completos.",
  },
  {
    id: 16, group: 3,
    article: "Modularity, development and Theory of Mind (Baron-Cohen / Scholl & Leslie)",
    q: "¿Qué evidencia del autismo usa Baron-Cohen para apoyar la modularidad de ToM?",
    opts: ["Los niños con autismo fallan todas las tareas cognitivas por igual","Los niños con autismo con CI normal fallan específicamente tareas de falsa creencia, sugiriendo un déficit modular selectivo","Los niños con autismo desarrollan ToM más tarde pero completamente","Los niños con autismo compensan con simulación lo que les falta en el módulo"],
    ans: 1,
    explanation: "Disociación doble: niños con autismo de CI normal fallan ToM; niños con síndrome de Down con CI menor suelen pasar ToM. Esto sugiere un déficit específico, no general.",
  },
  {
    id: 17, group: 3,
    article: "Toward an integrative account of social cognition (Apperly & Butterfill)",
    q: "¿Qué distingue el Sistema 1 del Sistema 2 en el modelo de Apperly & Butterfill?",
    opts: ["S1 opera solo en adultos; S2 en niños","S1 es rápido, automático y de bajo costo cognitivo; S2 es flexible, explícito y costoso","S1 procesa creencias; S2 procesa deseos","Son dos nombres para el mismo proceso en contextos distintos"],
    ans: 1,
    explanation: "S1 (implícito): eficiente pero limitado en lo que puede representar. S2 (explícito): flexible y completo, pero requiere recursos cognitivos. Ambos coexisten en adultos.",
  },
  {
    id: 18, group: 3,
    article: "Toward an integrative account of social cognition (Apperly & Butterfill)",
    q: "¿Qué fenómeno empírico motivó la propuesta del sistema dual en Apperly & Butterfill?",
    opts: ["Los niños de 4 años pasan la tarea de falsa creencia","Adultos con alta carga cognitiva fallan tareas explícitas de ToM pero mantienen respuestas implícitas correctas","Los bebés de 6 meses ya muestran ToM completa","El autismo afecta igualmente respuestas implícitas y explícitas"],
    ans: 1,
    explanation: "Bajo carga cognitiva, adultos fallan tareas verbales de ToM pero sus miradas anticipatorias siguen siendo correctas. Esto evidencia disociación entre S1 (implícito) y S2 (explícito).",
  },
  {
    id: 19, group: 3,
    article: "Toward an integrative account of social cognition (Apperly & Butterfill)",
    q: "¿Cómo explica el modelo de Apperly & Butterfill que bebés de 15 meses muestren comprensión de falsa creencia implícita pero fallen la tarea explícita a los 3 años?",
    opts: ["Los bebés tienen más capacidad cognitiva que los niños de 3 años","A los 15 meses opera S1 (implícito, eficiente); la tarea explícita a los 3 años requiere S2 que aún no está maduro","El módulo ToMM madura antes que el lenguaje","Los bebés simulan; los niños de 3 usan teorías que aún son incorrectas"],
    ans: 1,
    explanation: "El sistema implícito (S1) opera tempranamente y produce respuestas correctas en paradigmas de mirada. El sistema explícito (S2) requiere más desarrollo y mayor capacidad de trabajo.",
  },
  {
    id: 20, group: 3,
    article: "Toward an integrative account of social cognition (Apperly & Butterfill)",
    q: "¿Por qué el modelo integrador no simplemente elimina la distinción TT vs TS?",
    opts: ["Porque ambas teorías son igualmente correctas y no hay que elegir","Porque S1 podría ser mejor descrito por simulación y S2 por teoría, pero ambos son necesarios para la cognición social completa","Porque la modularidad niega la posibilidad de sistemas múltiples","Porque el interaccionismo ya resolvió el problema"],
    ans: 1,
    explanation: "El modelo integrador absorbe la distinción: S1 (automático, encarnado) puede verse como simulación; S2 (explícito, proposicional) como teoría. La novedad es que ambos coexisten y se complementan.",
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
