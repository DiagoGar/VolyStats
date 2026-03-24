"use client";

import { useState, useEffect } from "react";
import { Court } from "@/components/Court/Court";
import { Stats } from "@/components/Stats/Stats";
import { DataExportImport } from "@/components/DataExportImport/DataExportImport";
import { MatchSetupFlow } from "@/components/RotationFlow/MatchSetupFlow";
import { RotationConfigFlow } from "@/components/RotationFlow/RotationConfigFlow";
import { RoleAssignmentFlow } from "@/components/RotationFlow/RoleAssignmentFlow";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories, type GameTrajectories } from "@/hooks/useGameTrajectories";
import { clearStorage, loadFromStorage, storageKeys } from "@/hooks/usePersistentStorage";
import "@/components/DataExportImport/dataExportImport.css";
import "@/components/RotationFlow/matchSetup.css";
import type { Match, Player, CourtPosition, Action, ActionEvaluation } from "@/types/volley-model";
import type { RotationType } from "@/types/rotation";
import type { Complex, PlayerRole } from "@/types/spike";

export default function Page() {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(() =>
    loadFromStorage<Match | null>(storageKeys.match, null)
  );
  const [rotationConfig, setRotationConfig] = useState<{
    homeTeamSetter: Player;
    awayTeamSetter: Player;
    rotationType: RotationType;
  } | null>(() =>
    loadFromStorage<{
      homeTeamSetter: Player;
      awayTeamSetter: Player;
      rotationType: RotationType;
    } | null>(storageKeys.rotationConfig, null)
  );
  const [roleAssignments, setRoleAssignments] = useState<{
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null>(() =>
    loadFromStorage<{
      homeTeamAssignments: Record<CourtPosition, Player>;
      awayTeamAssignments: Record<CourtPosition, Player>;
    } | null>(storageKeys.roleAssignments, null)
  );
  const { trajectories, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();
  const { stats, addAttack, toggleMode, resetGame: resetStats } = useGameStats(trajectories.own, trajectories.opponent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentMatch) {
      localStorage.setItem(storageKeys.match, JSON.stringify(currentMatch));
    } else {
      localStorage.removeItem(storageKeys.match);
    }
  }, [currentMatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (rotationConfig) {
      localStorage.setItem(storageKeys.rotationConfig, JSON.stringify(rotationConfig));
    } else {
      localStorage.removeItem(storageKeys.rotationConfig);
    }
  }, [rotationConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (roleAssignments) {
      localStorage.setItem(storageKeys.roleAssignments, JSON.stringify(roleAssignments));
    } else {
      localStorage.removeItem(storageKeys.roleAssignments);
    }
  }, [roleAssignments]);

  const handleResetAll = () => {
    resetStats();
    resetTrajectories();
    setCurrentMatch(null);
    setRotationConfig(null);
    setRoleAssignments(null);
    clearStorage(storageKeys.trajectories);
    clearStorage(storageKeys.stats);
    clearStorage(storageKeys.match);
    clearStorage(storageKeys.rotationConfig);
    clearStorage(storageKeys.roleAssignments);
  };

  const handleImportTrajectories = (data: GameTrajectories) => {
    // Lógica para importar trayectorias
  };

  const handleImportStats = (data: any) => {
    // Lógica para importar stats
  };

  const handleMatchConfirmed = (match: Match) => {
    setCurrentMatch(match);
  };

  const handleBackToSetup = () => {
    setCurrentMatch(null);
    setRotationConfig(null);
    setRoleAssignments(null);
  };

  const handleRotationConfigComplete = (config: {
    homeTeamSetter: Player;
    awayTeamSetter: Player;
    rotationType: RotationType;
  }) => {
    setRotationConfig(config);
  };

  const handleBackToMatchSetup = () => {
    setRotationConfig(null);
  };

  const handleRoleAssignmentComplete = (config: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  }) => {
    setRoleAssignments(config);
  };

  const handleBackToRotationConfig = () => {
    setRoleAssignments(null);
  };

  const getPlayerFromTeamByZone = (team: "own" | "opponent", zone: number): Player | undefined => {
    if (!roleAssignments) return undefined;
    const position = zone as CourtPosition;
    return team === "own" ? roleAssignments.homeTeamAssignments[position] : roleAssignments.awayTeamAssignments[position];
  };

  const addMatchAction = ({
    team,
    zone,
    complex,
    playerRole,
    evaluation,
  }: {
    team: "own" | "opponent";
    zone: number;
    complex?: Complex;
    playerRole?: PlayerRole;
    evaluation?: ActionEvaluation;
  }) => {
    if (!currentMatch) return;

    const player = getPlayerFromTeamByZone(team, zone);
    const position = zone as CourtPosition;
    const rotationId = team === "own" ? currentMatch.currentHomeRotation?.id : currentMatch.currentAwayRotation?.id;

    const action: Action = {
      id: crypto.randomUUID(),
      playerId: player?.id || "",
      playerRole: playerRole || (player?.primaryRole ?? "zaguero"),
      actionType: "ataque",
      zone: zone as any,
      position: position,
      rotationId: rotationId || "",
      evaluation,
      targetZone: undefined,
      complex,
      team: team === "own" ? "home" : "away",
      timestamp: Date.now(),
      setNumber: currentMatch.currentSet,
      pointNumber: currentMatch.actions.length + 1,
    };

    const evaluationPoints: Record<ActionEvaluation, number> = {
      "#": 1,
      "++": 1,
      "+": 0.5,
      "/": 0,
      "-": 0,
      "--": -1,
    };

    const delta = evaluation ? evaluationPoints[evaluation] : 0;

    setCurrentMatch((prev) => {
      if (!prev) return prev;

      let homeScore = prev.homeScore;
      let awayScore = prev.awayScore;

      if (team === "own") {
        if (delta > 0) homeScore += delta;
        if (delta < 0) awayScore += Math.abs(delta);
      } else {
        if (delta > 0) awayScore += delta;
        if (delta < 0) homeScore += Math.abs(delta);
      }

      return {
        ...prev,
        actions: [...prev.actions, action],
        homeScore,
        awayScore,
      };
    });
  };

  const handleAttack = (team: "own" | "opponent", zone: number) => {
    addAttack(team, zone as any);
    addMatchAction({ team, zone, evaluation: undefined });
  };

  const handleSpikeDraw = (
    team: "own" | "opponent",
    zone: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerRole?: PlayerRole,
    evaluation?: ActionEvaluation
  ) => {
    addTrajectory(team, zone as any, start, end, complex, playerRole, evaluation);
    addMatchAction({ team, zone, complex, playerRole, evaluation });
  };

  // Si no hay partido configurado, mostrar setup
  if (!currentMatch) {
    return (
      <MatchSetupFlow 
        onMatchReady={handleMatchConfirmed}
        onCancel={() => {/* No hay cancelar, es el inicio */}}
      />
    );
  }

  // Si hay partido pero no rotación configurada, mostrar config de rotación
  if (!rotationConfig) {
    return (
      <RotationConfigFlow
        match={currentMatch}
        onConfigComplete={handleRotationConfigComplete}
        onBack={handleBackToMatchSetup}
      />
    );
  }

  // Si hay rotación pero no asignaciones, mostrar asignación de roles
  if (!roleAssignments) {
    return (
      <RoleAssignmentFlow
        match={currentMatch}
        homeTeamSetter={rotationConfig.homeTeamSetter}
        awayTeamSetter={rotationConfig.awayTeamSetter}
        rotationType={rotationConfig.rotationType}
        onAssignmentComplete={handleRoleAssignmentComplete}
        onBack={handleBackToRotationConfig}
      />
    );
  }

  // Una vez configurado todo, mostrar pantalla de análisis
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
        <button
          onClick={handleBackToSetup}
          style={{
            padding: "8px 16px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ← Volver a configuración
        </button>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 18px",
        background: "#f5f7ff",
        border: "1px solid #dde4ff",
        borderRadius: "8px",
        margin: "0 10px 15px",
      }}>
        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
          {currentMatch.homeTeam.name}: {currentMatch.homeScore}
        </div>
        <div style={{ fontSize: "14px", color: "#33475b" }}>
          Set {currentMatch.currentSet}
        </div>
        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
          {currentMatch.awayTeam.name}: {currentMatch.awayScore}
        </div>
      </div>

      <Court
        stats={stats}
        trajectories={trajectories}
        onAttack={handleAttack}
        onToggleMode={toggleMode}
        onReset={() => {
          resetStats();
          resetTrajectories();
        }}
        onSpikeDraw={handleSpikeDraw}
      />

      <Stats trajectories={trajectories.own} actions={currentMatch?.actions || []} />

      <DataExportImport
        trajectories={trajectories}
        stats={stats}
        match={currentMatch}
        onImportTrajectories={handleImportTrajectories}
        onImportStats={handleImportStats}
        onImportMatch={(match) => setCurrentMatch(match)}
        onReset={handleResetAll}
      />
    </>
  );
}
