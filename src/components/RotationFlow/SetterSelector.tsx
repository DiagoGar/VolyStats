// components/RotationFlow/SetterSelector.tsx
/**
 * PHASE 2 - Paso 1: Seleccionar el Armador (Setter)
 * 
 * El setter/armador es el jugador que toca la mayoría de pelotas en ataque.
 * En voleibol profesional, es crucial definir quién será el armador principal
 * antes de configurar las rotaciones.
 */

"use client";

import type { Match, Player } from "@/types/volley-model";

interface SetterSelectorProps {
  match: Match;
  selectedSetter: Player | null;
  onSelectSetter: (player: Player) => void;
  homeTeam: boolean;
}

export function SetterSelector({
  match,
  selectedSetter,
  onSelectSetter,
  homeTeam,
}: SetterSelectorProps) {
  const team = homeTeam ? match.homeTeam : match.awayTeam;
  const teamName = homeTeam ? "Local" : "Visitante";

  return (
    <div className="setter-selector">
      <div className="setter-header">
        <h3>👤 Seleccionar Armador</h3>
        <p>Equipo: <strong>{team.name}</strong> ({teamName})</p>
      </div>

      <div className="setter-info">
        <p>
          El armador (setter/levantador) es el jugador que toca la mayoría de pelotas 
          en ataque. Este jugador controla el ritmo y distribución del equipo.
        </p>
      </div>

      <div className="setter-list">
        {team.players.map((player) => (
          <div
            key={player.id}
            className={`setter-item ${selectedSetter?.id === player.id ? "selected" : ""}`}
            onClick={() => onSelectSetter(player)}
          >
            <div className="setter-item-main">
              <div className="setter-number">#{player.number}</div>
              <div className="setter-info-block">
                <div className="setter-name">{player.name}</div>
                <div className="setter-role">{player.primaryRole}</div>
              </div>
            </div>
            {selectedSetter?.id === player.id && (
              <div className="setter-badge">✓ Seleccionado</div>
            )}
          </div>
        ))}
      </div>

      {selectedSetter && (
        <div className="setter-selected-info">
          <p>
            <strong>Armador seleccionado:</strong> #{selectedSetter.number} {selectedSetter.name}
          </p>
        </div>
      )}
    </div>
  );
}
