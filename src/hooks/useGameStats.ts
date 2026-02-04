import { useState, useEffect } from "react";
import type { Zone, MatchStats, Mode } from "@/types/stats";
import type { SpikeTrajectoriesByZone } from "./useGameTrajectories";
import { usePersistentStorage, loadFromStorage, storageKeys } from "./usePersistentStorage";

const initialTeamStats: MatchStats = {
  zones: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    6: 0,
  },
  total: 0,
  mode: "cantidad",
};

export interface GameStats {
  own: MatchStats;
  opponent: MatchStats;
}

function calculateStatsFromTrajectories(trajectories: SpikeTrajectoriesByZone): MatchStats {
  const zones = { 1: 0, 2: 0, 3: 0, 4: 0, 6: 0 };
  let total = 0;
  for (const zoneKey in trajectories) {
    const zone = Number(zoneKey) as Zone;
    zones[zone] = trajectories[zone].length;
    total += trajectories[zone].length;
  }
  return { zones, total, mode: "cantidad" };
}

export function useGameStats(ownTrajectories: SpikeTrajectoriesByZone, opponentTrajectories: SpikeTrajectoriesByZone) {
  const [manualStats, setManualStats] = useState<GameStats>(() => {
    // Cargar del localStorage al inicializar
    return loadFromStorage<GameStats>(storageKeys.stats, {
      own: initialTeamStats,
      opponent: initialTeamStats,
    });
  });

  // Persitir cambios automáticamente
  usePersistentStorage(storageKeys.stats, manualStats);

  const stats: GameStats = {
    own: {
      zones: {
        1: manualStats.own.zones[1] + ownTrajectories[1].length,
        2: manualStats.own.zones[2] + ownTrajectories[2].length,
        3: manualStats.own.zones[3] + ownTrajectories[3].length,
        4: manualStats.own.zones[4] + ownTrajectories[4].length,
        6: manualStats.own.zones[6] + ownTrajectories[6].length,
      },
      total: manualStats.own.total + Object.values(ownTrajectories).flat().length,
      mode: manualStats.own.mode,
    },
    opponent: {
      zones: {
        1: manualStats.opponent.zones[1] + opponentTrajectories[1].length,
        2: manualStats.opponent.zones[2] + opponentTrajectories[2].length,
        3: manualStats.opponent.zones[3] + opponentTrajectories[3].length,
        4: manualStats.opponent.zones[4] + opponentTrajectories[4].length,
        6: manualStats.opponent.zones[6] + opponentTrajectories[6].length,
      },
      total: manualStats.opponent.total + Object.values(opponentTrajectories).flat().length,
      mode: manualStats.opponent.mode,
    },
  };

  const addAttack = (team: "own" | "opponent", zone: Zone) => {
    setManualStats((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        zones: {
          ...prev[team].zones,
          [zone]: prev[team].zones[zone] + 1,
        },
        total: prev[team].total + 1,
      },
    }));
  };

  const toggleMode = (team: "own" | "opponent") => {
    setManualStats((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        mode: prev[team].mode === "cantidad" ? "porcentaje" : "cantidad",
      },
    }));
  };

  const resetGame = () => {
    setManualStats({
      own: initialTeamStats,
      opponent: initialTeamStats,
    });
  };

  return {
    stats,
    addAttack,
    toggleMode,
    resetGame,
  };
}
