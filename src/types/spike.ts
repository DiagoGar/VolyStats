// types/spike.ts
import type { Zone } from "./stats";

export interface SpikeVector {
  id: string;
  zone: Zone;
  start: { x: number; y: number };
  end: { x: number; y: number };  
  angle: number;                   
  createdAt: number;
}
