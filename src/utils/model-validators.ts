/**
 * MODEL-VALIDATORS.TS
 * 
 * Funciones de validación que aseguran que los datos respeten el modelo.
 * Leer este archivo antes de crear cualquier Action o Rotation.
 */

import type {
  Player,
  Team,
  Rotation,
  Action,
  Match,
  CourtPosition,
  ActionZone,
} from '@/types/volley-model';

// ============================================================================
// VALIDATOR: Posición válida
// ============================================================================

export function isValidCourtPosition(value: any): value is CourtPosition {
  return [1, 2, 3, 4, 5, 6].includes(value);
}

export function assertValidCourtPosition(value: any): void {
  if (!isValidCourtPosition(value)) {
    throw new Error(`Posición inválida: ${value}. Debe ser 1-6.`);
  }
}

// ============================================================================
// VALIDATOR: Zona válida
// ============================================================================

export function isValidActionZone(value: any): value is ActionZone {
  return [1, 2, 3, 4, 5, 6].includes(value);
}

export function assertValidActionZone(value: any): void {
  if (!isValidActionZone(value)) {
    throw new Error(`Zona inválida: ${value}. Debe ser 1-6.`);
  }
}

// ============================================================================
// VALIDATOR: Jugador en rotación
// ============================================================================

/**
 * Valida que:
 * 1. Cada posición (1-6) tiene exactamente un jugador
 * 2. No hay jugadores duplicados
 * 3. Todos los jugadores son del equipo
 */
