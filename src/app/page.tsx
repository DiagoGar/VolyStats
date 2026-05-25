"use client";

import { useState, useEffect } from "react";
import { Court } from "@/components/Court/Court";
import { Stats } from "@/components/Stats/Stats";
import { DataExportImport } from "@/components/DataExportImport/DataExportImport";
import { MatchSetupFlow } from "@/components/RotationFlow/MatchSetupFlow";
import { RotationConfigFlow } from "@/components/RotationFlow/RotationConfigFlow";
import { RoleAssignmentFlow } from "@/components/RotationFlow/RoleAssignmentFlow";
import { PlayerAnalysisView } from "@/components/Analysis/PlayerAnalysisView";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories, type GameTrajectories } from "@/hooks/useGameTrajectories";
import { clearStorage, loadFromStorage, storageKeys } from "@/hooks/usePersistentStorage";
import "@/components/DataExportImport/dataExportImport.css";
import "@/components/RotationFlow/matchSetup.css";
import type { Match, Player, CourtPosition, Action, ActionEvaluation, Rotation, RotationSnapshot, SubstitutionEvent, ServeResult, ServeType, ActionType, RallyActionFlowType, RallyStatus } from "@/types/volley-model";
import type { Zone } from "@/types/stats";
import type { RotationType } from "@/types/rotation";
import type { Complex, PlayerRole } from "@/types/spike";
import { calculateAngle } from "@/utils/spikeMath";
import { inferAttackLaneFromContext } from "@/utils/courtGeometry";
import { assessReceptionTarget, getReceptionEvaluation } from "@/utils/reception";

type MatchTeamSide = "home" | "away";
type RallyComplexPhase = "pre_k1_attack" | "pre_k2_attack" | "extended_rally";

const getOpposingTeam = (team: MatchTeamSide): MatchTeamSide => (team === "home" ? "away" : "home");

const getCurrentRallyActions = (match: Match) => {
  const latestServeIndex = [...match.actions]
    .map((action, index) => ({ action, index }))
    .reverse()
    .find(({ action }) => action.actionType === "saque")?.index;

  if (latestServeIndex === undefined) return [];
  return match.actions.slice(latestServeIndex + 1);
};

const getLastRecordedActionTeam = (match: Match): MatchTeamSide | null => {
  const latestAction = match.actions[match.actions.length - 1];
  if (!latestAction) return null;
  return latestAction.team ?? (latestAction.teamId === match.homeTeam.id ? "home" : "away");
};

const getRallyComplexPhase = (match: Match): RallyComplexPhase => {
  const servingTeam = match.servingTeam ?? "home";
  const receivingTeam = getOpposingTeam(servingTeam);
  const rallyActions = getCurrentRallyActions(match);

  let phase: RallyComplexPhase = "pre_k1_attack";

  for (const action of rallyActions) {
    const actionTeam = action.team ?? (action.teamId === match.homeTeam.id ? "home" : "away");

    if (phase === "pre_k1_attack") {
      if (action.actionType === "ataque" && actionTeam === receivingTeam) {
        phase = "pre_k2_attack";
      }
      continue;
    }

    if (phase === "pre_k2_attack") {
      if (action.actionType === "ataque" && actionTeam === servingTeam) {
        phase = "extended_rally";
      }
      continue;
    }
  }

  return phase;
};

const inferComplexFromRallyState = (
  match: Match,
  team: MatchTeamSide,
  actionType: ActionType,
  freeBallTeam?: MatchTeamSide | null,
  explicitComplex?: Complex
): Complex => {
  if (explicitComplex) return explicitComplex;
  if (actionType === "saque") return "K0";
  if (freeBallTeam === team && (actionType === "recepcion" || actionType === "levantamiento" || actionType === "ataque")) {
    return "K5";
  }

  const servingTeam = match.servingTeam ?? "home";
  const receivingTeam = getOpposingTeam(servingTeam);
  const phase = getRallyComplexPhase(match);

  if (phase === "pre_k1_attack") {
    return team === receivingTeam ? "K1" : "K3";
  }

  if (phase === "pre_k2_attack") {
    return team === servingTeam ? "K2" : "K3";
  }

  return "K3";
};

const normalizeLegacyRole = (role: string | undefined): PlayerRole =>
  role === "zaguero" || !role ? "punta" : (role as PlayerRole);

