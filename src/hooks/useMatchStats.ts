import { useState } from "react";
import type { Zone, MatchStats, Mode } from "@/types/stats";

const initialState: MatchStats = {
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

export function useMatchStats() {
  const [stats, setStats] = useState<MatchStats>(initialState);

  const addAttack = (zone: Zone) => {
    setStats((prev) => ({
      ...prev,
      zones: {
        ...prev.zones,
        [zone]: prev.zones[zone] + 1,
      },
      total: prev.total + 1,
    }));
  };

  const toggleMode = () => {
    setStats((prev) => ({
      ...prev,
      mode: prev.mode === "cantidad" ? "porcentaje" : "cantidad",
    }));
  };

  const resetMatch = () => {
    setStats(initialState);
  };

  return {
    stats,
    addAttack,
    toggleMode,
    resetMatch,
  };
}
