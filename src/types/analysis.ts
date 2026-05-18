import type { Action, ActionEvaluation, ActionZone, Match, Player } from "@/types/volley-model";

export type AnalysisTeamSide = "own" | "opponent";
export type AttackTrend = "linea" | "cruzada" | "corte";
export type ReceptionQuality = "perfecta" | "positiva" | "negativa";
export type SetDistributionZone = 1 | 2 | 3 | 4 | 5 | 6;

export interface AnalysisContextStat {
  key: string;
  label: string;
  total: number;
  successRate: number;
}

export interface DirectionStat {
  key: AttackTrend;
  label: string;
  total: number;
  rate: number;
  successRate: number;
}

export interface AnalysisTrajectory {
  id: string;
  kind: "attack" | "reception" | "set";
  start: { x: number; y: number };
  end: { x: number; y: number };
  evaluation?: ActionEvaluation;
  complex?: Action["complex"];
  direction?: AttackTrend;
}

export interface AnalysisContactPoint {
  id: string;
  kind: "attack" | "reception" | "set";
  x: number;
  y: number;
}

export interface AnalysisHeatmapCell {
  zone: ActionZone;
  count: number;
  intensity: number;
}

export interface AttackCone {
  origin: { x: number; y: number };
  left: { x: number; y: number };
  right: { x: number; y: number };
}

export interface SetDistributionStat {
  zone: SetDistributionZone;
  label: string;
  total: number;
  rate: number;
  successRate: number;
}

export interface TacticalSetContextStat {
  key: string;
  label: string;
  total: number;
  successRate: number;
  dominantZone: SetDistributionZone | null;
  distributions: SetDistributionStat[];
}

export interface TacticalInsight {
  id: string;
  text: string;
}

export interface PlayerAnalysis {
  player: Player;
  match: Match;
  teamSide: AnalysisTeamSide;
  attack: {
    total: number;
    successRate: number;
    trends: DirectionStat[];
    dominantTrend: DirectionStat | null;
    cone: AttackCone | null;
    trajectories: AnalysisTrajectory[];
    contactPoints: AnalysisContactPoint[];
  };
  reception: {
    total: number;
    referencePoint: {
      x: number;
      y: number;
    };
    averageDistanceToTarget: number;
    averageLateralOffset: number;
    averageDepthOffset: number;
    qualities: Array<{
      key: ReceptionQuality;
      label: string;
      total: number;
      rate: number;
    }>;
    dominantQuality: ReceptionQuality | null;
    heatmap: AnalysisHeatmapCell[];
    trajectories: AnalysisTrajectory[];
    contactPoints: AnalysisContactPoint[];
  };
  set: {
    total: number;
    successRate: number;
    averagePrecisionDistance: number;
    dominantZone: SetDistributionZone | null;
    bestSuccessZone: SetDistributionZone | null;
    distributions: SetDistributionStat[];
    tactical: {
      byComplex: TacticalSetContextStat[];
      byRotation: TacticalSetContextStat[];
      insights: TacticalInsight[];
    };
    trajectories: AnalysisTrajectory[];
    contactPoints: AnalysisContactPoint[];
  };
  context: {
    byRotation: AnalysisContextStat[];
    byComplex: AnalysisContextStat[];
    byZone: AnalysisContextStat[];
  };
}
