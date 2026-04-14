import type { CourtPosition, ActionZone } from "@/types/volley-model";
import type { Zone } from "@/types/stats";

export type CourtOrientation = "normal" | "flipped";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const isTeamOnBottom = (team: "own" | "opponent", orientation: CourtOrientation) => {
  if (orientation === "flipped") {
    return team === "opponent";
  }
  return team === "own";
};

export const getActionZoneFromPosition = (
  pos: { x: number; y: number },
  team: "own" | "opponent",
  orientation: CourtOrientation
): ActionZone => {
  const isBottom = isTeamOnBottom(team, orientation);
  const localY = isBottom ? (pos.y - 0.5) / 0.5 : (0.5 - pos.y) / 0.5;
  const normalizedY = clamp01(localY);
  const normalizedX = clamp01(pos.x);

  const isFrontRow = normalizedY < 0.5;
  const isLeftCol = normalizedX < 1 / 3;
  const isMiddleCol = normalizedX >= 1 / 3 && normalizedX < 2 / 3;

  if (isFrontRow) {
    if (isLeftCol) return 4;
    if (isMiddleCol) return 3;
    return 2;
  }

  if (isLeftCol) return 5;
  if (isMiddleCol) return 6;
  return 1;
};

export const toLegacyZone = (zone: ActionZone): Zone => {
  if (zone === 5) return 6;
  return zone;
};

export const getCourtPositionCoords = (
  position: CourtPosition,
  team: "own" | "opponent",
  orientation: CourtOrientation
) => {
  const isBottom = isTeamOnBottom(team, orientation);
  const frontY = isBottom ? 0.6 : 0.4;
  const backY = isBottom ? 0.8 : 0.2;

  const leftX = 0.2;
  const middleX = 0.5;
  const rightX = 0.8;

  switch (position) {
    case 4:
      return { x: leftX, y: frontY };
    case 3:
      return { x: middleX, y: frontY };
    case 2:
      return { x: rightX, y: frontY };
    case 5:
      return { x: leftX, y: backY };
    case 6:
      return { x: middleX, y: backY };
    case 1:
    default:
      return { x: rightX, y: backY };
  }
};
