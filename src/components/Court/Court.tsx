import { HalfCourt } from "./HalfCourt";
import type { Zone } from "@/types/stats";
import type { GameStats } from "@/hooks/useGameStats";
import type { GameTrajectories } from "@/hooks/useGameTrajectories";
import "./court.css";

interface Props {
  stats: GameStats;
  trajectories: GameTrajectories;
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onReset: () => void;
  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => void;
}

export function Court({
  stats,
  trajectories,
  onAttack,
  onToggleMode,
  onReset,
  onSpikeDraw,
}: Props) {
  return (
    <section className="court-section">
      <div className="court-container">
        {/* Equipo Contrario - ARRIBA */}
        <HalfCourt
          team="opponent"
          stats={stats.opponent}
          spikeTrajectories={trajectories.opponent}
          onAttack={(zone) => onAttack("opponent", zone)}
          onToggleMode={() => onToggleMode("opponent")}
          onSpikeDraw={(zone, start, end) => onSpikeDraw("opponent", zone, start, end)}
        />

        {/* Divisor */}
        <div className="court-divider" />

        {/* Equipo Propio - ABAJO */}
        <HalfCourt
          team="own"
          stats={stats.own}
          spikeTrajectories={trajectories.own}
          onAttack={(zone) => onAttack("own", zone)}
          onToggleMode={() => onToggleMode("own")}
          onSpikeDraw={(zone, start, end) => onSpikeDraw("own", zone, start, end)}
        />
      </div>

      {/* Botón reset global */}
      <button className="reset-button" onClick={onReset} aria-label="Resetear todo">
        ⟲ Resetear Partido
      </button>
    </section>
  );
}
