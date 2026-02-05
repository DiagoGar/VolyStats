/**
 * VOLLEY-MODEL.TS
 * 
 * Modelo conceptual del sistema de voleibol.
 * Define la verdad del dominio sin UI, sin cálculos, sin suposiciones implícitas.
 * 
 * PRINCIPIOS FUNDAMENTALES:
 * 
 * 1. ROL ≠ POSICIÓN ≠ ZONA
 *    - Rol: función del jugador en el sistema de juego (armador, punta, central, etc)
 *    - Posición: dónde está parado en la rotación actual (1-6)
 *    - Zona: desde dónde ejecuta una acción (1-6 en cancha)
 * 
 * 2. LAS ACCIONES PERTENECEN A JUGADORES, NO A ZONAS
 *    - Una acción es ejecutada por un jugador con un rol
 *    - La zona es contexto de dónde ejecutó
 *    - Un punta puede atacar desde cualquier zona
 * 
 * 3. LA ROTACIÓN ES ESTADO DEL EQUIPO
 *    - No es propiedad del jugador
 *    - No es propiedad de la acción
 *    - Define dónde está cada jugador EN ESTE MOMENTO
 * 
 * 4. EL MODELO DEBE PERMITIR INCONSISTENCIAS REALES
 *    - Un punta atacando desde zaguero (posición 5-6)
 *    - Un armador defendiendo en primera línea
 *    - Un jugador fuera de su zona "ideal"
 */

// ============================================================================
// ENTIDAD: JUGADOR (Player)
// ============================================================================
/**
 * Un jugador es una entidad individual en el voleibol.
 * 
 * Responsabilidades:
 * - Identificarse de forma única
 * - Tener un rol primario (su función principal)
 * - Poder ejecutar acciones
 * 
 * Lo que NO es:
 * - La posición actual en cancha (eso es responsabilidad de la Rotación)
 * - Propiedad de una acción (la acción referencia al jugador)
 */
export interface Player {
  // Identificación
  id: string; // UUID único
  number: number; // Número de dorsal (1-14 en voleibol)
  name: string;

  // Rol principal (función en el equipo)
  primaryRole: PlayerRole;

  // Metadatos
  height?: number; // cm
  position?: string; // ej: "1.95m, armador técnico"
  notes?: string;
}

// ============================================================================
// CONCEPTO: ROL DEL JUGADOR (PlayerRole)
// ============================================================================
/**
 * El rol define la función táctica y técnica del jugador.
 * 
 * Cada rol tiene características, responsabilidades y zonas "ideales":
 * 
 * - ARMADOR (Setter): Toca casi todas las pelotas en ataque, distribuye
 * - OPUESTO (Opposite): Ataca cuando no hay levantamiento, defensa débil
 * - PUNTA: Ataca desde primera línea, bloquea
 * - CENTRAL: Bloquea principalmente, ataca poco
 * - LÍBERO: Especialista defensivo, no bloquea, no saca
 * - ZAGUERO: Defensa de fondo, puede ser versátil
 * 
 * Un jugador tiene UN rol primario pero puede cumplir otros roles.
 */
export type PlayerRole =
  | 'armador' // Setter/Levantador
  | 'opuesto' // Opposite/Reverso
  | 'punta' // Wing/Wing-spiker (izquierda o derecha)
  | 'central' // Middle blocker
  | 'libero' // Defensive specialist
  | 'zaguero'; // Back-row player (versátil)

// ============================================================================
// ENTIDAD: EQUIPO (Team)
// ============================================================================
/**
 * Un equipo es una colección de jugadores.
 * 
 * Responsabilidades:
 * - Identificar un conjunto de jugadores
 * - Mantener su formación táctica
 * 
 * Lo que NO es:
 * - La alineación actual (eso es la Rotación)
 * - El estado del partido (eso es el Partido)
 */
export interface Team {
  id: string;
  name: string;
  players: Player[];
  
  // Metadatos
  color?: string; // Color del uniforme
  coach?: string; // Entrenador
  createdAt: number; // timestamp
}

// ============================================================================
// CONCEPTO: POSICIÓN EN CANCHA (CourtPosition)
// ============================================================================
/**
 * Posición de un jugador en LA ROTACIÓN ACTUAL.
 * 
 * Mapa visual de posiciones (vista desde el equipo atacante):
 * 
 *       Posición 3 (Centro delantera)
 *      /                            \
 *   Pos 2 (Izq. delantera)    Pos 4 (Der. delantera)
 *    /                              \
 * Pos 1 (Izq. trasera)         Pos 5 (Der. trasera)
 *    \                              /
 *       Pos 6 (Centro trasera)
 * 
 * Rotación: 1→2→3→4→5→6→1
 * 
 * Primera línea: 2, 3, 4
 * Segunda línea: 1, 6, 5
 * 
 * Nota: Las posiciones 2, 3, 4 CAMBIAN CONTINUAMENTE durante el set.
 * Las posiciones son relativas a la rotación del equipo, no fijas en cancha.
 */
export type CourtPosition = 1 | 2 | 3 | 4 | 5 | 6;

