/**
 * PRINCIPIOS DE DISEÑO DEL MODELO DE VOLEIBOL
 * 
 * Reglas explícitas para mantener consistencia y evitar mezclas conceptuales.
 * Leer antes de agregar cualquier funcionalidad nueva.
 */

// ============================================================================
// PRINCIPIO 1: ROL ≠ POSICIÓN ≠ ZONA
// ============================================================================

/**
 * DIFERENCIA 1A: ROL (Permanente durante el partido)
 * 
 * - Lo que el jugador ES tácticamente
 * - Lo que sabe hacer mejor
 * - No cambia en el partido (a menos que se sustituya el jugador)
 * 
 * Ejemplo: Jugador #10 es PUNTA
 * 
 * Almacenamiento: Player.primaryRole = 'punta'
 * Fuente de verdad: Player.primaryRole (no cambia sin sustitución)
 */

/**
 * DIFERENCIA 1B: POSICIÓN (Temporal, depende de rotación)
 * 
 * - Dónde está el jugador en la rotación actual (1-6)
 * - Cambia cada punto que su equipo gana su saque
 * - Define responsabilidades tácticas momentáneas
 * 
 * Ejemplo: Jugador #10 (punta) está en POSICIÓN 4 (derecha delantera)
 * 
 * Almacenamiento: Rotation.positions[4] = Player #10
 * Fuente de verdad: Rotation (la rotación actual)
 * 
 * Cambio: Cuando HOME gana su saque, HOME rota: 1→2→3→4→5→6→1
 *         Eso crea una NUEVA Rotation
 */

/**
 * DIFERENCIA 1C: ZONA (Momento de ejecución de la acción)
 * 
 * - Dónde EJECUTÓ la acción (1-6)
 * - Un jugador puede estar en POSICIÓN 2 pero ejecutar acción DESDE ZONA 6
 * - Ejemplo: Armador que debe ir a trasera a defender/tocar
 * 
 * Ejemplo: Jugador #10 está en posición 4, pero retrocede y ataca DESDE ZONA 6
 *          (porque ganó terreno o hay desorden en cancha)
 * 
 * Almacenamiento: Action.zone = 6
 * Fuente de verdad: Action (lo que realmente pasó)
 */

/**
 * TABLA DE DIFERENCIAS:
 * 
 * ┌──────────────┬─────────────────────┬──────────────────┬──────────────────────┐
 * │ Atributo     │ Ejemplo             │ Cuándo cambia    │ Almacenado en        │
 * ├──────────────┼─────────────────────┼──────────────────┼──────────────────────┤
 * │ ROL          │ Punta               │ Sustitución      │ Player.primaryRole   │
 * │ POSICIÓN     │ 4 (der. delantera)  │ Cada saque ganado│ Rotation.positions   │
 * │ ZONA         │ 6 (zona trasera)    │ Cada acción      │ Action.zone          │
 * └──────────────┴─────────────────────┴──────────────────┴──────────────────────┘
 */

// ============================================================================
// PRINCIPIO 2: LAS ACCIONES PERTENECEN A JUGADORES
// ============================================================================

/**
 * REGLA: Una Action SIEMPRE tiene un playerId
 * 
 * NO hacer: Action donde solo aparece "zona 4 atacó"
 * SÍ hacer: Action donde "jugador #10 (en rol punta) atacó desde zona 4"
 * 
 * Consecuencia: Puedo preguntar:
 * - "¿Cuántos ataques hizo el jugador #10?"
 * - "¿Cuál fue su rol en esa acción?"
 * - "¿Desde qué zonas atacó?"
 * 
 * Almacenamiento: Action.playerId (obligatorio)
 */

/**
 * REGLA: Una zona es CONTEXTO, no identidad
 * 
 * La zona describe DÓNDE pasó, no QUIÉN hizo que pasara.
 * 
 * NO hacer: "La zona 4 tuvo éxito" o "Estadísticas por zona"
 * SÍ hacer: "Los jugadores atacando DESDE zona 4 tuvieron éxito"
 * 
 * Implica: Las estadísticas SIEMPRE deben agruparse por jugador,
 *          y LUEGO filtrar por zona si quiero saber "qué pasó en esa zona".
 */

// ============================================================================
// PRINCIPIO 3: LA ROTACIÓN ES ESTADO DEL EQUIPO
// ============================================================================

