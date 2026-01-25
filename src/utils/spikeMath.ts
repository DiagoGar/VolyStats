import type { SpikeVector } from "@/types/spike";
import type { Zone } from "@/types/stats";

export function averageAngle(spikes: SpikeVector[]) {
  if (spikes.length === 0) return null;

  const sum = spikes.reduce((acc, s) => acc + s.angle, 0);
  return sum / spikes.length;
}

/**
 * Calcula el ángulo a partir de dos puntos (de start a end)
 * @param start Punto de inicio
 * @param end Punto final
 * @returns Ángulo en radianes
 */
export function calculateAngle(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  const dx = end.x - start.x;
  const dy = start.y - end.y; // invertir Y para coordenadas de canvas
  return Math.atan2(dy, dx);
}

/**
 * Crea un SpikeVector con todos los datos calculados
 */
export function createSpikeVector(
  zone: Zone,
  start: { x: number; y: number },
  end: { x: number; y: number }
): Omit<SpikeVector, 'id'> & { id?: string } {
  const angle = calculateAngle(start, end);

  return {
    zone,
    start,
    end,
    angle,
    createdAt: Date.now(),
  };
}
