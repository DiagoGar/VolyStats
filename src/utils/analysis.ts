import type {
  AnalysisContactPoint,
  AnalysisHeatmapCell,
  AnalysisTeamSide,
  AttackCone,
  AttackTrend,
  DirectionStat,
  PlayerAnalysis,
  ReceptionQuality,
  SetDistributionStat,
  SetDistributionZone,
} from "@/types/analysis";
import type { Action, ActionEvaluation, ActionZone, Match, Player } from "@/types/volley-model";
import { getActionZoneFromPosition, getCourtPositionCoords, inferAttackLaneFromContext } from "@/utils/courtGeometry";
import { assessReceptionTarget, getIdealSetterPosition } from "@/utils/reception";

const ATTACK_SUCCESS_EVALUATIONS = new Set<ActionEvaluation>(["#", "++", "+"]);
const RECEPTION_LABELS: Record<ReceptionQuality, string> = {
  perfecta: "Perfecta",
  positiva: "Positiva",
  negativa: "Negativa",
};
const ATTACK_LABELS: Record<AttackTrend, string> = {
  linea: "Linea",
  cruzada: "Cruzada",
  corte: "Corte",
};
const SET_ZONE_LABELS: Record<SetDistributionZone, string> = {
  1: "Zona 1",
  2: "Zona 2",
  3: "Zona 3",
  4: "Zona 4",
  5: "Zona 5",
  6: "Zona 6",
};

const percentage = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

const averagePoint = (points: Array<{ x: number; y: number }>) => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

const distanceBetweenPoints = (left: { x: number; y: number }, right: { x: number; y: number }) =>
  Math.sqrt((left.x - right.x) ** 2 + (left.y - right.y) ** 2);

const getPlayerLookup = (match: Match) => {
  const players = [...match.homeTeam.players, ...match.awayTeam.players];
  return new Map(players.map((player) => [player.id, player]));
};

const getPlayerTeamSide = (match: Match, player: Player): AnalysisTeamSide =>
  match.homeTeam.players.some((candidate) => candidate.id === player.id) ? "own" : "opponent";

const normalizeRotation = (action: Action) => {
  const rotationNumber = action.context?.rotationSnapshot?.currentRotationNumber;
  return typeof rotationNumber === "number" ? `R${rotationNumber + 1}` : "Sin rotacion";
};

const normalizeZone = (action: Action) => {
  if (action.actionType === "ataque") {
    const teamSide: AnalysisTeamSide = action.team === "home" ? "own" : "opponent";
    const inferredLane = inferAttackLaneFromContext({
      position: action.position,
      playerRole: action.playerRole,
      contactStart: action.spike?.start,
      team: teamSide,
      orientation: "normal",
    });
    if (inferredLane) return inferredLane === 5 ? 6 : inferredLane;
  }
  if (action.spike?.start && action.team) {
    const side: AnalysisTeamSide = action.team === "home" ? "own" : "opponent";
    return getActionZoneFromPosition(action.spike.start, side, "normal");
  }
  return action.context?.zone ?? action.zone;
};

const inferAttackTrend = (action: Action, teamSide: AnalysisTeamSide): AttackTrend => {
  if (!action.spike) return "corte";

  const startZone = getActionZoneFromPosition(action.spike.start, teamSide, "normal");
  const targetSide: AnalysisTeamSide = teamSide === "own" ? "opponent" : "own";
  const targetZone = getActionZoneFromPosition(action.spike.end, targetSide, "normal");

  if (startZone === 4) {
    if (targetZone === 1 || targetZone === 2) return "cruzada";
    if (targetZone === 5 || targetZone === 4) return "linea";
    return "corte";
  }

  if (startZone === 2) {
    if (targetZone === 4 || targetZone === 5) return "cruzada";
    if (targetZone === 1 || targetZone === 2) return "linea";
    return "corte";
  }

  if (targetZone === 3 || targetZone === 6) return "corte";

  const deltaX = Math.abs(action.spike.end.x - action.spike.start.x);
  return deltaX < 0.13 ? "linea" : "cruzada";
};