/**
 * REGLA: Rotation es una entidad independiente, no propiedad del jugador
 * 
 * NO hacer: Player.currentPosition = 3
 * SÍ hacer: Rotation.positions[3] = Player
 * 
 * Razón: Un jugador existe independientemente de la rotación.
 *        La rotación es un estado transitorio del equipo.
 * 
 * Consecuencia: Puedo tener:
 * - El histórico de todas las rotaciones de un equipo
 * - Saber exactamente dónde estaba cada jugador en cada punto
 * - Analizar rotaciones pasadas sin afectar el presente
 */

/**
 * REGLA: Cada vez que hay una rotación nueva, se crea una entrada
 * 
 * NO hacer: Modificar in-place Rotation.positions[3] = newPlayer
 * SÍ hacer: Crear una NUEVA Rotation con el nuevo estado
 * 
 * Razón: Línea de tiempo clara. Historial disponible.
 *        Auditoría de qué pasó cuándo.
 * 
 * Almacenamiento: Match.homeRotations = [Rotation1, Rotation2, ..., RotationN]
 *                 Match.currentHomeRotation = RotationN (la más reciente)
 */

/**
 * REGLA: La rotación NO depende de la acción
 * 
 * NO hacer: "Si hay un ataque desde zona 6, la rotación cambia"
 * SÍ hacer: "Si hay un punto ganado en saque, la rotación del equipo rotante cambia"
 * 
 * Razón: La rotación cambia por LÓGICA DEL VOLEIBOL (puntos de saque),
 *        no por acciones dentro de la jugada.
 */

// ============================================================================
// PRINCIPIO 4: EL MODELO PERMITE INCONSISTENCIAS REALES
// ============================================================================

/**
 * CASO 1: Jugador fuera de su posición "ideal"
 * 
 * Un punta (rol) en posición 5 (trasera)
 * 
 * ✓ LEGAL en el modelo:
 *   Player { primaryRole: 'punta', ... }
 *   Rotation { positions: { 5: Player(punta), ... } }
 * 
 * NO es un error. Es realidad del voleibol.
 */

/**
 * CASO 2: Acción ejecutada desde zona diferente a posición
 * 
 * Jugador en posición 3 (centro delantera) que ejecuta acción desde zona 6 (trasera)
 * 
 * ✓ LEGAL en el modelo:
 *   Action { 
 *     position: 3,
 *     zone: 6,  // Retrocedió para hacer la acción
 *     ...
 *   }
 * 
 * NO es un error. Pasa en voleibol.
 */

/**
 * CASO 3: Armador defendiendo en primera línea
 * 
 * Armador (rol) en posición 4 (delantera) bloqueando/defendiendo
 * 
 * ✓ LEGAL en el modelo:
 *   Action {
 *     playerId: setterId,
 *     playerRole: 'armador',
 *     position: 4,
 *     actionType: 'bloqueo',
 *     ...
 *   }
 * 
 * NO es un error. Táctico normal.
 */

// ============================================================================
// PRINCIPIO 5: EL MODELO NO ASUME LÓGICA
// ============================================================================

/**
 * DIFERENCIA: Modelo vs Lógica de Negocio
 * 
 * MODELO (volley-model.ts):
 * - "Un jugador tiene un rol"
 * - "Una acción ocurre en una zona"
 * - "Hay una rotación actual"
 * 
 * LÓGICA (hooks, funciones):
 * - "Cuando HOME gana su saque, calcula la nueva rotación"
 * - "Determina si una acción fue exitosa según su contexto"
 * - "Calcula estadísticas por jugador, zona, rol"
 * 
 * El modelo NO sabe:
 * - Que cuando alguien anota, el equipo gana un punto
 * - Que hay solo 6 rotaciones posibles
 * - Que ciertos roles tienen ciertas responsabilidades
 * 
 * La lógica SÍ sabe eso y lo implementa en hooks/funciones.
 */

// ============================================================================
// DIRECTRICES PARA FUTURAS ENTIDADES
// ============================================================================