const normalizePlayer = <T extends { primaryRole?: string }>(player: T): T =>
  ({
    ...player,
    primaryRole: normalizeLegacyRole(player.primaryRole),
  }) as T;

const normalizeAssignments = (
  assignments: Record<CourtPosition, Player>
): Record<CourtPosition, Player> => ({
  1: normalizePlayer(assignments[1]),
  2: normalizePlayer(assignments[2]),
  3: normalizePlayer(assignments[3]),
  4: normalizePlayer(assignments[4]),
  5: normalizePlayer(assignments[5]),
  6: normalizePlayer(assignments[6]),
});

const normalizeMatch = (match: Match | null): Match | null => {
  if (!match) return null;

  const normalizeRotation = (rotation: Rotation) => ({
    ...rotation,
    setter: normalizePlayer(rotation.setter),
    positions: normalizeAssignments(rotation.positions),
  });

  return {
    ...match,
    homeTeam: {
      ...match.homeTeam,
      players: match.homeTeam.players.map(normalizePlayer),
    },
    awayTeam: {
      ...match.awayTeam,
      players: match.awayTeam.players.map(normalizePlayer),
    },
    actions: match.actions.map((action) => ({
      ...action,
      playerRole: normalizeLegacyRole(action.playerRole),
    })),
    currentHomeRotation: match.currentHomeRotation ? normalizeRotation(match.currentHomeRotation) : match.currentHomeRotation,
    currentAwayRotation: match.currentAwayRotation ? normalizeRotation(match.currentAwayRotation) : match.currentAwayRotation,
    homeRotations: match.homeRotations.map(normalizeRotation),
    awayRotations: match.awayRotations.map(normalizeRotation),
  };
};

const normalizeRoleAssignments = (
  assignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null
) =>
  assignments
    ? {
        homeTeamAssignments: normalizeAssignments(assignments.homeTeamAssignments),
        awayTeamAssignments: normalizeAssignments(assignments.awayTeamAssignments),
      }
    : null;