const inferReceptionQuality = (action: Action, teamSide: AnalysisTeamSide): ReceptionQuality => {
  if (!action.spike && action.evaluation) {
    if (action.evaluation === "#" || action.evaluation === "++") return "perfecta";
    if (action.evaluation === "+" || action.evaluation === "/") return "positiva";
    return "negativa";
  }

  if (!action.spike) return "positiva";
  return assessReceptionTarget(action.spike.end, teamSide).quality;
};

const projectRayToBounds = (origin: { x: number; y: number }, angle: number) => {
  const dx = Math.cos(angle);
  const dy = -Math.sin(angle);
  const candidates = [
    dx > 0 ? (1 - origin.x) / dx : Number.POSITIVE_INFINITY,
    dx < 0 ? (0 - origin.x) / dx : Number.POSITIVE_INFINITY,
    dy > 0 ? (1 - origin.y) / dy : Number.POSITIVE_INFINITY,
    dy < 0 ? (0 - origin.y) / dy : Number.POSITIVE_INFINITY,
  ].filter((value) => Number.isFinite(value) && value > 0);

  const travel = Math.min(...candidates);
  return {
    x: origin.x + dx * travel,
    y: origin.y + dy * travel,
  };
};

const buildAttackCone = (actions: Action[]): AttackCone | null => {
  if (actions.length < 2 || !actions.every((action) => action.spike)) return null;

  const starts = actions.map((action) => action.spike!.start);
  const origin = averagePoint(starts);
  const angles = actions.map((action) => action.spike!.angle);
  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);

  return {
    origin,
    left: projectRayToBounds(origin, minAngle),
    right: projectRayToBounds(origin, maxAngle),
  };
};

const buildHeatmap = (actions: Action[], teamSide: AnalysisTeamSide): AnalysisHeatmapCell[] => {
  const zones: ActionZone[] = [1, 2, 3, 4, 5, 6];
  const counts = new Map<ActionZone, number>(zones.map((zone) => [zone, 0]));

  actions.forEach((action) => {
    const zone = action.spike?.start
      ? getActionZoneFromPosition(action.spike.start, teamSide, "normal")
      : action.context?.zone ?? action.zone;
    counts.set(zone, (counts.get(zone) ?? 0) + 1);
  });

  const max = Math.max(...Array.from(counts.values()), 0);
  return zones.map((zone) => ({
    zone,
    count: counts.get(zone) ?? 0,
    intensity: max === 0 ? 0 : (counts.get(zone) ?? 0) / max,
  }));
};

const buildDirectionStats = (actions: Action[], teamSide: AnalysisTeamSide): DirectionStat[] => {
  const groups = new Map<AttackTrend, Action[]>();

  actions.forEach((action) => {
    const trend = inferAttackTrend(action, teamSide);
    groups.set(trend, [...(groups.get(trend) ?? []), action]);
  });

  return (["linea", "cruzada", "corte"] as AttackTrend[]).map((trend) => {
    const items = groups.get(trend) ?? [];
    const successCount = items.filter((action) => action.evaluation && ATTACK_SUCCESS_EVALUATIONS.has(action.evaluation)).length;
    return {
      key: trend,
      label: ATTACK_LABELS[trend],
      total: items.length,
      rate: percentage(items.length, actions.length),
      successRate: percentage(successCount, items.length),
    };
  });
};

const buildContactPoints = (actions: Action[], kind: "attack" | "reception" | "set"): AnalysisContactPoint[] =>
  actions
    .filter((action) => action.spike)
    .map((action) => ({
      id: action.id,
      kind,
      x: action.spike!.start.x,
      y: action.spike!.start.y,
    }));

const getIdealAttackPoint = (teamSide: AnalysisTeamSide, zone: SetDistributionZone) =>
  getCourtPositionCoords(zone, teamSide, "normal");

const getActionAttackZone = (action: Action, teamSide: AnalysisTeamSide): SetDistributionZone | null => {
  const inferredLane = inferAttackLaneFromContext({
    position: action.position,
    playerRole: action.playerRole,
    contactStart: action.spike?.start,
    team: teamSide,
    orientation: "normal",
  });
  if (inferredLane) return (inferredLane === 5 ? 6 : inferredLane) as SetDistributionZone;
  if (!action.spike) return null;
  return getActionZoneFromPosition(action.spike.start, teamSide, "normal") as SetDistributionZone;
};

