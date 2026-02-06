// hooks/useMatchSetup.ts
/**
 * Hook para manejar la creación de un partido.
 * Flujo: Seleccionar/crear equipos → Crear jugadores → Confirmar partido
 * 
 * Basado en el modelo: types/volley-model.ts
 */

import { useState } from "react";
import type { Team, Player, Match } from "@/types/volley-model";
import { loadFromStorage, usePersistentStorage } from "./usePersistentStorage";
import { useTeamManagement } from "./useTeamManagement";

const MATCH_SETUP_STORAGE_KEY = "voley-stats:match-setup";

interface UseMatchSetupReturn {
  // Estado del flujo
  step: "selectTeams" | "configTeams" | "confirm";
  
  // Equipos en el flujo
  selectedHomeTeam: Team | null;
  selectedAwayTeam: Team | null;
  
  // Equipo siendo editado (crear jugadores, etc)
  editingTeam: Team | null;
  
  // Acciones
  selectTeam: (teamId: string, side: "home" | "away") => void;
  startCreatingTeam: (side: "home" | "away") => void;
  updateEditingTeam: (team: Team) => void;
  confirmMatchSetup: () => Match;
  goBack: () => void;
}

export function useMatchSetup(): UseMatchSetupReturn {
  const { teams, addTeam } = useTeamManagement();
  
  const [step, setStep] = useState<"selectTeams" | "configTeams" | "confirm">("selectTeams");
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<Team | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingSide, setEditingSide] = useState<"home" | "away" | null>(null);

  const selectTeam = (teamId: string, side: "home" | "away") => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    if (side === "home") {
      setSelectedHomeTeam(team);
    } else {
      setSelectedAwayTeam(team);
    }

    // Si ambos equipos seleccionados, avanzar
    if (side === "home" && selectedAwayTeam) {
      setStep("confirm");
    } else if (side === "away" && selectedHomeTeam) {
      setStep("confirm");
    }
  };

  const startCreatingTeam = (side: "home" | "away") => {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: "",
      players: [],
      createdAt: Date.now(),
    };
    setEditingTeam(newTeam);
    setEditingSide(side);
    setStep("configTeams");
  };

  const updateEditingTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const confirmMatchSetup = (): Match => {
    if (!selectedHomeTeam || !selectedAwayTeam) {
      throw new Error("Debe seleccionar ambos equipos");
    }

    if (selectedHomeTeam.players.length < 6) {
      throw new Error("El equipo HOME necesita al menos 6 jugadores");
    }

    if (selectedAwayTeam.players.length < 6) {
      throw new Error("El equipo AWAY necesita al menos 6 jugadores");
    }

    // Crear partido vacío (sin rotación aún)
    const match: Match = {
      id: crypto.randomUUID(),
      homeTeam: selectedHomeTeam,
      awayTeam: selectedAwayTeam,
      actions: [],
      homeRotations: [],
      awayRotations: [],
      currentHomeRotation: null as any, // Se asignará en FASE 2
      currentAwayRotation: null as any,
      homeScore: 0,
      awayScore: 0,
      currentSet: 1,
      status: "setup",
      createdAt: Date.now(),
    };

    return match;
  };

  const goBack = () => {
    if (step === "configTeams") {
      setEditingTeam(null);
      setEditingSide(null);
      setStep("selectTeams");
    } else if (step === "confirm") {
      setStep("selectTeams");
    }
  };

  return {
    step,
    selectedHomeTeam,
    selectedAwayTeam,
    editingTeam,
    selectTeam,
    startCreatingTeam,
    updateEditingTeam,
    confirmMatchSetup,
    goBack,
  };
}
