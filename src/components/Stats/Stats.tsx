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
  // Calcular stats básicos
  const complexStats: Record<string, number> = {};
  const roleStats: Record<string, number> = {};
  const evaluationStats: Record<string, number> = {};
  const directionStats: Record<string, number> = {};

  // Stats avanzados para análisis táctico
  const complexSuccess: Record<string, { total: number; success: number }> = {};
  const roleSuccess: Record<string, { total: number; success: number }> = {};
  const zoneSuccess: Record<Zone, { total: number; success: number }> = {
    1: { total: 0, success: 0 },
    2: { total: 0, success: 0 },
    3: { total: 0, success: 0 },
    4: { total: 0, success: 0 },
    6: { total: 0, success: 0 },
  };
  const directionByEvaluation: Record<string, Record<string, number>> = {};

  for (const zone in trajectories) {
    for (const trajectory of trajectories[zone as unknown as Zone]) {
      const zoneNum = zone as unknown as Zone;
      
      // Stats básicos
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

      // Stats de éxito (considerar # y ++ como éxito)
      const isSuccess = trajectory.evaluation === '#' || trajectory.evaluation === '++';

      // Por complejo
      if (trajectory.complex) {
        if (!complexSuccess[trajectory.complex]) {
          complexSuccess[trajectory.complex] = { total: 0, success: 0 };
        }
        complexSuccess[trajectory.complex].total++;
        if (isSuccess) complexSuccess[trajectory.complex].success++;
      }

      // Por rol
      if (trajectory.playerRole) {
        if (!roleSuccess[trajectory.playerRole]) {
          roleSuccess[trajectory.playerRole] = { total: 0, success: 0 };
        }
        roleSuccess[trajectory.playerRole].total++;
        if (isSuccess) roleSuccess[trajectory.playerRole].success++;
      }

      // Por zona
      zoneSuccess[zoneNum].total++;
      if (isSuccess) zoneSuccess[zoneNum].success++;

      // Dirección por evaluación
      if (trajectory.evaluation) {
        if (!directionByEvaluation[trajectory.evaluation]) {
          directionByEvaluation[trajectory.evaluation] = {};
        }
        directionByEvaluation[trajectory.evaluation][direction] = 
          (directionByEvaluation[trajectory.evaluation][direction] || 0) + 1;
      }
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

      <h2>Análisis Táctico Avanzado</h2>

      <h3>Tasa de Éxito por Complejo</h3>
      {Object.entries(complexSuccess).map(([complex, stats]) => {
        const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
        return (
          <p key={complex}>
            {complex}: {stats.success}/{stats.total} ({rate}%)
          </p>
        );
      })}

      <h3>Tasa de Éxito por Rol del Jugador</h3>
      {Object.entries(roleSuccess).map(([role, stats]) => {
        const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
        return (
          <p key={role}>
            {role}: {stats.success}/{stats.total} ({rate}%)
          </p>
        );
      })}

      <h3>Tasa de Éxito por Zona</h3>
      {Object.entries(zoneSuccess).map(([zone, stats]) => {
        const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
        return (
          <p key={zone}>
            Zona {zone}: {stats.success}/{stats.total} ({rate}%)
          </p>
        );
      })}

      <h3>Dirección por Evaluación</h3>
      {Object.entries(directionByEvaluation).map(([evaluation, directions]) => (
        <div key={evaluation}>
          <h4>{evaluation.charAt(0).toUpperCase() + evaluation.slice(1)}</h4>
          {Object.entries(directions).map(([direction, count]) => (
            <p key={direction} style={{ marginLeft: '20px' }}>
              {direction}: {count}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