const getSetDestinationZone = (
  action: Action,
  teamSide: AnalysisTeamSide,
  followUpAttack?: Action | null
): SetDistributionZone | null => {
  if (followUpAttack) {
    return getActionAttackZone(followUpAttack, teamSide);
  }
  if (!action.spike) return null;
  return getActionZoneFromPosition(action.spike.end, teamSide, "normal") as SetDistributionZone;
};

const buildSetFollowUpMap = (match: Match, setActions: Action[]) => {
  const results = new Map<string, Action | null>();

  setActions.forEach((setAction) => {
    const index = match.actions.findIndex((candidate) => candidate.id === setAction.id);
    if (index === -1) {
      results.set(setAction.id, null);
      return;
    }

    let linkedAttack: Action | null = null;

    for (let cursor = index + 1; cursor < match.actions.length; cursor += 1) {
      const candidate = match.actions[cursor];
      if (candidate.teamId !== setAction.teamId) continue;
      if (candidate.actionType === "ataque") {
        linkedAttack = candidate;
        break;
      }
      if (candidate.actionType === "levantamiento") break;
    }

    results.set(setAction.id, linkedAttack);
  });

  return results;
};

const buildSetDistributionStats = (
  setActions: Action[],
  teamSide: AnalysisTeamSide,
  followUps: Map<string, Action | null>
): SetDistributionStat[] => {
  const zones: SetDistributionZone[] = [4, 3, 2, 1, 6, 5];

  return zones.map((zone) => {
    const items = setActions.filter((action) => getSetDestinationZone(action, teamSide, followUps.get(action.id)) === zone);
    const successCount = items.filter((action) => {
      const followUp = followUps.get(action.id);
      return followUp?.evaluation ? ATTACK_SUCCESS_EVALUATIONS.has(followUp.evaluation) : false;
    }).length;

    return {
      zone,
      label: SET_ZONE_LABELS[zone],
      total: items.length,
      rate: percentage(items.length, setActions.length),
      successRate: percentage(successCount, items.length),
    };
  });
};

const buildContextStats = (
  actions: Action[],
  groupBy: (action: Action) => string,
  labelBy: (key: string) => string = (key) => key
) => {
  const groups = new Map<string, Action[]>();

  actions.forEach((action) => {
    const key = groupBy(action);
    groups.set(key, [...(groups.get(key) ?? []), action]);
  });

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const successCount = items.filter((action) => action.evaluation && ATTACK_SUCCESS_EVALUATIONS.has(action.evaluation)).length;
      return {
        key,
        label: labelBy(key),
        total: items.length,
        successRate: percentage(successCount, items.length),
      };
    })
    .sort((left, right) => right.total - left.total);
};

