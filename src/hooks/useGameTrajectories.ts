import { useState } from "react";
import type { SpikeVector } from "@/types/spike";
import type { Zone } from "@/types/stats";
import { createSpikeVector } from "@/utils/spikeMath";

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

export interface GameTrajectories {
  own: SpikeTrajectoriesByZone;
  opponent: SpikeTrajectoriesByZone;
}

const emptyTrajectories: SpikeTrajectoriesByZone = {
  1: [],
  2: [],
  3: [],
  4: [],
  6: [],
};

export function useGameTrajectories() {
  const [trajectories, setTrajectories] = useState<GameTrajectories>({
    own: emptyTrajectories,
    opponent: emptyTrajectories,
  });

  const addTrajectory = (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const spikeData = createSpikeVector(zone, start, end);

    setTrajectories((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [zone]: [
          ...prev[team][zone],
          {
            id: crypto.randomUUID(),
            ...spikeData,
          },
        ],
      },
    }));
  };

  const resetGame = () =>
    setTrajectories({
      own: emptyTrajectories,
      opponent: emptyTrajectories,
    });

  const resetTeam = (team: "own" | "opponent") =>
    setTrajectories((prev) => ({
      ...prev,
      [team]: emptyTrajectories,
    }));

  return {
    trajectories,
    addTrajectory,
    resetGame,
    resetTeam,
  };
}