export default function Page() {
  const [viewMode, setViewMode] = useState<"register" | "analysis">("register");
  const [isClient, setIsClient] = useState(false);
  const [freeBallTeam, setFreeBallTeam] = useState<MatchTeamSide | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(() =>
    normalizeMatch(loadFromStorage<Match | null>(storageKeys.match, null))
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
    normalizeRoleAssignments(loadFromStorage<{
      homeTeamAssignments: Record<CourtPosition, Player>;
      awayTeamAssignments: Record<CourtPosition, Player>;
    } | null>(storageKeys.roleAssignments, null)
    )
  );
  const [initialRoleAssignments, setInitialRoleAssignments] = useState<{
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null>(null);
  const { trajectories, history, addTrajectory, finalizeRally, resetGame: resetTrajectories } = useGameTrajectories();
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
    setFreeBallTeam(null);
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
    setFreeBallTeam(null);
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
    reason: string,
    type: "substitution" | "libero_swap" = "substitution"
  ): SubstitutionEvent | null => {
    if (!currentMatch) return null;
    return {
      id: crypto.randomUUID(),
      type,
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
      const event = buildSubstitutionEvent(teamType, outgoing, incoming, position, ruleReason, "libero_swap");
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

  const getTeamAssignments = (teamType: "home" | "away") => {
    if (!roleAssignments) return null;
    return teamType === "home" ? roleAssignments.homeTeamAssignments : roleAssignments.awayTeamAssignments;
  };

  const getBenchPlayers = (teamType: "home" | "away") => {
    if (!currentMatch || !roleAssignments) return [];
    const teamPlayers = teamType === "home" ? currentMatch.homeTeam.players : currentMatch.awayTeam.players;
    const assignments = getTeamAssignments(teamType);
    if (!assignments) return [];
    const onCourtIds = new Set(Object.values(assignments).map((player) => player.id));
    return teamPlayers.filter((player) => !onCourtIds.has(player.id));
  };

  const handleManualSubstitution = (
    teamType: "home" | "away",
    position: CourtPosition,
    outPlayerId: string,
    inPlayerId: string
  ) => {
    if (!currentMatch || !roleAssignments) return { ok: false as const, message: "No hay partido activo." };
    if (currentMatch.rallyStatus !== "waiting_serve") {
      return { ok: false as const, message: "Las sustituciones solo se permiten entre rallies." };
    }

    const assignments = getTeamAssignments(teamType);
    if (!assignments) {
      return { ok: false as const, message: "No hay rotacion activa para este equipo." };
    }

    const currentPlayer = assignments[position];
    if (!currentPlayer || currentPlayer.id !== outPlayerId) {
      return { ok: false as const, message: "La jugadora o jugador que sale ya no ocupa esa posicion." };
    }

    const benchPlayers = getBenchPlayers(teamType);
    const incoming = benchPlayers.find((player) => player.id === inPlayerId);
    if (!incoming) {
      return { ok: false as const, message: "La jugadora o jugador que entra debe venir del banco." };
    }

    const event = buildSubstitutionEvent(teamType, currentPlayer, incoming, position, "manual", "substitution");
    if (!event) {
      return { ok: false as const, message: "No se pudo registrar la sustitucion." };
    }

    const nextAssignments = {
      ...assignments,
      [position]: incoming,
    };

    setRoleAssignments((prev) => {
      if (!prev) return prev;
      return teamType === "home"
        ? { ...prev, homeTeamAssignments: nextAssignments }
        : { ...prev, awayTeamAssignments: nextAssignments };
    });

    setCurrentMatch((prev) => {
      if (!prev) return prev;
      const nextRotation =
        teamType === "home"
          ? { ...prev.currentHomeRotation, positions: nextAssignments, updatedAt: Date.now() }
          : { ...prev.currentAwayRotation, positions: nextAssignments, updatedAt: Date.now() };

      return {
        ...prev,
        currentHomeRotation: teamType === "home" ? nextRotation : prev.currentHomeRotation,
        currentAwayRotation: teamType === "away" ? nextRotation : prev.currentAwayRotation,
        homeRotations:
          teamType === "home"
            ? prev.homeRotations.map((rotation, index, rotations) =>
                index === rotations.length - 1 ? nextRotation : rotation
              )
            : prev.homeRotations,
        awayRotations:
          teamType === "away"
            ? prev.awayRotations.map((rotation, index, rotations) =>
                index === rotations.length - 1 ? nextRotation : rotation
              )
            : prev.awayRotations,
        substitutions: [...(prev.substitutions || []), event],
      };
    });

    return { ok: true as const };
  };

  const handleManualRotationAdvance = (teamType: "home" | "away") => {
    if (!currentMatch || !roleAssignments) {
      return { ok: false as const, message: "No hay partido activo." };
    }
    if (currentMatch.rallyStatus !== "waiting_serve") {
      return { ok: false as const, message: "La rotacion manual solo se permite entre rallies." };
    }

    const assignments = getTeamAssignments(teamType);
    if (!assignments) {
      return { ok: false as const, message: "No hay rotacion activa para este equipo." };
    }

    const rotatedAssignments = rotateAssignmentsMap(assignments);
    const rotationResult = applyLiberoCentralRules(
      teamType,
      rotatedAssignments,
      currentMatch.servingTeam === teamType,
      "manual-rotation"
    );
    const nextAssignments = rotationResult.assignments;

    setRoleAssignments((prev) => {
      if (!prev) return prev;
      return teamType === "home"
        ? { ...prev, homeTeamAssignments: nextAssignments }
        : { ...prev, awayTeamAssignments: nextAssignments };
    });

    setCurrentMatch((prev) => {
      if (!prev) return prev;

      const previousRotation =
        teamType === "home" ? prev.currentHomeRotation : prev.currentAwayRotation;
      const nextRotation = {
        ...previousRotation,
        positions: nextAssignments,
        currentRotationNumber: (previousRotation.currentRotationNumber + 1) % 6,
        updatedAt: Date.now(),
      };

      return {
        ...prev,
        currentHomeRotation: teamType === "home" ? nextRotation : prev.currentHomeRotation,
        currentAwayRotation: teamType === "away" ? nextRotation : prev.currentAwayRotation,
        homeRotations:
          teamType === "home"
            ? prev.homeRotations.map((rotation, index, rotations) =>
                index === rotations.length - 1 ? nextRotation : rotation
              )
            : prev.homeRotations,
        awayRotations:
          teamType === "away"
            ? prev.awayRotations.map((rotation, index, rotations) =>
                index === rotations.length - 1 ? nextRotation : rotation
              )
            : prev.awayRotations,
        substitutions: rotationResult.events.length > 0
          ? [...(prev.substitutions || []), ...rotationResult.events]
          : prev.substitutions,
      };
    });

    return { ok: true as const };
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
    courtPosition,
    actionType = "ataque",
    actionKind,
    serveType,
    serveResult,
    serve,
    rallyStatusOverride,
  }: {
    team: "own" | "opponent";
    zone: number;
    complex?: Complex;
    playerRole?: PlayerRole;
    evaluation?: ActionEvaluation;
    spike?: { start: { x: number; y: number }; end: { x: number; y: number } };
    playerId?: string;
    courtPosition?: CourtPosition;
    actionType?: ActionType;
    actionKind?: Action["type"];
    serveType?: ServeType;
    serveResult?: ServeResult;
    serve?: { start: { x: number; y: number }; end: { x: number; y: number } };
    rallyStatusOverride?: RallyStatus;
  }) => {
    if (!currentMatch) return;

    const player = playerId
      ? [...currentMatch.homeTeam.players, ...currentMatch.awayTeam.players].find((p) => p.id === playerId)
      : getPlayerFromTeamByZone(team, zone);
    const position = courtPosition ?? (zone as CourtPosition);
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

    const inferredComplex = inferComplexFromRallyState(
      currentMatch,
      team === "own" ? "home" : "away",
      actionType,
      freeBallTeam,
      complex
    );

    const action: Action = {
      id: crypto.randomUUID(),
      playerId: player?.id || "",
      playerRole: playerRole || normalizeLegacyRole(player?.primaryRole),
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
      complex: inferredComplex,
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

    const computedNextRallyStatus =
      actionType === "saque"
        ? serveResult === "en_juego"
          ? "awaiting_serve_reception"
          : "waiting_serve"
        : isTerminalEvaluation
          ? "waiting_serve"
          : "in_play";
    const nextRallyStatus = rallyStatusOverride ?? computedNextRallyStatus;

    const nextLastActionType: RallyActionFlowType | null =
      actionType === "saque"
        ? serveResult === "en_juego"
          ? "serve"
          : null
        : actionType === "ataque"
          ? "attack"
          : actionType === "levantamiento"
            ? "set"
          : actionType === "recepcion"
            ? "defense"
            : null;

    const nextLastActionTeam =
      nextLastActionType && team ? (team === "own" ? "home" : "away") : null;

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
          lastActionType: null,
          lastActionTeam: null,
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
        lastActionType: nextRallyStatus !== "waiting_serve" ? nextLastActionType : null,
        lastActionTeam: nextRallyStatus !== "waiting_serve" ? nextLastActionTeam : null,
      };
    });

    if (nextRallyStatus === "waiting_serve" && winnerTeam) {
      finalizeRally(winnerTeam === "home" ? "own" : "opponent");
    }

    if (actionType === "ataque" && freeBallTeam === (team === "own" ? "home" : "away")) {
      setFreeBallTeam(null);
    }

    if (nextRallyStatus === "waiting_serve") {
      setFreeBallTeam(null);
    }

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

  const handleAttack = (
    team: "own" | "opponent",
    zone: number,
    courtPosition?: CourtPosition,
    playerRole?: PlayerRole,
    contactStart?: { x: number; y: number }
  ) => {
    if (currentMatch?.rallyStatus !== "in_play") return;
    const inferredLane = inferAttackLaneFromContext({
      position: courtPosition,
      playerRole,
      contactStart,
      team,
    });
    const statsZone = (inferredLane === 5 ? 6 : inferredLane ?? zone) as Zone;
    addAttack(team, statsZone);
  };

  const inferDefenseEvaluation = (
    team: "own" | "opponent",
    end: { x: number; y: number }
  ): ActionEvaluation => {
    const teamSide = team === "own" ? "own" : "opponent";
    return getReceptionEvaluation(assessReceptionTarget(end, teamSide).quality);
  };

  const handleRallyDraw = (
    team: "own" | "opponent",
    zone: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex?: Complex,
    playerId?: string,
    playerRole?: PlayerRole,
    evaluation?: ActionEvaluation,
    courtPosition?: CourtPosition
  ) => {
    if (currentMatch?.rallyStatus !== "in_play") return;
    const teamId = team === "own" ? "home" : "away";
    const isDefense =
      currentMatch.lastActionType === "attack" &&
      currentMatch.lastActionTeam !== null &&
      currentMatch.lastActionTeam !== teamId;
    const isSet =
      currentMatch.lastActionType === "defense" &&
      currentMatch.lastActionTeam !== null &&
      currentMatch.lastActionTeam === teamId;
    const resolvedEvaluation = isDefense && !evaluation ? inferDefenseEvaluation(team, end) : evaluation;
    const inferredComplex = inferComplexFromRallyState(
      currentMatch,
      teamId,
      isDefense ? "recepcion" : isSet ? "levantamiento" : "ataque",
      freeBallTeam,
      complex
    );
    addTrajectory(team, zone as any, start, end, inferredComplex, playerRole, resolvedEvaluation, isDefense ? "defense" : isSet ? "set" : "attack");
    addMatchAction({
      team,
      zone,
      complex: inferredComplex,
      playerRole,
      evaluation: resolvedEvaluation,
      spike: { start, end },
      playerId,
      courtPosition,
      actionType: isDefense ? "recepcion" : isSet ? "levantamiento" : "ataque",
      actionKind: isDefense ? "dig" : isSet ? "set" : "spike",
    });
  };

  const handleServe = (
    team: "own" | "opponent",
    serveType: ServeType,
    serveResult: ServeResult,
    serve: { start: { x: number; y: number }; end: { x: number; y: number } }
  ) => {
    if (currentMatch?.rallyStatus !== "waiting_serve") return;
    addTrajectory(team, 1 as any, serve.start, serve.end, "K0", undefined, undefined, "serve");
    addMatchAction({
      team,
      zone: 1,
      complex: "K0",
      actionType: "saque",
      actionKind: "serve",
      serveType,
      serveResult,
      serve,
    });
  };

  const handleServeReception = (
    team: "own" | "opponent",
    zone: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    playerId?: string,
    playerRole?: PlayerRole,
    courtPosition?: CourtPosition
  ) => {
    if (!currentMatch) return;
    const isServeReception = currentMatch.rallyStatus === "awaiting_serve_reception";
    const isFreeBallReception =
      currentMatch.rallyStatus === "in_play" &&
      freeBallTeam === (team === "own" ? "home" : "away");

    if (!isServeReception && !isFreeBallReception) return;

    const servingSide: "own" | "opponent" = currentMatch.servingTeam === "home" ? "own" : "opponent";
    if (isServeReception && team === servingSide) return;
    const evaluation = inferDefenseEvaluation(team, end);
    const inferredComplex = inferComplexFromRallyState(
      currentMatch,
      team === "own" ? "home" : "away",
      "recepcion",
      freeBallTeam,
      isServeReception ? "K1" : undefined
    );

    addTrajectory(team, zone as any, start, end, inferredComplex, playerRole, evaluation, "defense");
    addMatchAction({
      team,
      zone,
      complex: inferredComplex,
      playerRole,
      evaluation,
      spike: { start, end },
      playerId,
      courtPosition,
      actionType: "recepcion",
      actionKind: "dig",
      rallyStatusOverride: "in_play",
    });
  };

  const handleActivateFreeBall = () => {
    if (!currentMatch || currentMatch.rallyStatus !== "in_play") return;
    const lastActionTeam = getLastRecordedActionTeam(currentMatch);
    if (!lastActionTeam) return;
    const receiverTeam: MatchTeamSide = lastActionTeam === "home" ? "away" : "home";
    setFreeBallTeam((prev) => {
      return prev === receiverTeam ? null : receiverTeam;
    });
  };

  const handleRallyResult = (team: "own" | "opponent") => {
    if (!currentMatch || (currentMatch.rallyStatus !== "in_play" && currentMatch.rallyStatus !== "awaiting_serve_reception")) return;

    const winnerTeam: "home" | "away" = team === "own" ? "home" : "away";
    const currentServer = currentMatch.servingTeam ?? "home";
    const serverChanges = winnerTeam !== currentServer;

    let homeScore = currentMatch.homeScore;
    let awayScore = currentMatch.awayScore;
    if (winnerTeam === "home") {
      homeScore += 1;
    } else {
      awayScore += 1;
    }

    const setWinThreshold = 25;
    const setLead = 2;
    const hasSetWinner =
      (homeScore >= setWinThreshold || awayScore >= setWinThreshold) &&
      Math.abs(homeScore - awayScore) >= setLead;

    const initialHomeRotation = currentMatch.homeRotations[0] || currentMatch.currentHomeRotation;
    const initialAwayRotation = currentMatch.awayRotations[0] || currentMatch.currentAwayRotation;

    setCurrentMatch((prev) => {
      if (!prev) return prev;

      const nextActions = [...prev.actions];
      const latestAction = nextActions[nextActions.length - 1];

      if (latestAction && latestAction.actionType === "ataque") {
        const latestActionTeam = latestAction.team ?? (latestAction.teamId === prev.homeTeam.id ? "home" : "away");
        nextActions[nextActions.length - 1] = {
          ...latestAction,
          evaluation: latestActionTeam === winnerTeam ? "#" : "--",
        };
      } else if (latestAction && latestAction.actionType === "saque") {
        const latestActionTeam = latestAction.team ?? (latestAction.teamId === prev.homeTeam.id ? "home" : "away");
        if (latestActionTeam === winnerTeam) {
          nextActions[nextActions.length - 1] = {
            ...latestAction,
            serveResult: "ace",
          };
        }
      }

      if (hasSetWinner) {
        const nextSet = prev.currentSet + 1;
        return {
          ...prev,
          actions: nextActions,
          homeScore: 0,
          awayScore: 0,
          currentSet: nextSet,
          currentHomeRotation: initialHomeRotation,
          currentAwayRotation: initialAwayRotation,
          homeRotations: [...prev.homeRotations, initialHomeRotation],
          awayRotations: [...prev.awayRotations, initialAwayRotation],
          servingTeam: winnerTeam ?? prev.servingTeam,
          rallyStatus: "waiting_serve",
          lastActionType: null,
          lastActionTeam: null,
          status: nextSet > 5 ? "finished" : "in-progress",
        };
      }

      return {
        ...prev,
        actions: nextActions,
        homeScore,
        awayScore,
        servingTeam: serverChanges ? winnerTeam : prev.servingTeam,
        rallyStatus: "waiting_serve",
        lastActionType: null,
        lastActionTeam: null,
      };
    });

    finalizeRally(team);
    setFreeBallTeam(null);

    if (hasSetWinner) {
      setRoleAssignments(initialRoleAssignments);
    }

    if (serverChanges && roleAssignments) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setViewMode("register")}
            style={{
              padding: "8px 16px",
              background: viewMode === "register" ? "#1f6feb" : "#dbe7ff",
              color: viewMode === "register" ? "white" : "#1f3b6d",
              border: "none",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Registro
          </button>
          <button
            onClick={() => setViewMode("analysis")}
            style={{
              padding: "8px 16px",
              background: viewMode === "analysis" ? "#0f766e" : "#d9f6f2",
              color: viewMode === "analysis" ? "white" : "#115e59",
              border: "none",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Analisis
          </button>
        </div>
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
          Volver a configuracion
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

      {viewMode === "register" ? (
        <>
          <Court
            stats={stats}
            trajectories={trajectories}
            trajectoryHistory={history}
            match={currentMatch}
            roleAssignments={roleAssignments}
            servingTeam={currentMatch.servingTeam}
            teamNames={{ home: currentMatch.homeTeam.name, away: currentMatch.awayTeam.name }}
            rallyStatus={currentMatch.rallyStatus ?? "waiting_serve"}
            lastActionType={currentMatch.lastActionType ?? null}
            lastActionTeam={currentMatch.lastActionTeam ?? null}
            onSubstitute={handleManualSubstitution}
            onRotateTeam={handleManualRotationAdvance}
            onAttack={handleAttack}
            onToggleMode={toggleMode}
            onActivateFreeBall={handleActivateFreeBall}
            freeBallTeam={freeBallTeam === "home" ? "own" : freeBallTeam === "away" ? "opponent" : null}
            onReset={() => {
              resetStats();
              resetTrajectories();
              setFreeBallTeam(null);
              setCurrentMatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  actions: [],
                  homeScore: 0,
                  awayScore: 0,
                  currentSet: 1,
                  rallyStatus: "waiting_serve",
                  lastActionType: null,
                  lastActionTeam: null,
                };
              });
            }}
            onServe={handleServe}
            onServeReception={handleServeReception}
            onRallyResult={handleRallyResult}
            onRallyDraw={handleRallyDraw}
          />

          <Stats trajectories={trajectories.own} actions={currentMatch?.actions || []} match={currentMatch} />
        </>
      ) : (
        <PlayerAnalysisView match={currentMatch} roleAssignments={roleAssignments} />
      )}

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
