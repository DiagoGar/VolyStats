import { FullCourt } from "./FullCourt";
import type { Zone } from "@/types/stats";
import type { GameStats } from "@/hooks/useGameStats";
import type { GameTrajectories } from "@/hooks/useGameTrajectories";
import type { Complex, PlayerRole, Evaluation, SpikeVector } from "@/types/spike";
import type { CourtPosition, Player } from "@/types/volley-model";
import "./court.css";

interface Props {
  stats: GameStats;
  trajectories: GameTrajectories;
  trajectoryHistory: { own: SpikeVector[]; opponent: SpikeVector[] };
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null;
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onReset: () => void;
  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => void;
}

export function Court({
  stats,
  trajectories,
  trajectoryHistory,
  roleAssignments,
  onAttack,
  onToggleMode,
  onReset,
  onSpikeDraw,
}: Props) {
  return (
    <section className="court-section">
      <div className="court-container">
        <FullCourt
          stats={stats}
          trajectories={trajectories}
          trajectoryHistory={trajectoryHistory}
          roleAssignments={roleAssignments}
          onAttack={onAttack}
          onToggleMode={onToggleMode}
          onSpikeDraw={onSpikeDraw}
        />
      </div>

      {/* Botón reset global */}
      <button className="reset-button" onClick={onReset} aria-label="Resetear todo">
        ⟲ Resetear Partido
      </button>
    </section>
  );
}
