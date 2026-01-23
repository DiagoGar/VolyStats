import type { Zone } from "@/types/stats";

export const zoneOrigins: Record<Zone, { x: number; y: number }> = {
  4: { x: 0.1, y: 0.55 },
  3: { x: 0.5, y: 0.55 },
  2: { x: 0.90, y: 0.55 },
  6: { x: 0.5, y: 0.70 }, 
  1: { x: 0.9, y: 0.70 }
};
