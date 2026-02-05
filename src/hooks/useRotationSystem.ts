// hooks/useRotationSystem.ts
/**
 * Hook principal para el sistema de rotaciones
 * Gestiona estado de rotación, cambios automáticos, etc
 */

import { useState, useEffect } from "react";
import type { Match, RotationState, Team, RotationType } from "@/types/rotation";
import { loadFromStorage, usePersistentStorage } from "./usePersistentStorage";

const MATCH_STORAGE_KEY = "voley-stats:current-match";

interface UseRotationSystemReturn {
  currentMatch: Match | null;
  startMatch: (ownTeam: Team, opponentTeam: Team, rotationType: RotationType, setter: any) => void;
  rotateTeam: (teamType: "own" | "opponent") => void;
  updateScore: (teamType: "own" | "opponent", points: number) => void;
  endMatch: () => void;
}

export function useRotationSystem(): UseRotationSystemReturn {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(() => {
    return loadFromStorage<Match | null>(MATCH_STORAGE_KEY, null);
  });

  // Persistencia automática
  usePersistentStorage(MATCH_STORAGE_KEY, currentMatch);

  const startMatch = (
    ownTeam: Team,
    opponentTeam: Team,
    rotationType: RotationType,
    setter: any
  ) => {
    const match: Match = {
      id: crypto.randomUUID(),
      ownTeam,
      opponentTeam,
      rotation: {
        currentRotation: 0,
        positions: [], // Se llena en FASE 4
        setter,
        rotationType,
      },
      score: {
        own: 0,
        opponent: 0,
      },
      createdAt: Date.now(),
    };
    setCurrentMatch(match);
  };

  const rotateTeam = (teamType: "own" | "opponent") => {
    if (!currentMatch) return;

    setCurrentMatch((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        rotation: {
          ...prev.rotation,
          currentRotation: (prev.rotation.currentRotation + 1) % 6,
        },
      };
    });
  };

  const updateScore = (teamType: "own" | "opponent", points: number) => {
    if (!currentMatch) return;

    setCurrentMatch((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        score: {
          ...prev.score,
          [teamType]: points,
        },
      };
    });
  };

  const endMatch = () => {
    setCurrentMatch(null);
  };

  return {
    currentMatch,
    startMatch,
    rotateTeam,
    updateScore,
    endMatch,
  };
}
