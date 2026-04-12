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
import type { Match, Player, CourtPosition, Action, ActionEvaluation, Rotation, RotationSnapshot, SubstitutionEvent, ServeResult, ServeType, ActionType } from "@/types/volley-model";
import type { RotationType } from "@/types/rotation";
import type { Complex, PlayerRole } from "@/types/spike";
import { calculateAngle } from "@/utils/spikeMath";

export default function Page() {
  const [isClient, setIsClient] = useState(false);
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
  const [initialRoleAssignments, setInitialRoleAssignments] = useState<{
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null>(null);
  const { trajectories, history, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();
  const { stats, addAttack, toggleMode, resetGame: resetStats } = useGameStats(trajectories.own, trajectories.opponent);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const createRotation = (
    team: "home" | "away",
    assignments: Record<CourtPosition, Player>
  ): Rotation => ({
    id: crypto.randomUUID(),
    teamId: team === "home" ? currentMatch?.homeTeam.id ?? "" : currentMatch?.awayTeam.id ?? "",
    positions: assignments,
    setter: team === "home" ? rotationConfig?.homeTeamSetter ?? ({} as Player) : rotationConfig?.awayTeamSetter ?? ({} as Player),
    rotationSystem: rotationConfig?.rotationType ?? "5-1",
    currentRotationNumber: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const handleRoleAssignmentComplete = (config: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  }) => {
    setRoleAssignments(config);
    setInitialRoleAssignments(config);

    if (!currentMatch) return;

    const homeRotation = createRotation("home", config.homeTeamAssignments);
    const awayRotation = createRotation("away", config.awayTeamAssignments);

    setCurrentMatch((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentHomeRotation: homeRotation,
        currentAwayRotation: awayRotation,
        homeRotations: [homeRotation],
        awayRotations: [awayRotation],
        currentSet: 1,
        homeScore: 0,
        awayScore: 0,
        status: "in-progress",
        rallyStatus: prev.rallyStatus ?? "waiting_serve",
      };
    });
  };

  const handleBackToRotationConfig = () => {
    setRoleAssignments(null);
  };

  const rotateAssignmentsMap = (assignments: Record<CourtPosition, Player>) => {
    const rotated: Record<CourtPosition, Player> = {} as Record<CourtPosition, Player>;
    // Rotación en sentido horario: 1->6, 6->5, 5->4, 4->3, 3->2, 2->1
    rotated[1] = assignments[2];
    rotated[2] = assignments[3];
    rotated[3] = assignments[4];
    rotated[4] = assignments[5];
    rotated[5] = assignments[6];
    rotated[6] = assignments[1];
    return rotated;
  };

  const buildSubstitutionEvent = (
    teamType: "home" | "away",
    outPlayer: Player,
    inPlayer: Player,
    position: CourtPosition,
    reason: string
  ): SubstitutionEvent | null => {
    if (!currentMatch) return null;
    return {
      id: crypto.randomUUID(),
      teamId: teamType === "home" ? currentMatch.homeTeam.id : currentMatch.awayTeam.id,
      outPlayerId: outPlayer.id,
      inPlayerId: inPlayer.id,
      position,
      setNumber: currentMatch.currentSet,
      pointNumber: currentMatch.actions.length + 1,
      timestamp: Date.now(),
      reason,
    };
  };

  const applyLiberoCentralRules = (
    teamType: "home" | "away",
    assignments: Record<CourtPosition, Player>,
    isServing: boolean,
    reason: string
  ) => {
    if (!currentMatch) return { assignments, events: [] as SubstitutionEvent[] };

    const teamPlayers = teamType === "home" ? currentMatch.homeTeam.players : currentMatch.awayTeam.players;
    const libero = teamPlayers.find((p) => p.primaryRole === "libero");
    const onCourtIds = new Set(Object.values(assignments).map((p) => p.id));
    const benchPlayers = teamPlayers.filter((p) => !onCourtIds.has(p.id));
    const benchCentral = benchPlayers.find((p) => p.primaryRole === "central");
    const benchNonLibero = benchPlayers.find((p) => p.primaryRole !== "libero");
    const events: SubstitutionEvent[] = [];

    const replaceAt = (
      currentAssignments: Record<CourtPosition, Player>,
      position: CourtPosition,
      incoming: Player | undefined,
      ruleReason: string
    ) => {
      if (!incoming) return currentAssignments;
      const outgoing = currentAssignments[position];
      if (!outgoing || outgoing.id === incoming.id) return currentAssignments;
      const event = buildSubstitutionEvent(teamType, outgoing, incoming, position, ruleReason);
      if (event) events.push(event);
      return { ...currentAssignments, [position]: incoming };
    };

    let nextAssignments = { ...assignments };

    // 1) El líbero nunca puede estar en zona delantera (2,3,4)
    const frontRowPositions: CourtPosition[] = [2, 3, 4];
    const liberoFront = frontRowPositions.find((pos) => nextAssignments[pos]?.primaryRole === "libero");
    if (liberoFront) {
      const incoming = benchCentral || benchNonLibero;
      nextAssignments = replaceAt(nextAssignments, liberoFront, incoming, `${reason}:libero-front-row`);
    }

    const liberoPosition = ([1, 6, 5, 2, 3, 4] as CourtPosition[]).find(
      (pos) => nextAssignments[pos]?.primaryRole === "libero"
    );
    const server = nextAssignments[1];
    const serverIsCentral = server?.primaryRole === "central";
    const liberoOnCourt = liberoPosition !== undefined;

    // 2) Si el central está sacando, el líbero debe salir (pueden quedar 2 centrales)
    if (isServing && serverIsCentral && liberoOnCourt) {
      const incoming = benchCentral || benchNonLibero;
      if (liberoPosition) {
        nextAssignments = replaceAt(nextAssignments, liberoPosition, incoming, `${reason}:libero-out-for-central-serve`);
      }
      return { assignments: nextAssignments, events };
    }

    // 3) Si no se está sacando con central, el líbero debe reemplazar a un central en zaguero
    if (libero && (!isServing || !serverIsCentral)) {
      const backRowPositions: CourtPosition[] = isServing ? [6, 5] : [1, 6, 5];
      const backRowCentral = backRowPositions.find(
        (pos) => nextAssignments[pos]?.primaryRole === "central"
      );
      if (!liberoOnCourt && backRowCentral) {
        nextAssignments = replaceAt(nextAssignments, backRowCentral, libero, `${reason}:libero-in-for-central`);
      }
      // Si el líbero está en 1 durante el saque (servidor), corregir
      if (isServing && nextAssignments[1]?.primaryRole === "libero") {
        const incoming = benchCentral || benchNonLibero;
        nextAssignments = replaceAt(nextAssignments, 1, incoming, `${reason}:libero-cannot-serve`);
      }
    }

    return { assignments: nextAssignments, events };
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
    spike,
    playerId,
    actionType = "ataque",
    actionKind,
    serveType,
    serveResult,
    serve,
  }: {
    team: "own" | "opponent";
    zone: number;
    complex?: Complex;
    playerRole?: PlayerRole;
    evaluation?: ActionEvaluation;
    spike?: { start: { x: number; y: number }; end: { x: number; y: number } };
    playerId?: string;
    actionType?: ActionType;
    actionKind?: Action["type"];
    serveType?: ServeType;
    serveResult?: ServeResult;
    serve?: { start: { x: number; y: number }; end: { x: number; y: number } };
  }) => {
    if (!currentMatch) return;

    const player = playerId
      ? [...currentMatch.homeTeam.players, ...currentMatch.awayTeam.players].find((p) => p.id === playerId)
      : getPlayerFromTeamByZone(team, zone);
    const position = zone as CourtPosition;
    const rotation = team === "own" ? currentMatch.currentHomeRotation : currentMatch.currentAwayRotation;
    const rotationId = rotation?.id;

    const rotationSnapshot: RotationSnapshot | undefined = rotation
      ? {
          id: rotation.id,
          teamId: rotation.teamId,
          positions: {
            1: rotation.positions[1]?.id ?? "",
            2: rotation.positions[2]?.id ?? "",
            3: rotation.positions[3]?.id ?? "",
            4: rotation.positions[4]?.id ?? "",
            5: rotation.positions[5]?.id ?? "",
            6: rotation.positions[6]?.id ?? "",
          },
          setterId: rotation.setter?.id ?? "",
          rotationSystem: rotation.rotationSystem,
          currentRotationNumber: rotation.currentRotationNumber,
          createdAt: rotation.updatedAt ?? rotation.createdAt,
        }
      : undefined;

    const action: Action = {
      id: crypto.randomUUID(),
      playerId: player?.id || "",
      playerRole: playerRole || (player?.primaryRole ?? "zaguero"),
      teamId: team === "own" ? currentMatch.homeTeam.id : currentMatch.awayTeam.id,
      actionType,
      type: actionKind ?? (spike ? "spike" : undefined),
      zone: zone as any,
      position: position,
      rotationId: rotationId || "",
      context: {
        rotationId: rotationId || undefined,
        rotationSnapshot,
        position,
        zone: zone as any,
      },
      evaluation,
      targetZone: undefined,
      complex,
      team: team === "own" ? "home" : "away",
      spike: spike
        ? {
            start: spike.start,
            end: spike.end,
            angle: calculateAngle(spike.start, spike.end),
          }
        : undefined,
      serve: serve
        ? {
            start: serve.start,
            end: serve.end,
            angle: calculateAngle(serve.start, serve.end),
          }
        : undefined,
      serveType,
      serveResult,
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

    const serveEvaluation: ActionEvaluation | undefined = serveResult
      ? serveResult === "ace"
        ? "#"
        : serveResult === "error"
          ? "--"
          : undefined
      : undefined;

    const scoringEvaluation = evaluation ?? serveEvaluation;
    const isTerminalEvaluation = scoringEvaluation === "#" || scoringEvaluation === "--";
    const delta = isTerminalEvaluation ? evaluationPoints[scoringEvaluation] : 0;

    // Calcular nuevos scores
    let homeScore = currentMatch.homeScore;
    let awayScore = currentMatch.awayScore;

    if (team === "own") {
      if (delta > 0) homeScore += delta;
      if (delta < 0) awayScore += Math.abs(delta);
    } else {
      if (delta > 0) awayScore += delta;
      if (delta < 0) homeScore += Math.abs(delta);
    }

    const currentServer = currentMatch.servingTeam ?? "home";
    const winnerTeam: "home" | "away" | null = delta === 0
      ? null
      : team === "own"
        ? (delta > 0 ? "home" : "away")
        : (delta > 0 ? "away" : "home");

    const serverChanges = winnerTeam !== null && winnerTeam !== currentServer;

    const setWinThreshold = 25;
    const setLead = 2;
    const hasSetWinner =
      (homeScore >= setWinThreshold || awayScore >= setWinThreshold) &&
      Math.abs(homeScore - awayScore) >= setLead;

    // Rotación inicial a reestablecer en cada set
    const initialHomeRotation = currentMatch.homeRotations[0] || currentMatch.currentHomeRotation;
    const initialAwayRotation = currentMatch.awayRotations[0] || currentMatch.currentAwayRotation;

    const nextRallyStatus =
      actionType === "saque"
        ? serveResult === "en_juego"
          ? "in_play"
          : "waiting_serve"
        : isTerminalEvaluation
          ? "waiting_serve"
          : "in_play";

    setCurrentMatch((prev) => {
      if (!prev) return prev;

      if (hasSetWinner) {
        const nextSet = prev.currentSet + 1;

        return {
          ...prev,
          actions: [...prev.actions, action],
          homeScore: 0,
          awayScore: 0,
          currentSet: nextSet,
          currentHomeRotation: initialHomeRotation,
          currentAwayRotation: initialAwayRotation,
          homeRotations: [...prev.homeRotations, initialHomeRotation],
          awayRotations: [...prev.awayRotations, initialAwayRotation],
          servingTeam: winnerTeam ?? prev.servingTeam,
          rallyStatus: "waiting_serve",
          status: nextSet > 5 ? "finished" : "in-progress",
        };
      }

      return {
        ...prev,
        actions: [...prev.actions, action],
        homeScore,
        awayScore,
        servingTeam: serverChanges ? (winnerTeam as "home" | "away") : prev.servingTeam,
        rallyStatus: nextRallyStatus,
      };
    });

    // Resetear asignaciones de roles al inicial si terminó el set
    if (hasSetWinner) {
      setRoleAssignments(initialRoleAssignments);
    }

    // Rotar solo si el equipo que ganó recuperó el saque
    if (serverChanges && winnerTeam && roleAssignments) {
      const currentHomeAssignments = roleAssignments.homeTeamAssignments;
      const currentAwayAssignments = roleAssignments.awayTeamAssignments;

      let nextHomeAssignments = currentHomeAssignments;
      let nextAwayAssignments = currentAwayAssignments;
      let substitutionEvents: SubstitutionEvent[] = [];

      if (winnerTeam === "home") {
        const rotatedHome = rotateAssignmentsMap(currentHomeAssignments);
        const homeResult = applyLiberoCentralRules("home", rotatedHome, true, "rotation-serve");
        nextHomeAssignments = homeResult.assignments;
        substitutionEvents = substitutionEvents.concat(homeResult.events);

        const awayResult = applyLiberoCentralRules("away", currentAwayAssignments, false, "loss-of-serve");
        nextAwayAssignments = awayResult.assignments;
        substitutionEvents = substitutionEvents.concat(awayResult.events);
      } else {
        const rotatedAway = rotateAssignmentsMap(currentAwayAssignments);
        const awayResult = applyLiberoCentralRules("away", rotatedAway, true, "rotation-serve");
        nextAwayAssignments = awayResult.assignments;
        substitutionEvents = substitutionEvents.concat(awayResult.events);

        const homeResult = applyLiberoCentralRules("home", currentHomeAssignments, false, "loss-of-serve");
        nextHomeAssignments = homeResult.assignments;
        substitutionEvents = substitutionEvents.concat(homeResult.events);
      }

      setRoleAssignments({
        homeTeamAssignments: nextHomeAssignments,
        awayTeamAssignments: nextAwayAssignments,
      });

      if (substitutionEvents.length > 0) {
        setCurrentMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            substitutions: [...(prev.substitutions || []), ...substitutionEvents],
          };
        });
      }
    }
  };

  const handleAttack = (team: "own" | "opponent", zone: number) => {
    if (currentMatch?.rallyStatus !== "in_play") return;
    addAttack(team, zone as any);
    addMatchAction({ team, zone, evaluation: undefined });
  };

  const handleSpikeDraw = (
    team: "own" | "opponent",
    zone: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerId?: string,
    playerRole?: PlayerRole,
    evaluation?: ActionEvaluation
  ) => {
    if (currentMatch?.rallyStatus !== "in_play") return;
    addTrajectory(team, zone as any, start, end, complex, playerRole, evaluation);
    addMatchAction({ team, zone, complex, playerRole, evaluation, spike: { start, end }, playerId });
  };

  const handleServe = (
    team: "own" | "opponent",
    serveType: ServeType,
    serveResult: ServeResult,
    serve: { start: { x: number; y: number }; end: { x: number; y: number } }
  ) => {
    if (currentMatch?.rallyStatus !== "waiting_serve") return;
    addMatchAction({
      team,
      zone: 1,
      actionType: "saque",
      actionKind: "serve",
      serveType,
      serveResult,
      serve,
    });
  };


  // Si no hay partido configurado, mostrar setup
  if (!isClient) {
    return null;
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "16px", color: "#33475b" }}>
          {currentMatch.homeTeam.name}: {currentMatch.homeScore}
          {currentMatch.servingTeam === "home" && (
            <span style={{
              padding: "2px 8px",
              borderRadius: "999px",
              background: "#fff2e8",
              border: "1px solid #ffbb96",
              color: "#d46b08",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              saque
            </span>
          )}
        </div>
        <div style={{ fontSize: "14px", color: "#33475b" }}>
          Set {currentMatch.currentSet}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "16px", color: "#33475b" }}>
          {currentMatch.awayTeam.name}: {currentMatch.awayScore}
          {currentMatch.servingTeam === "away" && (
            <span style={{
              padding: "2px 8px",
              borderRadius: "999px",
              background: "#fff2e8",
              border: "1px solid #ffbb96",
              color: "#d46b08",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              saque
            </span>
          )}
        </div>
      </div>

      <Court
        stats={stats}
        trajectories={trajectories}
        trajectoryHistory={history}
        roleAssignments={roleAssignments}
        servingTeam={currentMatch.servingTeam}
        teamNames={{ home: currentMatch.homeTeam.name, away: currentMatch.awayTeam.name }}
        rallyStatus={currentMatch.rallyStatus ?? "waiting_serve"}
        onAttack={handleAttack}
        onToggleMode={toggleMode}
        onReset={() => {
          resetStats();
          resetTrajectories();
          setCurrentMatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              actions: [],
              homeScore: 0,
              awayScore: 0,
              currentSet: 1,
              rallyStatus: "waiting_serve",
            };
          });
        }}
        onServe={handleServe}
        onSpikeDraw={handleSpikeDraw}
      />

      <Stats trajectories={trajectories.own} actions={currentMatch?.actions || []} match={currentMatch} />

      <DataExportImport
        trajectories={trajectories}
        trajectoryHistory={history}
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
