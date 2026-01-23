import type { Zone } from "@/types/stats";

export function calculatePercentage(
  zoneValue: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((zoneValue / total) * 100);
}