export function isValidRotation(
  rotation: Rotation,
  team: Team
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const teamPlayerIds = new Set(team.players.map((p) => p.id));

  // Verificar que hay 6 posiciones
  const positions = Object.keys(rotation.positions).length;
  if (positions !== 6) {
    errors.push(`Rotación debe tener 6 posiciones, tiene ${positions}`);
  }

  // Verificar cada posición
  const seenPlayerIds = new Set<string>();
  for (const pos of [1, 2, 3, 4, 5, 6] as const) {
    const player = rotation.positions[pos];

    if (!player) {
      errors.push(`Posición ${pos} está vacía`);
      continue;
    }

    if (!teamPlayerIds.has(player.id)) {
      errors.push(
        `Jugador ${player.name} (${player.id}) no pertenece al equipo ${team.name}`
      );
    }

    if (seenPlayerIds.has(player.id)) {
      errors.push(`Jugador ${player.name} aparece más de una vez en la rotación`);
    }

    seenPlayerIds.add(player.id);
  }

  // Verificar que el setter es del equipo
  if (!teamPlayerIds.has(rotation.setter.id)) {
    errors.push(
      `Setter ${rotation.setter.name} no pertenece al equipo ${team.name}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// VALIDATOR: Acción válida
// ============================================================================

/**
 * Valida que:
 * 1. El jugador existe en el equipo
 * 2. La zona es válida
 * 3. Hay un playerId (las acciones pertenecen a jugadores)
 * 4. El rol es válido
 */
export function isValidAction(
  action: Action,
  match: Match
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar que hay un jugador
  if (!action.playerId) {
    errors.push('Acción debe tener un jugador (playerId)');
    return { valid: false, errors };
  }

  // Verificar que la zona es válida
  if (!isValidActionZone(action.zone)) {
    errors.push(`Zona inválida: ${action.zone}`);
  }

  // Verificar que el jugador existe en alguno de los equipos
  const homePlayer = match.homeTeam.players.find(
    (p) => p.id === action.playerId
  );
  const awayPlayer = match.awayTeam.players.find(
    (p) => p.id === action.playerId
  );

  if (!homePlayer && !awayPlayer) {
    errors.push(`Jugador ${action.playerId} no existe en ningún equipo`);
  }

  // Verificar que la posición (si existe) es válida
  if (action.position !== undefined && !isValidCourtPosition(action.position)) {
    errors.push(`Posición inválida: ${action.position}`);
  }

  // Verificar que el rol está definido
  if (!action.playerRole) {
    errors.push('Acción debe incluir el rol del jugador');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// VALIDATOR: Principios de diseño
// ============================================================================

/**
 * Valida que un Action respeta el principio:
 * "LAS ACCIONES PERTENECEN A JUGADORES, NO A ZONAS"
 * 
 * REGLA: Una acción debe tener un playerId
 * NUNCA hacer: "la zona 4 atacó"
 * SIEMPRE: "el jugador X atacó desde la zona 4"
 */
export function respectsOwnershipPrinciple(action: Action): boolean {
  // Una acción sin jugador viola el principio
  return !!action.playerId && action.playerId.length > 0;
}

/**
 * Valida que un jugador es diferente de su posición actual.
 * 
 * PRINCIPIO: ROL ≠ POSICIÓN ≠ ZONA
 * 
 * No hace nada, solo documenta que el modelo PERMITE inconsistencias.
 * Un punta puede estar en posición 5 (es raro pero válido).
 */
export function canHaveInconsistentPositioning(
  player: Player,
  position: CourtPosition,
  zone: ActionZone
): boolean {
  // Siempre es válido. El modelo permite inconsistencias.
  // La lógica de negocio determinará si es recomendable.
  return true;
}

/**
 * Valida que una Rotation es independiente del jugador.
 * 
 * PRINCIPIO: LA ROTACIÓN ES ESTADO DEL EQUIPO
 * 
 * No hace nada, solo documenta que Rotation es su propia entidad.
 */
export function isRotationIndependentFromPlayer(
  player: Player,
  rotation: Rotation
): boolean {
  // La rotación no depende del estado del jugador.
  // El jugador puede no estar en la rotación actual (sustituciones).
  return true;
}

// ============================================================================
// VALIDATOR: Integridad referencial
// ============================================================================

/**
 * Valida que todas las referencias en un Match existan y sean consistentes.
 */
export function validateMatchIntegrity(
  match: Match
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar rotaciones
  const homeRotValidation = isValidRotation(match.currentHomeRotation, match.homeTeam);
  if (!homeRotValidation.valid) {
    errors.push(`HOME: ${homeRotValidation.errors.join(', ')}`);
  }

  const awayRotValidation = isValidRotation(match.currentAwayRotation, match.awayTeam);
  if (!awayRotValidation.valid) {
    errors.push(`AWAY: ${awayRotValidation.errors.join(', ')}`);
  }

  // Validar acciones
  for (let i = 0; i < match.actions.length; i++) {
    const actionValidation = isValidAction(match.actions[i], match);
    if (!actionValidation.valid) {
      errors.push(`Acción ${i}: ${actionValidation.errors.join(', ')}`);
    }

    // Validar principios
    if (!respectsOwnershipPrinciple(match.actions[i])) {
      errors.push(
        `Acción ${i}: Viola principio "Las acciones pertenecen a jugadores"`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// HELPER: Debugging
// ============================================================================

/**
 * Imprime un resumen del estado actual de un Match.
 * Útil para debugging y comprensión del modelo.
 */
export function describeMatch(match: Match): string {
  let desc = `\n=== PARTIDO: ${match.homeTeam.name} vs ${match.awayTeam.name} ===\n`;

  desc += `\n--- ROTACIÓN HOME ---\n`;
  for (const pos of [1, 2, 3, 4, 5, 6] as const) {
    const player = match.currentHomeRotation.positions[pos];
    desc += `  Pos ${pos}: ${player.name} (#${player.number}) - ${player.primaryRole}\n`;
  }

  desc += `\n--- ROTACIÓN AWAY ---\n`;
  for (const pos of [1, 2, 3, 4, 5, 6] as const) {
    const player = match.currentAwayRotation.positions[pos];
    desc += `  Pos ${pos}: ${player.name} (#${player.number}) - ${player.primaryRole}\n`;
  }

  desc += `\n--- ÚLTIMAS ACCIONES ---\n`;
  const lastActions = match.actions.slice(-5);
  for (const action of lastActions) {
    const player = [...match.homeTeam.players, ...match.awayTeam.players].find(
      (p) => p.id === action.playerId
    );
    desc += `  ${player?.name} (#${player?.number}) - ${action.actionType} desde zona ${action.zone} - ${action.evaluation || '?'}\n`;
  }

  return desc;
}

export const MODEL_VALIDATORS = {
  description: 'Validadores del modelo de voleibol',
  locked: true,
  reason: 'Asegurar integridad de datos',
};
