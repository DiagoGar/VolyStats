import { ZoneButton } from "./Zone";
import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import { averageAngle } from "@/utils/spikeMath";
import { SpikeDraw } from "../SpikeDraw/SpikeDraw";
import type { SpikeTrajectoriesByZone } from "@/hooks/useGameTrajectories";
import { useState } from "react";

interface HalfCourtProps {
  team: "own" | "opponent";
  stats: MatchStats;
  spikeTrajectories: SpikeTrajectoriesByZone;
  onAttack: (zone: Zone) => void;
  onToggleMode: () => void;
  onSpikeDraw: (zone: Zone, start: { x: number; y: number }, end: { x: number; y: number }) => void;
}

export function HalfCourt({
  team,
  stats,
  spikeTrajectories,
  onAttack,
  onToggleMode,
  onSpikeDraw,
}: HalfCourtProps) {
  const [drawZone, setDrawZone] = useState<Zone | null>(null);

  const getValue = (zone: Zone) => {
    if (stats.mode === "cantidad") {
      return stats.zones[zone];
    }

    const percentage = calculatePercentage(stats.zones[zone], stats.total);
    return `${percentage}%`;
  };

  const handleLongPress = (zone: Zone) => {
    setDrawZone(zone);
  };

  const handleAttack = (zone: Zone) => {
    onAttack(zone);
  };

  const isOpponent = team === "opponent";

  return (
    <div className={`half-court ${team}`}>
      {/* Encabezado */}
      <div className="half-court-header">
        <span className="team-name">{isOpponent ? "Equipo Contrario" : "Equipo Propio"}</span>
        <button
          className="mode-toggle"
          onClick={onToggleMode}
          aria-label="Cambiar modo"
          title={stats.mode === "cantidad" ? "Modo: cantidad" : "Modo: porcentaje"}
        >
          {stats.mode === "cantidad" ? "%" : "#"}
        </button>
      </div>

      {/* Cancha */}
      <div className="court">
        {/* Fila delantera */}
        <ZoneButton
          zone={4}
          value={getValue(4)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={3}
          value={getValue(3)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={2}
          value={getValue(2)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />

        {/* Fila zaguera */}
        <div className="zone disabled">
          <div className="zone-label">Zona 5</div>
        </div>

        <ZoneButton
          zone={6}
          value={getValue(6)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={1}
          value={getValue(1)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
      </div>

      {/* Modal de dibujo */}
      {drawZone !== null && (
        <SpikeDraw
          zone={drawZone}
          onClose={() => setDrawZone(null)}
          onSpikeDraw={(zone, start, end) => onSpikeDraw(zone, start, end)}
          averageAngle={averageAngle(spikeTrajectories[drawZone])}
          trajectories={spikeTrajectories[drawZone]}
        />
      )}
    </div>
  );
}
