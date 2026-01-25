"use client";

import type { Zone } from "@/types/stats";
import type { SpikeVector } from "@/types/spike";
import { averageAngle } from "@/utils/spikeMath";

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

export interface StatsProps {
  trajectories: SpikeTrajectoriesByZone;
}

export function Stats({ trajectories }: StatsProps) {
  return (
    <section>
      <h2>Dirección promedio por zona</h2>

      {([1, 2, 3, 4, 6] as const).map((zone) => {
        const avg = averageAngle(trajectories[zone]);
        if (avg === null) {
          return <p key={zone}>Zona {zone}: sin datos</p>;
        }

        const degrees = Math.round((avg * 180) / Math.PI);

        return (
          <p key={zone}>
            Zona {zone}: {degrees}°
          </p>
        );
      })}
    </section>
  );
}