// ============================================================================
// CONCEPTO: ZONA DE ACCIÓN (ActionZone)
// ============================================================================
/**
 * La zona define DESDE DÓNDE se ejecuta una acción.
 * 
 * No es lo mismo que posición en cancha.
 * Un jugador en POSICIÓN 2 puede ejecutar una acción DESDE ZONA 6.
 * 
 * Ejemplo: Un armador que estaba en posición 1 (trasera) va a tocar a frente
 * en posición 4, pero toca la pelota en zona 6 (trasera) porque retrocedió.
 * 
 * Las zonas en voleibol son abstractas pero útiles para análisis:
 * - Zonas 1-6: igual que posiciones (a veces coinciden)
 * - Pero conceptualmente, la zona es "desde dónde" se hace la acción
 */
export type ActionZone = 1 | 2 | 3 | 4 | 5 | 6;

// ============================================================================
// ENTIDAD: ROTACIÓN (Rotation/RotationState)
// ============================================================================
/**
 * Una rotación es una FOTOGRAFÍA del estado del equipo en un momento.
 * 
 * Define:
 * - Qué jugador está en cada posición (1-6)
 * - Quién es el armador actual
 * - Qué sistema de juego se está usando
 * 
 * La rotación NO define:
 * - Dónde estará después del siguiente punto (eso es una NUEVA rotación)
 * - Dónde está cada jugador cuando llega la pelota fuera de su zona
 * - Quién debería estar dónde (eso es lo ideal, no la realidad)
 * 
 * Cambio de rotación:
 * Cuando EL EQUIPO gana un punto de saque, ROTA.
 * Los jugadores se mueven en posición clockwise (1→2→3→4→5→6→1).
 */
export interface Rotation {
  id: string;
  teamId: string;
  
  // Mapeo: posición → jugador
  positions: Record<CourtPosition, Player>;
  
  // Información táctica
  setter: Player; // El jugador que levanta
  rotationSystem: RotationSystem; // 5-1, 4-2, 6-2, etc
  
  // Estado
  currentRotationNumber: number; // 0-5 (hay 6 rotaciones en voleibol)
  
  // Metadatos
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// CONCEPTO: SISTEMA DE ROTACIÓN (RotationSystem)
// ============================================================================
/**
 * Estrategia táctica de cómo se distribuyen los jugadores.
 * 
 * - 5-1: Un armador, 5 atacantes. El armador rota de frente a trasera.
 * - 4-2: Dos armadores (bandas), 4 atacantes.
 * - 6-2: Dos armadores (trasera), 4 atacantes en frente.
 * - 6-3: Tres armadores (uno en frente, dos en trasera) + 3 atacantes.
 * 
 * El sistema NO define cómo juegan, solo la distribución de roles.
 */
export type RotationSystem = '5-1' | '4-2' | '6-2' | '6-3';

// ============================================================================
// ENTIDAD: ACCIÓN (Action)
// ============================================================================
/**
 * Una acción es cualquier cosa que hace un jugador con la pelota.
 * 
 * Ejemplos: ataque, saque, recepción, bloqueo, pase, toque.
 * 
 * Responsabilidades:
 * - Registrar QUÉ pasó
 * - Registrar QUIÉN lo hizo
 * - Registrar CUÁNDO (relativo al partido)
 * - Registrar DÓNDE (zona desde la que se ejecutó)
 * - Registrar el RESULTADO
 * 
 * Nota: Una acción ocurre en un contexto de rotación.
 * El jugador que ejecuta la acción está en una posición específica.
 * Pero la acción se ejecuta DESDE una zona (que puede no coincidir con su posición).
 */
export interface Action {
  id: string;
  
  // Quién
  playerId: string;
  playerRole: PlayerRole; // Rol del jugador cuando ejecutó la acción
  
  // Qué
  actionType: ActionType;
  
  // Dónde
  zone: ActionZone; // Desde dónde se ejecutó la acción
  position?: CourtPosition; // Posición en cancha (opcional, para análisis)
  
  // Contexto
  rotationId: string; // En qué rotación ocurrió
  
  // Resultado
  evaluation?: ActionEvaluation; // Cómo salió
  targetZone?: ActionZone; // Hacia dónde fue (si aplica)
  
