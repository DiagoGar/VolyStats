// hooks/useTeamManagement.ts
/**
 * Hook para gestión de equipos
 * Crear, editar, listar equipos con persistencia
 */

import { useState, useEffect } from "react";
import type { Team, Player } from "@/types/rotation";
import { loadFromStorage, usePersistentStorage, storageKeys as baseStorageKeys } from "./usePersistentStorage";

const TEAMS_STORAGE_KEY = "voley-stats:teams";

interface UseTeamManagementReturn {
  teams: Team[];
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  getTeam: (teamId: string) => Team | undefined;
}

export function useTeamManagement(): UseTeamManagementReturn {
  const [teams, setTeams] = useState<Team[]>(() => {
    return loadFromStorage<Team[]>(TEAMS_STORAGE_KEY, []);
  });

  // Persistencia automática
  usePersistentStorage(TEAMS_STORAGE_KEY, teams);

  const addTeam = (team: Team) => {
    setTeams((prev) => {
      // Evitar duplicados por ID
      if (prev.some((t) => t.id === team.id)) return prev;
      return [...prev, team];
    });
  };

  const updateTeam = (updatedTeam: Team) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
    );
  };

  const deleteTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const getTeam = (teamId: string) => {
    return teams.find((t) => t.id === teamId);
  };

  return {
    teams,
    addTeam,
    updateTeam,
    deleteTeam,
    getTeam,
  };
}
