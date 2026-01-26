import type { SpikeVector } from "@/types/spike";
import type { Zone } from "@/types/stats";

export function averageAngle(spikes: SpikeVector[]) {
  if (spikes.length === 0) return null;

  const sum = spikes.reduce((acc, s) => acc + s.angle, 0);
  return sum / spikes.length;
}

/**
 * Calcula la desviación estándar angular (desviación angular)
 * @param spikes Array de vectores de spike
 * @param avg Ángulo promedio (se calcula si no se proporciona)
 * @returns Desviación estándar angular en radianes
 */
export function angularDeviation(spikes: SpikeVector[], avg?: number | null): number {
  if (spikes.length === 0) return 0;
  if (spikes.length === 1) return 0;

  const average = avg ?? averageAngle(spikes);
  if (average === null) return 0;

  // Calcular varianza de los ángulos
  const sumSquaredDiff = spikes.reduce((acc, s) => {
    // Normalizar la diferencia angular al rango [-π, π]
    let diff = s.angle - average;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return acc + diff * diff;
  }, 0);

  const variance = sumSquaredDiff / spikes.length;
  return Math.sqrt(variance);
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
