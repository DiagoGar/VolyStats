import { useState, useEffect } from "react";
import type { SpikeVector, Complex, PlayerRole, Evaluation } from "@/types/spike";
import type { Zone } from "@/types/stats";
import { createSpikeVector } from "@/utils/spikeMath";
import { usePersistentStorage, loadFromStorage, storageKeys } from "./usePersistentStorage";

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
  const [trajectories, setTrajectories] = useState<GameTrajectories>(() => {
    // Cargar del localStorage al inicializar
    return loadFromStorage<GameTrajectories>(storageKeys.trajectories, {
      own: emptyTrajectories,
      opponent: emptyTrajectories,
    });
  });

  // Persitir cambios automáticamente
  usePersistentStorage(storageKeys.trajectories, trajectories);

  const addTrajectory = (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
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
            complex,
            playerRole,
            evaluation,
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
