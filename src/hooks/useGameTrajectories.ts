import { useState, useEffect } from "react";
import type { SpikeVector, Complex, PlayerRole, Evaluation } from "@/types/spike";
import type { Zone } from "@/types/stats";
import { createSpikeVector } from "@/utils/spikeMath";
import { usePersistentStorage, loadFromStorage, storageKeys } from "./usePersistentStorage";

export type SpikeTrajectoriesByZone = Record<Zone, SpikeVector[]>;

export interface RallyTrajectory {
  team: "own" | "opponent";
  spike: SpikeVector;
}

export interface GameRally {
  id: string;
  timestamp: number;
  trajectories: RallyTrajectory[];
  directPoint?: RallyTrajectory;
}

export interface GameTrajectories {
  own: SpikeTrajectoriesByZone;
  opponent: SpikeTrajectoriesByZone;
}

export interface GameTrajectoryHistory {
  rallies: GameRally[];
}

const emptyTrajectories: SpikeTrajectoriesByZone = {
  1: [],
  2: [],
  3: [],
  4: [],
  6: [],
};

const emptyTrajectoryHistory: GameTrajectoryHistory = {
  rallies: [],
};

const normalizeHistory = (raw: any): GameTrajectoryHistory => {
  if (!raw || typeof raw !== "object") return emptyTrajectoryHistory;

  if (Array.isArray(raw.rallies)) {
    return {
      rallies: raw.rallies,
    };
  }

  const own: SpikeVector[] = Array.isArray(raw.own) ? raw.own : [];
  const opponent: SpikeVector[] = Array.isArray(raw.opponent) ? raw.opponent : [];

  const rallies: GameRally[] = [
    ...own.map((spike) => ({
      id: crypto.randomUUID(),
      timestamp: spike.createdAt ?? Date.now(),
      trajectories: [{ team: "own", spike }],
      directPoint: { team: "own", spike },
    })),
    ...opponent.map((spike) => ({
      id: crypto.randomUUID(),
      timestamp: spike.createdAt ?? Date.now(),
      trajectories: [{ team: "opponent", spike }],
      directPoint: { team: "opponent", spike },
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return { rallies };
};

const flattenRallyTrajectories = (current: GameTrajectories): RallyTrajectory[] => {
  const items: RallyTrajectory[] = [];

  (["own", "opponent"] as const).forEach((team) => {
    Object.values(current[team]).forEach((zoneTrajectories) => {
      zoneTrajectories.forEach((spike) => {
        items.push({ team, spike });
      });
    });
  });

  items.sort((a, b) => a.spike.createdAt - b.spike.createdAt);
  return items;
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
    const stored = loadFromStorage<any>(storageKeys.trajectoryHistory, emptyTrajectoryHistory);
    return normalizeHistory(stored);
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
    evaluation?: Evaluation,
    actionType: "attack" | "defense" = "attack"
  ) => {
    const spikeData = createSpikeVector(zone, start, end, complex, playerRole, evaluation, actionType);

    const newSpike: SpikeVector = {
      id: crypto.randomUUID(),
      ...spikeData,
    };

    setTrajectories((prev) => {
      // Si es punto directo, archivarlo como rally y limpiar la cancha
      if (evaluation === "#") {
        const rallyItems = [...flattenRallyTrajectories(prev), { team, spike: newSpike }].sort(
          (a, b) => a.spike.createdAt - b.spike.createdAt
        );
        const rallyId = `rally-${newSpike.id}`;
        const rally: GameRally = {
          id: rallyId,
          timestamp: Date.now(),
          trajectories: rallyItems,
          directPoint: { team, spike: newSpike },
        };

        setHistory((prevHistory) => {
          const prevRallies = Array.isArray(prevHistory?.rallies) ? prevHistory.rallies : [];
          if (prevRallies.some((item) => item.id === rallyId || item.directPoint?.spike.id === newSpike.id)) {
            return prevHistory ?? { rallies: prevRallies };
          }
          return {
            ...prevHistory,
            rallies: [...prevRallies, rally],
          };
        });

        return {
          own: emptyTrajectories,
          opponent: emptyTrajectories,
        };
      }

      // Agregar a las trayectorias activas del rally
      return {
        ...prev,
        [team]: {
          ...prev[team],
          [zone]: [...prev[team][zone], newSpike],
        },
      };
    });
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
      rallies: [],
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