/**
 * Cuando agregues nuevas entidades/funcionalidades:
 * 
 * 1. CLARIDAD
 *    - Define exactamente qué ES (no qué hace)
 *    - Define exactamente QUÉ NO ES (para evitar overlap)
 * 
 * 2. RESPONSABILIDAD ÚNICA
 *    - ¿Quién es responsable de mantener este dato?
 *    - ¿Cambiaría si cambia otro dato?
 * 
 * 3. INDEPENDENCIA
 *    - ¿Esta entidad depende de otra?
 *    - ¿O solo la referencia?
 * 
 * 4. EXTENSIBILIDAD
 *    - ¿Se puede agregar un nuevo tipo de X sin refactorizar?
 *    - ¿O rompe algo?
 * 
 * Ejemplo para futuras entidades:
 * 
 * ¿Y si agrego Bloqueo (blockshot)?
 * 
 * - ¿ES una Action? (sí, es algo que hace un jugador con la pelota)
 * - ¿Tiene responsabilidades únicas? (sí: múltiples bloqueadores, coordenación)
 * - Solución: Action.actionType = 'bloqueo', pero luego puede tener subentidad
 *             Bloqueo { actionId, bloqueadores: Player[], resultado, ... }
 * 
 * ¿Y si agrego Substitucion (cambio de jugador)?
 * 
 * - ¿ES una Action? (no, es un evento administrativo, no con la pelota)
 * - ¿Qué es? Un evento que modifica el estado del equipo
 * - Solución: Match.substitutions = [Substitution1, Substitution2, ...]
 *             Substitution { teamId, playerOut, playerIn, timestamp, ... }
 */

// ============================================================================
// CÓMO LEER ESTE MODELO
// ============================================================================

/**
 * Para entender qué pasó en un punto de un partido:
 * 
 * 1. Mira la Match
 * 2. Accede a las Rotation actuales de ambos equipos
 * 3. Lee las Action secuencialmente
 * 4. Para cada Action:
 *    - ¿Quién? Action.playerId → Player → nombre/número
 *    - ¿Qué? Action.actionType → 'ataque', 'recepcion', etc
 *    - ¿De dónde? Action.zone → 1-6
 *    - ¿Cuál era su rol? Action.playerRole → 'punta', 'armador', etc
 *    - ¿Dónde estaba? Rotation.positions[?] = ese jugador
 *    - ¿Cómo salió? Action.evaluation → #, ++, +, /, -, --
 * 
 * Todo está. Nada está implícito.
 */

// ============================================================================
// EJEMPLO COMPLETO
// ============================================================================

/**
 * ESCENARIO: HOME ataca, punto #1 de un partido
 * 
 * HOME está en Rotation 1:
 *   Posición 1 (izq. trasera): Jugador #5 (armador)
 *   Posición 2 (izq. delantera): Jugador #3 (punta)
 *   Posición 3 (centro delantera): Jugador #10 (central)
 *   Posición 4 (der. delantera): Jugador #9 (punta)
 *   Posición 5 (der. trasera): Jugador #7 (zaguero)
 *   Posición 6 (centro trasera): Jugador #2 (libero)
 * 
 * AWAY está en Rotation 1 (idéntica estructura)
 * 
 * LÍNEA DE TIEMPO:
 * 
 * 1. AWAY saca (acción: saque desde zona 1)
 * 2. HOME recibe (acción: recepción desde zona 6, jugador #2 libero)
 * 3. HOME levanta (acción: levantamiento desde zona 2, jugador #5 armador)
 * 4. HOME ataca (acción: ataque desde zona 4, jugador #9 punta)
 *    → Resultado: ++ (muy positivo)
 * 
 * CADA ACCIÓN TIENE:
 * - Un jugador específico (no "la zona 4")
 * - Una evaluación (no asumida)
 * - Un rol en ese momento (no permanente)
 * 
 * Preguntas que PUEDO responder:
 * - "¿Cuántos ataques hizo el #9?" → 1 (hasta ahora)
 * - "¿De dónde atacó?" → Zona 4
 * - "¿Cuál era su rol?" → Punta
 * - "¿Estaba en su posición ideal?" → Sí, posición 4 es la suya para punta
 * - "¿Fue exitoso?" → ++
 * 
 * Preguntas que NO PUEDO responder (requieren lógica adicional):
 * - "¿Fue un buen ataque?" → Sí (#) pero eso es lógica, no modelo
 * - "¿Debería haber atacado de otra forma?" → Eso es estrategia, no modelo
 * - "¿Cuál es la próxima rotación?" → Eso es lógica (depende del próximo saque)
 */

export const DESIGN_PRINCIPLES = {
  description: "Principios de diseño del modelo de voleibol",
  locked: true,
  reason: "Mantener claridad conceptual y evitar mezclas",
};