export const buildPlayerAnalysis = (match: Match, playerId: string): PlayerAnalysis | null => {
  const players = getPlayerLookup(match);
  const player = players.get(playerId);
  if (!player) return null;

  const teamSide = getPlayerTeamSide(match, player);
  const playerActions = match.actions.filter((action) => action.playerId === playerId);
  const attackActions = playerActions.filter((action) => action.actionType === "ataque" && action.spike);
  const receptionActions = playerActions.filter((action) => action.actionType === "recepcion" && action.spike);
  const setActions = playerActions.filter((action) => action.actionType === "levantamiento" && action.spike);
  const attackSuccessCount = attackActions.filter((action) => action.evaluation && ATTACK_SUCCESS_EVALUATIONS.has(action.evaluation)).length;
  const setFollowUps = buildSetFollowUpMap(match, setActions);
  const setSuccessCount = setActions.filter((action) => {
    const followUp = setFollowUps.get(action.id);
    return followUp?.evaluation ? ATTACK_SUCCESS_EVALUATIONS.has(followUp.evaluation) : false;
  }).length;
  const setDistributions = buildSetDistributionStats(setActions, teamSide, setFollowUps);
  const dominantSetZone = [...setDistributions].sort((left, right) => right.total - left.total)[0] ?? null;
  const setPrecisionDistances = setActions
    .map((action) => {
      const destinationZone = getSetDestinationZone(action, teamSide, setFollowUps.get(action.id));
      if (!action.spike || destinationZone === null) return null;
      return distanceBetweenPoints(action.spike.end, getIdealAttackPoint(teamSide, destinationZone));
    })
    .filter((value): value is number => value !== null);
  const attackTrends = buildDirectionStats(attackActions, teamSide);
  const dominantTrend = [...attackTrends].sort((left, right) => right.total - left.total)[0] ?? null;
  const receptionHeatmap = buildHeatmap(receptionActions, teamSide);
  const receptionReferencePoint = getIdealSetterPosition(teamSide);
  const receptionAssessments = receptionActions
    .filter((action) => action.spike)
    .map((action) => assessReceptionTarget(action.spike!.end, teamSide));

  const receptionQualityTotals: Record<ReceptionQuality, number> = {
    perfecta: 0,
    positiva: 0,
    negativa: 0,
  };

  receptionActions.forEach((action) => {
    receptionQualityTotals[inferReceptionQuality(action, teamSide)] += 1;
  });

  const receptionQualities = (["perfecta", "positiva", "negativa"] as ReceptionQuality[]).map((quality) => ({
    key: quality,
    label: RECEPTION_LABELS[quality],
    total: receptionQualityTotals[quality],
    rate: percentage(receptionQualityTotals[quality], receptionActions.length),
  }));

  const dominantQuality =
    (["perfecta", "positiva", "negativa"] as ReceptionQuality[]).sort(
      (left, right) => receptionQualityTotals[right] - receptionQualityTotals[left]
    )[0] ?? null;

  return {
    player,
    match,
    teamSide,
    attack: {
      total: attackActions.length,
      successRate: percentage(attackSuccessCount, attackActions.length),
      trends: attackTrends,
      dominantTrend: dominantTrend && dominantTrend.total > 0 ? dominantTrend : null,
      cone: buildAttackCone(attackActions),
      trajectories: attackActions.map((action) => ({
        id: action.id,
        kind: "attack" as const,
        start: action.spike!.start,
        end: action.spike!.end,
        evaluation: action.evaluation,
        complex: action.complex,
        direction: inferAttackTrend(action, teamSide),
      })),
      contactPoints: buildContactPoints(attackActions, "attack"),
    },
    reception: {
      total: receptionActions.length,
      referencePoint: receptionReferencePoint,
      averageDistanceToTarget:
        receptionAssessments.reduce((sum, assessment) => sum + assessment.distanceToTarget, 0) /
        Math.max(receptionAssessments.length, 1),
      averageLateralOffset:
        receptionAssessments.reduce((sum, assessment) => sum + assessment.lateralOffset, 0) /
        Math.max(receptionAssessments.length, 1),
      averageDepthOffset:
        receptionAssessments.reduce((sum, assessment) => sum + assessment.depthOffset, 0) /
        Math.max(receptionAssessments.length, 1),
      qualities: receptionQualities,
      dominantQuality: receptionActions.length > 0 ? dominantQuality : null,
      heatmap: receptionHeatmap,
      trajectories: receptionActions.map((action) => ({
        id: action.id,
        kind: "reception" as const,
        start: action.spike!.start,
        end: action.spike!.end,
        evaluation: action.evaluation,
        complex: action.complex,
      })),
      contactPoints: buildContactPoints(receptionActions, "reception"),
    },
    set: {
      total: setActions.length,
      successRate: percentage(setSuccessCount, setActions.length),
      averagePrecisionDistance:
        setPrecisionDistances.reduce((sum, distance) => sum + distance, 0) / Math.max(setPrecisionDistances.length, 1),
      dominantZone: dominantSetZone && dominantSetZone.total > 0 ? dominantSetZone.zone : null,
      distributions: setDistributions,
      trajectories: setActions.map((action) => ({
        id: action.id,
        kind: "set" as const,
        start: action.spike!.start,
        end: action.spike!.end,
        evaluation: setFollowUps.get(action.id)?.evaluation,
        complex: action.complex,
      })),
      contactPoints: buildContactPoints(setActions, "set"),
    },
    context: {
      byRotation: buildContextStats(playerActions, normalizeRotation),
      byComplex: buildContextStats(
        playerActions.filter((action) => action.complex),
        (action) => action.complex ?? "Sin complejo"
      ),
      byZone: buildContextStats(
        playerActions,
        (action) => String(normalizeZone(action)),
        (key) => `Zona ${key}`
      ),
    },
  };
};
