import { FullCourt } from "./FullCourt";
import type { Zone } from "@/types/stats";
import type { GameStats } from "@/hooks/useGameStats";
import type { GameTrajectories, GameTrajectoryHistory } from "@/hooks/useGameTrajectories";
import type { Complex, PlayerRole, Evaluation } from "@/types/spike";
import type { CourtPosition, Player, ServeResult, ServeType } from "@/types/volley-model";
import "./court.css";

interface Props {
  stats: GameStats;
  trajectories: GameTrajectories;
  trajectoryHistory: GameTrajectoryHistory;
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null;
  servingTeam: "home" | "away";
  teamNames: {
    home: string;
    away: string;
  };
  rallyStatus: "waiting_serve" | "in_play";
  lastActionType?: "serve" | "attack" | "defense" | null;
  lastActionTeam?: "home" | "away" | null;
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onReset: () => void;
  onServe: (
    team: "own" | "opponent",
    serveType: ServeType,
    serveResult: ServeResult,
    serve: { start: { x: number; y: number }; end: { x: number; y: number } }
  ) => void;
  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerId?: string,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => void;
}

export function Court({
  stats,
  trajectories,
  trajectoryHistory,
  roleAssignments,
  servingTeam,
  teamNames,
  rallyStatus,
  lastActionType,
  lastActionTeam,
  onAttack,
  onToggleMode,
  onReset,
  onServe,
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
          servingTeam={servingTeam}
          teamNames={teamNames}
          rallyStatus={rallyStatus}
          lastActionType={lastActionType}
          lastActionTeam={lastActionTeam}
          onAttack={onAttack}
          onToggleMode={onToggleMode}
          onServe={onServe}
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
