import { ZoneButton } from "./Zone";
import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import { averageAngle } from "@/utils/spikeMath";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { SpikeDraw } from "../SpikeDraw/SpikeDraw";
import type { SpikeTrajectoriesByZone } from "@/hooks/useSpikeTrajectories";
import "./court.css";

interface Props {
  stats: MatchStats;
  onAttack: (zone: Zone) => void;
  onToggleMode: () => void;
  onReset: () => void;

  onSpikeDraw: (
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;

  spikeTrajectories: SpikeTrajectoriesByZone;
}


export function Court({
  stats,
  onAttack,
  onToggleMode,
  onReset,
  onSpikeDraw,
  spikeTrajectories,
}: Props) {

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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <section>
      <div className="court-wrapper">
        {/* Botón modo */}
        <button
          className="side-button mode"
          onClick={onToggleMode}
          aria-label="Cambiar modo"
        >
          {stats.mode === "cantidad" ? "%" : "#"}
        </button>

        {/* Cancha */}
        <div className="court">
          <canvas ref={canvasRef} className="court-canvas" />
          {/* Fila delantera */}
          <ZoneButton
            zone={4}
            value={getValue(4)}
            onClick={onAttack}
            onLongPress={handleLongPress}
          />
          <ZoneButton
            zone={3}
            value={getValue(3)}
            onClick={onAttack}
            onLongPress={handleLongPress}
          />
          <ZoneButton
            zone={2}
            value={getValue(2)}
            onClick={onAttack}
            onLongPress={handleLongPress}
          />

          {/* Fila zaguera */}
          <div className="zone disabled">
            <div className="zone-label">Zona 5</div>
          </div>

          <ZoneButton
            zone={6}
            value={getValue(6)}
            onClick={onAttack}
            onLongPress={handleLongPress}
          />
          <ZoneButton
            zone={1}
            value={getValue(1)}
            onClick={onAttack}
            onLongPress={handleLongPress}
          />
        </div>

        {/* Botón reset */}
        <button
          className="side-button reset"
          onClick={onReset}
          aria-label="Resetear estadísticas"
        >
          ⟲
        </button>
      </div>

      {/* Pantalla de dibujo */}
      {drawZone !== null && (
        <SpikeDraw
          zone={drawZone}
          onClose={() => setDrawZone(null)}
          onSpikeDraw={onSpikeDraw}
          averageAngle={averageAngle(spikeTrajectories[drawZone])}
        />
      )}
    </section>
  );
}
