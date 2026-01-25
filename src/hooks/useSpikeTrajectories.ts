import { useState } from "react";
import type { SpikeVector } from "@/types/spike";
import type { Zone } from "@/types/stats";
import { createSpikeVector } from "@/utils/spikeMath";

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
    const spikeData = createSpikeVector(zone, start, end);

    setTrajectories((prev) => ({
      ...prev,
      [zone]: [
        ...prev[zone],
        {
          id: crypto.randomUUID(),
          ...spikeData,
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
