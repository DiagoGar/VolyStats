import { useState } from "react";
import type { Zone, MatchStats, Mode } from "@/types/stats";

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

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>({
    own: initialTeamStats,
    opponent: initialTeamStats,
  });

  const addAttack = (team: "own" | "opponent", zone: Zone) => {
    setStats((prev) => ({
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
    setStats((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        mode:
          prev[team].mode === "cantidad" ? "porcentaje" : "cantidad",
      },
    }));
  };

  const resetGame = () => {
    setStats({
      own: initialTeamStats,
      opponent: initialTeamStats,
    });
  };

  const resetTeam = (team: "own" | "opponent") => {
    setStats((prev) => ({
      ...prev,
      [team]: initialTeamStats,
    }));
  };

  return {
    stats,
    addAttack,
    toggleMode,
    resetGame,
    resetTeam,
  };
}
