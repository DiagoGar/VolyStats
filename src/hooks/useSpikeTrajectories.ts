import { useState } from "react";
import type { SpikeVector } from "@/types/spike";
import type { Zone } from "@/types/stats";

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

const emptyTrajectories: SpikeTrajectoriesByZone = {
  1: [],
  2: [],
  3: [],
  4: [],
  6: [],
};

export function useSpikeTrajectories() {
  const [trajectories, setTrajectories] =
    useState<SpikeTrajectoriesByZone>(emptyTrajectories);

  const addTrajectory = (
  zone: Zone,
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const dx = end.x - start.x;
  const dy = start.y - end.y;
  const angle = Math.atan2(dy, dx);

  setTrajectories((prev) => ({
    ...prev,
    [zone]: [
      ...prev[zone],
      {
        id: crypto.randomUUID(),
        zone,
        start,
        end,
        angle,
        createdAt: Date.now(),
      },
    ],
  }));
};


  const resetTrajectories = () => setTrajectories(emptyTrajectories);

  return {
    trajectories,
    addTrajectory,
    resetTrajectories,
  };
}
