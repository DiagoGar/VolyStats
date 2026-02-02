// types/spike.ts
import type { Zone } from "./stats";

export type Complex = 'K1' | 'K2' | 'K3' | 'K4';

export type PlayerRole = 'opuesto' | 'punta' | 'central' | 'armador' | 'libero' | 'zaguero';

export interface SpikeVector {
  id: string;
  zone: Zone;
  start: { x: number; y: number };
  end: { x: number; y: number };  
  angle: number;                   
  createdAt: number;
  // 🔹 Complejo de juego (K)
  complex: Complex;
  // 🔹 Rol del jugador en la acción
  playerRole?: PlayerRole;
}
