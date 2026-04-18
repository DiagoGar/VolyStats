import type { Action, ActionEvaluation, ActionZone, Match, Player } from "@/types/volley-model";

export type AnalysisTeamSide = "own" | "opponent";
export type AttackTrend = "linea" | "cruzada" | "corte";
export type ReceptionQuality = "perfecta" | "positiva" | "negativa";

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
  kind: "attack" | "reception";
  start: { x: number; y: number };
  end: { x: number; y: number };
  evaluation?: ActionEvaluation;
  complex?: Action["complex"];
  direction?: AttackTrend;
}

export interface AnalysisContactPoint {
  id: string;
  kind: "attack" | "reception";
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
  context: {
    byRotation: AnalysisContextStat[];
    byComplex: AnalysisContextStat[];
    byZone: AnalysisContextStat[];
  };
}
