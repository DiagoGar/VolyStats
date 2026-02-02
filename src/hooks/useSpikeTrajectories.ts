import { useState } from "react";
import type { SpikeVector, Complex, PlayerRole, Evaluation } from "@/types/spike";
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
    end: { x: number; y: number },
    complex: Complex,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => {
    const spikeData = createSpikeVector(zone, start, end, complex, playerRole, evaluation);

    setTrajectories((prev) => ({
      ...prev,
      [zone]: [
        ...prev[zone],
        {
          id: crypto.randomUUID(),
          ...spikeData,
          complex,
          playerRole,
          evaluation,
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
