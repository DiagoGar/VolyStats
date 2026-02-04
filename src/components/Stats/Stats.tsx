"use client";

import type { Zone } from "@/types/stats";
import type { SpikeVector } from "@/types/spike";
import { averageAngle } from "@/utils/spikeMath";
import { classifyDirection, directionPatterns } from "@/utils/spikeMath";

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

export interface StatsProps {
  trajectories: SpikeTrajectoriesByZone;
}

export function Stats({ trajectories }: StatsProps) {
  // Calcular stats por complejo
  const complexStats: Record<string, number> = {};
  const roleStats: Record<string, number> = {};
  const evaluationStats: Record<string, number> = {};
  const directionStats: Record<string, number> = {};

  for (const zone in trajectories) {
    for (const trajectory of trajectories[zone as unknown as Zone]) {
      if (trajectory.complex) {
        complexStats[trajectory.complex] = (complexStats[trajectory.complex] || 0) + 1;
      }
      if (trajectory.playerRole) {
        roleStats[trajectory.playerRole] = (roleStats[trajectory.playerRole] || 0) + 1;
      }
      if (trajectory.evaluation) {
        evaluationStats[trajectory.evaluation] = (evaluationStats[trajectory.evaluation] || 0) + 1;
      }

      // Clasificar dirección
      const direction = classifyDirection(trajectory);
      directionStats[direction] = (directionStats[direction] || 0) + 1;
    }
  }

  return (
    <section>
      <h2>Estadísticas de Ataques con Contexto</h2>

      <h3>Dirección promedio por zona</h3>
      {([1, 2, 3, 4, 6] as const).map((zone) => {
        const avg = averageAngle(trajectories[zone]);
        if (avg === null) {
          return <p key={zone}>Zona {zone}: sin datos</p>;
        }

        const degrees = Math.round((avg * 180) / Math.PI);

        return (
          <p key={zone}>
            Zona {zone}: {degrees}° ({trajectories[zone].length} ataques)
          </p>
        );
      })}

      <h3>Por Complejo de Juego</h3>
      {Object.entries(complexStats).map(([complex, count]) => (
        <p key={complex}>{complex}: {count}</p>
      ))}

      <h3>Por Rol del Jugador</h3>
      {Object.entries(roleStats).map(([role, count]) => (
        <p key={role}>{role}: {count}</p>
      ))}

      <h3>Por Evaluación</h3>
      {Object.entries(evaluationStats).map(([evaluation, count]) => (
        <p key={evaluation}>{evaluation}: {count}</p>
      ))}

      <h3>Patrones Direccionales</h3>
      {Object.entries(directionStats).map(([direction, count]) => (
        <p key={direction}>{direction}: {count}</p>
      ))}
    </section>
  );
}
