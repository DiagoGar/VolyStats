import type { SpikeVector } from "@/types/spike";

export function averageAngle(spikes: SpikeVector[]) {
  if (spikes.length === 0) return null;

  const sum = spikes.reduce((acc, s) => acc + s.angle, 0);
  return sum / spikes.length;
}
