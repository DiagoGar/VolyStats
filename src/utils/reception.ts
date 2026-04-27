import type { ReceptionQuality, AnalysisTeamSide } from "@/types/analysis";
import type { ActionEvaluation } from "@/types/volley-model";

export interface ReceptionReferencePoint {
  x: number;
  y: number;
}

export interface ReceptionAssessment {
  quality: ReceptionQuality;
  distanceToTarget: number;
  lateralOffset: number;
  depthOffset: number;
  target: ReceptionReferencePoint;
}

const RECEPTION_REFERENCE_POINTS: Record<AnalysisTeamSide, ReceptionReferencePoint> = {
  own: { x: 0.62, y: 0.58 },
  opponent: { x: 0.38, y: 0.42 },
};

const PERFECT_THRESHOLDS = {
  distance: 0.09,
  lateralOffset: 0.07,
  depthOffset: 0.05,
};

const POSITIVE_THRESHOLDS = {
  distance: 0.24,
  lateralOffset: 0.18,
  depthOffset: 0.16,
};

export const getIdealSetterPosition = (teamSide: AnalysisTeamSide): ReceptionReferencePoint =>
  RECEPTION_REFERENCE_POINTS[teamSide];

export const assessReceptionTarget = (
  end: { x: number; y: number },
  teamSide: AnalysisTeamSide
): ReceptionAssessment => {
  const target = getIdealSetterPosition(teamSide);
  const lateralOffset = Math.abs(end.x - target.x);
  const depthOffset = Math.abs(end.y - target.y);
  const distanceToTarget = Math.hypot(lateralOffset, depthOffset);

  const isPerfect =
    distanceToTarget <= PERFECT_THRESHOLDS.distance &&
    lateralOffset <= PERFECT_THRESHOLDS.lateralOffset &&
    depthOffset <= PERFECT_THRESHOLDS.depthOffset;

  if (isPerfect) {
    return {
      quality: "perfecta",
      distanceToTarget,
      lateralOffset,
      depthOffset,
      target,
    };
  }

  const isPositive =
    distanceToTarget <= POSITIVE_THRESHOLDS.distance &&
    lateralOffset <= POSITIVE_THRESHOLDS.lateralOffset &&
    depthOffset <= POSITIVE_THRESHOLDS.depthOffset;

  return {
    quality: isPositive ? "positiva" : "negativa",
    distanceToTarget,
    lateralOffset,
    depthOffset,
    target,
  };
};

export const getReceptionEvaluation = (quality: ReceptionQuality): ActionEvaluation => {
  if (quality === "perfecta") return "++";
  if (quality === "positiva") return "+";
  return "-";
};
