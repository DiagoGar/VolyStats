import { FullCourt } from "./FullCourt";
import type { Zone } from "@/types/stats";
import type { GameStats } from "@/hooks/useGameStats";
import type { GameTrajectories, GameTrajectoryHistory } from "@/hooks/useGameTrajectories";
import type { Complex, PlayerRole, Evaluation } from "@/types/spike";
import type { CourtPosition, Match, Player, RallyStatus, ServeResult, ServeType } from "@/types/volley-model";
import "./court.css";

interface Props {
  stats: GameStats;
  trajectories: GameTrajectories;
  trajectoryHistory: GameTrajectoryHistory;
  match: Match;
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null;
  servingTeam: "home" | "away";
  teamNames: {
    home: string;
    away: string;
  };
  rallyStatus: RallyStatus;
  lastActionType?: "serve" | "attack" | "defense" | null;
  lastActionTeam?: "home" | "away" | null;
  onSubstitute: (
    teamType: "home" | "away",
    position: CourtPosition,
    outPlayerId: string,
    inPlayerId: string
  ) => { ok: true } | { ok: false; message: string };
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onReset: () => void;
  onServe: (
    team: "own" | "opponent",
    serveType: ServeType,
    serveResult: ServeResult,
    serve: { start: { x: number; y: number }; end: { x: number; y: number } }
  ) => void;
  onServeReception: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    playerId?: string,
    playerRole?: PlayerRole
  ) => void;
  onRallyResult: (team: "own" | "opponent") => void;
  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex?: Complex,
    playerId?: string,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => void;
}

export function Court({
  stats,
  trajectories,
  trajectoryHistory,
  match,
  roleAssignments,
  servingTeam,
  teamNames,
  rallyStatus,
  lastActionType,
  lastActionTeam,
  onSubstitute,
  onAttack,
  onToggleMode,
  onReset,
  onServe,
  onServeReception,
  onRallyResult,
  onSpikeDraw,
}: Props) {
  return (
    <section className="court-section">
      <div className="court-container">
        <FullCourt
          stats={stats}
          trajectories={trajectories}
          trajectoryHistory={trajectoryHistory}
          match={match}
          roleAssignments={roleAssignments}
          servingTeam={servingTeam}
          teamNames={teamNames}
          rallyStatus={rallyStatus}
          lastActionType={lastActionType}
          lastActionTeam={lastActionTeam}
          onSubstitute={onSubstitute}
          onAttack={onAttack}
          onToggleMode={onToggleMode}
          onServe={onServe}
          onServeReception={onServeReception}
          onRallyResult={onRallyResult}
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
