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

export interface GameTrajectoryHistory {
  own: SpikeVector[];
  opponent: SpikeVector[];
}

const emptyTrajectories: SpikeTrajectoriesByZone = {
  1: [],
  2: [],
  3: [],
  4: [],
  6: [],
};

const emptyTrajectoryHistory: GameTrajectoryHistory = {
  own: [],
  opponent: [],
};

export function useGameTrajectories() {
  const [trajectories, setTrajectories] = useState<GameTrajectories>(() => {
    // Cargar del localStorage al inicializar
    return loadFromStorage<GameTrajectories>(storageKeys.trajectories, {
      own: emptyTrajectories,
      opponent: emptyTrajectories,
    });
  });

  const [history, setHistory] = useState<GameTrajectoryHistory>(() => {
    return loadFromStorage<GameTrajectoryHistory>(storageKeys.trajectoryHistory, emptyTrajectoryHistory);
  });

  // Persistir cambios automáticamente
  usePersistentStorage(storageKeys.trajectories, trajectories);
  usePersistentStorage(storageKeys.trajectoryHistory, history);

  const addTrajectory = (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex: Complex,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => {
    const spikeData = createSpikeVector(zone, start, end, complex, playerRole, evaluation);

    const newSpike: SpikeVector = {
      id: crypto.randomUUID(),
      ...spikeData,
    };

    // Si es punto directo, archivarlo y limpiar la cancha
    if (evaluation === "#") {
      setHistory((prev) => ({
        ...prev,
        [team]: [...prev[team], newSpike],
      }));

      setTrajectories({
        own: emptyTrajectories,
        opponent: emptyTrajectories,
      });

      return;
    }

    // Agregar a las trayectorias activas del rally
    setTrajectories((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [zone]: [...prev[team][zone], newSpike],
      },
    }));
  };

  const resetGame = () => {
    setTrajectories({
      own: emptyTrajectories,
      opponent: emptyTrajectories,
    });
    setHistory({
      own: [],
      opponent: [],
    });
  };

  const resetTeam = (team: "own" | "opponent") =>
    setTrajectories((prev) => ({
      ...prev,
      [team]: emptyTrajectories,
    }));

  const resetHistory = () => {
    setHistory({
      own: [],
      opponent: [],
    });
  };

  return {
    trajectories,
    history,
    addTrajectory,
    resetGame,
    resetTeam,
    resetHistory,
  };
}