  // Metadatos
  timestamp: number; // Momento dentro del set
  setNumber: number;
  pointNumber: number; // Qué punto fue cuando ocurrió esto
}

// ============================================================================
// CONCEPTO: TIPO DE ACCIÓN (ActionType)
// ============================================================================
/**
 * Categoriza la naturaleza de la acción.
 * 
 * Permite extensión futura: ataque, saque, recepción, bloqueo, pase, etc.
 */
export type ActionType =
  | 'ataque' // Golpe ofensivo
  | 'saque' // Saque
  | 'recepcion' // Defensa/Recepción
  | 'bloqueo' // Bloqueo
  | 'pase' // Toque de pase
  | 'levantamiento' // Armador tocando
  | 'otro';

// ============================================================================
// CONCEPTO: EVALUACIÓN DE ACCIÓN (ActionEvaluation)
// ============================================================================
/**
 * Cómo resultó la acción.
 * 
 * Sistema: #, ++, +, /, -, --
 * 
 * - # = Punto directo (ganar el punto al ejecutar)
 * - ++ = Muy positivo (excelente, genera oportunidad)
 * - + = Positivo (bien ejecutado)
 * - / = Neutro (ni bueno ni malo)
 * - - = Negativo (error no crítico)
 * - -- = Error directo (pierde el punto)
 */
export type ActionEvaluation = '#' | '++' | '+' | '/' | '-' | '--';

// ============================================================================
// ENTIDAD: PARTIDO (Match)
// ============================================================================
/**
 * Un partido es la entidad de nivel superior que contiene TODO.
 * 
 * Responsabilidades:
 * - Agrupar los dos equipos
 * - Mantener el historial de acciones
 * - Registrar rotaciones
 * - Mantener score
 * 
 * El partido es una LÍNEA DE TIEMPO de eventos.
 */
export interface Match {
  id: string;
  
  // Equipos
  homeTeam: Team;
  awayTeam: Team;
  
  // Acciones (línea de tiempo)
  actions: Action[];
  
  // Rotaciones (estado actual de cada equipo)
  homeRotations: Rotation[]; // Historial de rotaciones
  awayRotations: Rotation[];
  
  currentHomeRotation: Rotation; // Rotación actual
  currentAwayRotation: Rotation;
  
  // Score
  homeScore: number;
  awayScore: number;
  currentSet: number; // 1-5 (máximo)
  
  // Metadatos
  status: 'setup' | 'in-progress' | 'finished';
  startedAt?: number;
  endedAt?: number;
  createdAt: number;
}

// ============================================================================
// RELACIONES CONCEPTUALES
// ============================================================================
/**
 * PARTIDO
 *   ├── EQUIPO (HOME)
 *   │   ├── JUGADOR 1
 *   │   ├── JUGADOR 2
 *   │   └── ... JUGADOR N
 *   │
 *   ├── EQUIPO (AWAY)
 *   │   ├── JUGADOR 1
 *   │   └── ... JUGADOR N
 *   │
 *   ├── ROTACIÓN HOME ACTUAL
 *   │   ├── Posición 1 → Jugador X
 *   │   ├── Posición 2 → Jugador Y
 *   │   └── ... Posición 6 → Jugador Z
 *   │
 *   ├── ROTACIÓN AWAY ACTUAL
 *   │   └── (igual estructura)
 *   │
 *   └── ACCIONES (historial cronológico)
 *       ├── Acción 1: Jugador X atacó desde zona 4, resultado ++
 *       ├── Acción 2: Jugador Y recibió desde zona 1, resultado +
 *       └── ... Acción N
 */

// ============================================================================
// GARANTÍAS DEL MODELO
// ============================================================================
/**
 * 
 * ✅ PUEDE REPRESENTAR:
 * 
 * 1. Un partido real completo
 *    - Dos equipos, varios jugadores, múltiples sets
 * 
 * 2. Inconsistencias reales
 *    - Un punta atacando desde zona 6 (está fuera de posición)
 *    - Un armador defendiendo en primera línea
 *    - Un jugador sustituyendo a otro a mitad del set
 * 
 * 3. Cambios de rotación
 *    - Cuando un equipo gana su saque, sus 6 jugadores rotan
 * 
 * 4. Análisis táctico
 *    - "¿Desde qué zona atacó este jugador?"
 *    - "¿Cuál fue su rol cuando ejecutó la acción?"
 *    - "¿Cuál era la rotación cuando ocurrió?"
 * 
 * 5. Extensiones futuras
 *    - Nuevos tipos de acciones
 *    - Nuevas evaluaciones
 *    - Nuevos sistemas de juego
 *    - Bloqueos, recepciones complejas, etc.
 * 
 * ❌ NO ASUME:
 * 
 * 1. Que los jugadores están siempre en su "zona ideal"
 * 2. Que un rol es una posición
 * 3. Que una zona es una posición
 * 4. Que las acciones son automáticas basadas en zona
 * 5. Que el modelo sabe "qué debería pasar" (eso es lógica, no modelo)
 */

// ============================================================================
// CRITERIO DE ÉXITO
// ============================================================================
/**
 * 
 * Este modelo se considera COMPLETO si:
 * 
 * ✓ Se puede describir un partido completo solo con estas entidades
 *   "HOME atacó desde zona 4, jugador #10 (punta), evaluación ++,
 *    en rotación 1. AWAY recibió desde zona 5, jugador #2 (central),
 *    evaluación +. HOME en posición 3, AWAY en posición 2."
 * 
 * ✓ Se puede explicar qué pasó sin dibujar nada
 *   Usando solo los tipos definidos, sin conceptos implícitos.
 * 
 * ✓ El modelo permite crecer sin romperse
 *   Agregar ActionType='bloqueo', nuevas evaluaciones, etc.
 *   No requiere refactorizar el core.
 * 
 * ✓ No hay decisiones implícitas
 *   Todo es explícito. Si falta dato, lo sabremos.
 *   No hay "asumir que el armador es siempre posición 1" (falso).
 */
