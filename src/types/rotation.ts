// types/rotation.ts
/**
 * Tipos para el sistema de rotaciones
 * COMPLETAMENTE SEPARADO del sistema de ataques
 */

export type RotationType = '5-1' | '4-2' | '6-2' | '6-3';

export interface Player {
  id: string;
  name: string;
  number: number;
  primaryRole: PlayerPositionRole;
}

export type PlayerPositionRole = 
  | 'opuesto'      // Derecha delantera
  | 'punta'        // Izquierda delantera / Centro delantera
  | 'central'      // Centro frontal
  | 'armador'      // Levantador/Setter
  | 'libero'       // Defensor especializado
  | 'zaguero';     // Otros roles de defensa

export interface Team {
  id: string;
  name: string;
  players: Player[];
  creator?: string;
  createdAt?: number;
}

export interface RotationPosition {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  player: Player;
  currentRole: PlayerPositionRole;
}

export interface RotationState {
  currentRotation: number; // 0-5 rotaciones posibles
  positions: RotationPosition[];
  setter: Player;
  rotationType: RotationType;
}

export interface Match {
  id: string;
  ownTeam: Team;
  opponentTeam: Team;
  rotation: RotationState;
  score: {
    own: number;
    opponent: number;
  };
  createdAt: number;
}

/**
 * Mapa visual de posiciones en cancha:
 * 
 *        Posición 3 (Central)
 *       /             \
 *      /               \
 *   Pos 2          Pos 4
 *  (Punta)        (Opuesto)
 *    /                 \
 *   /                   \
 * Pos 1             Pos 5
 * (Armador)       (Zaguero)
 *   |                 |
 *   └─────────────────┘
 *        Pos 6
 *      (Zaguero)
 * 
 * Rotación: 1→2→3→4→5→6→1
 */
