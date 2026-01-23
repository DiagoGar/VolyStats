"use client";

import { useState } from "react";
import { Court } from "@/components/Court/Court";
import { StatsPanel } from "@/components/Stats/StatsPanel";
import { useMatchStats } from "@/hooks/useMatchStats";
import type { Zone } from "@/types/stats";
import type { SpikeVector } from "@/types/spike";

/* =======================
   Types
======================= */

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

/* =======================
   Helpers
======================= */

function averageAngle(spikes: SpikeVector[]) {
  if (spikes.length === 0) return null;
  const sum = spikes.reduce((acc, s) => acc + s.angle, 0);
  return sum / spikes.length;
}

/* =======================
   Component
======================= */

export function Stats() {
  const { stats, addAttack, toggleMode, resetMatch } = useMatchStats();

  const [spikeTrajectories, setSpikeTrajectories] =
    useState<SpikeTrajectoriesByZone>({
      1: [],
      2: [],
      3: [],
      4: [],
      6: [],
    });

  /* =======================
     Handlers
  ======================= */

  const handleSpikeDraw = (
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    setSpikeTrajectories((prev) => ({
      ...prev,
      [zone]: [
        ...prev[zone],
        {
          id: crypto.randomUUID(),
          zone,
          start,
          end,
          angle,
          createdAt: Date.now(),
        },
      ],
    }));
  };

  /* =======================
     Render
  ======================= */

  return (
    <main style={{ padding: 24 }}>
      <h1>Vóley Stats</h1>

      <Court
        stats={stats}
        onAttack={addAttack}
        onToggleMode={toggleMode}
        onReset={resetMatch}
        onSpikeDraw={handleSpikeDraw}
        spikeTrajectories={spikeTrajectories}
      />

      <StatsPanel stats={stats} />

      {/* Dirección promedio (v1 texto) */}
      <section>
        <h2>Dirección promedio por zona</h2>

        {[1, 2, 3, 4, 6].map((zone) => {
          const avg = averageAngle(spikeTrajectories[zone as Zone]);
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
    </main>
  );
}
