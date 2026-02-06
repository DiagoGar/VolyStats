// components/RotationFlow/TeamSelector.tsx
/**
 * Pantalla 1: Seleccionar o crear equipos
 * Permite elegir equipos existentes o crear nuevos
 */

"use client";

import { useState } from "react";
import type { Team } from "@/types/volley-model";

interface TeamSelectorProps {
  teams: Team[];
  selectedTeam: Team | null;
  side: "home" | "away";
  onSelectTeam: (teamId: string) => void;
  onCreateNew: () => void;
}

export function TeamSelector({
  teams,
  selectedTeam,
  side,
  onSelectTeam,
  onCreateNew,
}: TeamSelectorProps) {
  return (
    <div className="team-selector">
      <h3>{side === "home" ? "Equipo Local" : "Equipo Visitante"}</h3>

      {selectedTeam ? (
        <div className="selected-team">
          <div className="team-badge" style={{ background: selectedTeam.color || "#666" }}>
            {selectedTeam.name.charAt(0)}
          </div>
          <div className="team-info">
            <p className="team-name">{selectedTeam.name}</p>
            <p className="team-count">{selectedTeam.players.length} jugadores</p>
          </div>
          <button
            className="change-btn"
            onClick={() => onSelectTeam("")}
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="team-list">
          {teams.length === 0 ? (
            <p className="no-teams">No hay equipos creados</p>
          ) : (
            <>
              <p className="select-hint">Selecciona un equipo:</p>
              {teams.map((team) => (
                <button
                  key={team.id}
                  className="team-option"
                  onClick={() => onSelectTeam(team.id)}
                >
                  <div
                    className="team-color"
                    style={{ background: team.color || "#666" }}
                  />
                  <div className="team-details">
                    <p className="name">{team.name}</p>
                    <p className="count">{team.players.length}J</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <button className="create-btn" onClick={onCreateNew}>
        + Crear Nuevo Equipo
      </button>
    </div>
  );
}
