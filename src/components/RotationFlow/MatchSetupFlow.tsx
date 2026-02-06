// components/RotationFlow/MatchSetupFlow.tsx
/**
 * Flujo principal de creación de partido
 * Orquesta: Seleccionar equipos → Crear jugadores → Confirmar
 */

"use client";

import { useState } from "react";
import { TeamSelector } from "./TeamSelector";
import { TeamEditor } from "./TeamEditor";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useMatchSetup } from "@/hooks/useMatchSetup";
import type { Team, Match } from "@/types/volley-model";

interface MatchSetupFlowProps {
  onMatchReady: (match: Match) => void;
  onCancel: () => void;
}

export function MatchSetupFlow({ onMatchReady, onCancel }: MatchSetupFlowProps) {
  const { teams, addTeam } = useTeamManagement();
  const {
    step,
    selectedHomeTeam,
    selectedAwayTeam,
    editingTeam,
    selectTeam,
    startCreatingTeam,
    updateEditingTeam,
    confirmMatchSetup,
    goBack,
  } = useMatchSetup();

  const [creatingTeamSide, setCreatingTeamSide] = useState<"home" | "away" | null>(null);

  const handleSaveTeam = (team: Team) => {
    addTeam(team);

    if (creatingTeamSide === "home") {
      selectTeam(team.id, "home");
    } else if (creatingTeamSide === "away") {
      selectTeam(team.id, "away");
    }

    setCreatingTeamSide(null);
  };

  const handleCreateTeam = (side: "home" | "away") => {
    setCreatingTeamSide(side);
    startCreatingTeam(side);
  };

  const handleConfirm = () => {
    try {
      const match = confirmMatchSetup();
      onMatchReady(match);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Paso 1: Seleccionar equipos
  if (step === "selectTeams") {
    return (
      <div className="match-setup-flow">
        <h2>Crear Nuevo Partido</h2>

        <div className="teams-grid">
          <TeamSelector
            teams={teams}
            selectedTeam={selectedHomeTeam}
            side="home"
            onSelectTeam={(id) => selectTeam(id, "home")}
            onCreateNew={() => handleCreateTeam("home")}
          />

          <div className="divider">VS</div>

          <TeamSelector
            teams={teams}
            selectedTeam={selectedAwayTeam}
            side="away"
            onSelectTeam={(id) => selectTeam(id, "away")}
            onCreateNew={() => handleCreateTeam("away")}
          />
        </div>

        <div className="actions">
          <button className="back-btn" onClick={onCancel}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // Paso 2: Configurar equipo
  if (step === "configTeams") {
    return (
      <div className="match-setup-flow">
        <TeamEditor
          team={editingTeam}
          onSaveTeam={handleSaveTeam}
          onCancel={goBack}
          isCreatingNew={!editingTeam?.id}
        />
      </div>
    );
  }

  // Paso 3: Confirmar
  if (step === "confirm") {
    return (
      <div className="match-setup-flow">
        <h2>Confirmar Partido</h2>

        <div className="match-preview">
          <div className="team-card">
            <h3>{selectedHomeTeam?.name}</h3>
            <div className="team-stats">
              <p>👥 {selectedHomeTeam?.players.length} jugadores</p>
              <p>🎯 {selectedHomeTeam?.color && `Color: ${selectedHomeTeam.color}`}</p>
            </div>
            <div className="players-preview">
              {selectedHomeTeam?.players.slice(0, 6).map((p) => (
                <div key={p.id} className="player-mini">
                  #{p.number}
                </div>
              ))}
            </div>
          </div>

          <div className="vs">VS</div>

          <div className="team-card">
            <h3>{selectedAwayTeam?.name}</h3>
            <div className="team-stats">
              <p>👥 {selectedAwayTeam?.players.length} jugadores</p>
              <p>🎯 {selectedAwayTeam?.color && `Color: ${selectedAwayTeam.color}`}</p>
            </div>
            <div className="players-preview">
              {selectedAwayTeam?.players.slice(0, 6).map((p) => (
                <div key={p.id} className="player-mini">
                  #{p.number}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="back-btn" onClick={goBack}>
            ← Volver
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            ✓ Crear Partido
          </button>
        </div>
      </div>
    );
  }

  return null;
}
