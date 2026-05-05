// types/spike.ts
import type { Zone } from "./stats";
import type { PlayerRole } from "./volley-model";
export type { PlayerRole } from "./volley-model";

export type Complex = 'K0' | 'K1' | 'K2' | 'K3' | 'K4' | 'K5';

export type Evaluation = '#' | '++' | '+' | '/' | '-' | '--';

export interface SpikeVector {
  id: string;
  zone: Zone;
  start: { x: number; y: number };
  end: { x: number; y: number };
  angle: number;
  createdAt: number;
  // Tipo de contacto (ataque o defensa)
  actionType?: "attack" | "defense" | "serve" | "set";
  // Complejo de juego (K)
  complex?: Complex;
  // Rol del jugador en la acción
  playerRole?: PlayerRole;
  // Evaluación cualitativa opcional
  evaluation?: Evaluation;
}
