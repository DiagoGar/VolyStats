// components/RotationFlow/RoleAssignmentFlow.tsx
/**
 * PHASE 3 - Flujo de Asignación de Roles y Posiciones
 * 
 * Permite asignar jugadores a posiciones en cancha (1-6)
 * para ambos equipos en la rotación inicial.
 */

"use client";

import { useState } from "react";
import type { Match, Player, CourtPosition } from "@/types/volley-model";
import type { RotationType } from "@/types/rotation";

interface RoleAssignmentFlowProps {
  match: Match;
  homeTeamSetter: Player;
  awayTeamSetter: Player;
  rotationType: RotationType;
  onAssignmentComplete: (config: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  }) => void;
  onBack: () => void;
}

const POSITIONS: CourtPosition[] = [1, 2, 3, 4, 5, 6];

const POSITION_NAMES: Record<CourtPosition, string> = {
  1: "Izquierda Trasera",
  2: "Izquierda Delantera",
  3: "Centro Delantera",
  4: "Derecha Delantera",
  5: "Derecha Trasera",
  6: "Centro Trasera",
};

export function RoleAssignmentFlow({
  match,
  homeTeamSetter,
  awayTeamSetter,
  rotationType,
  onAssignmentComplete,
  onBack,
}: RoleAssignmentFlowProps) {
  const [homeAssignments, setHomeAssignments] = useState<
    Record<CourtPosition, Player | null>
  >({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const [awayAssignments, setAwayAssignments] = useState<
    Record<CourtPosition, Player | null>
  >({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const [currentTeam, setCurrentTeam] = useState<"home" | "away">("home");
  const [suggestedPosition, setSuggestedPosition] = useState<CourtPosition | null>(null);

  const currentTeamData = currentTeam === "home" ? match.homeTeam : match.awayTeam;
  const currentAssignments = currentTeam === "home" ? homeAssignments : awayAssignments;
  const currentSetter = currentTeam === "home" ? homeTeamSetter : awayTeamSetter;

  // Jugadores disponibles para asignar (no asignados aún)
  const availablePlayers = currentTeamData.players.filter(
    (player) =>
      !Object.values(currentAssignments).some((assigned) => assigned?.id === player.id)
  );

  // Convertir a Record con valores no nulos cuando sea posible
  const areAllAssigned = Object.values(currentAssignments).every((p) => p !== null);

  const handleAssignPlayer = (position: CourtPosition, player: Player) => {
    if (currentTeam === "home") {
      setHomeAssignments({
        ...homeAssignments,
        [position]: player,
      });
    } else {
      setAwayAssignments({
        ...awayAssignments,
        [position]: player,
      });
    }
  };

  const handleRemoveAssignment = (position: CourtPosition) => {
    if (currentTeam === "home") {
      setHomeAssignments({
        ...homeAssignments,
        [position]: null,
      });
    } else {
      setAwayAssignments({
        ...awayAssignments,
        [position]: null,
      });
    }
  };

  const handleSwitchTeam = () => {
    if (!areAllAssigned) {
      alert("Debes asignar todos los jugadores antes de cambiar de equipo");
      return;
    }
    setCurrentTeam(currentTeam === "home" ? "away" : "home");
  };

  const handleConfirmAssignments = () => {
    // Validar que ambos equipos estén completamente asignados
    const homeAllAssigned = Object.values(homeAssignments).every((p) => p !== null);
    const awayAllAssigned = Object.values(awayAssignments).every((p) => p !== null);

    if (!homeAllAssigned || !awayAllAssigned) {
      alert("Debes asignar todos los jugadores en ambos equipos");
      return;
    }

    // Convertir a Record no nulo
    const homeConfig = homeAssignments as Record<CourtPosition, Player>;
    const awayConfig = awayAssignments as Record<CourtPosition, Player>;

    onAssignmentComplete({
      homeTeamAssignments: homeConfig,
      awayTeamAssignments: awayConfig,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>📋 Asignar Posiciones en Cancha</h3>

      <div style={{
        background: "#e3f2fd",
        padding: "12px",
        borderRadius: "4px",
        marginBottom: "20px",
        fontSize: "14px",
      }}>
        <p><strong>Sistema:</strong> {rotationType}</p>
        <p><strong>Armador Local:</strong> #{homeTeamSetter.number} {homeTeamSetter.name}</p>
        <p><strong>Armador Visitante:</strong> #{awayTeamSetter.number} {awayTeamSetter.name}</p>
      </div>

      {/* Selector de equipo */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            onClick={() => currentTeam === "away" && handleSwitchTeam()}
            style={{
              padding: "12px",
              background: currentTeam === "home" ? "#3498db" : "#ecf0f1",
              color: currentTeam === "home" ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: currentTeam === "home" ? "default" : "pointer",
              fontWeight: currentTeam === "home" ? "bold" : "normal",
            }}
          >
            🏠 {match.homeTeam.name}
            {homeAssignments[1] ? " ✓" : ""}
          </button>
          <button
            onClick={() => currentTeam === "home" && handleSwitchTeam()}
            style={{
              padding: "12px",
              background: currentTeam === "away" ? "#3498db" : "#ecf0f1",
              color: currentTeam === "away" ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: currentTeam === "away" ? "default" : "pointer",
              fontWeight: currentTeam === "away" ? "bold" : "normal",
            }}
          >
            ✈️ {match.awayTeam.name}
            {awayAssignments[1] ? " ✓" : ""}
          </button>
        </div>
      </div>

      {/* Asignaciones */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Posiciones: {currentTeamData.name}</h4>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
        }}>
          {POSITIONS.map((position) => {
            const assigned = currentAssignments[position];
            return (
              <div
                key={position}
                style={{
                  padding: "12px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  background: assigned ? "#e8f5e9" : "#fafafa",
                }}
              >
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                  <strong>POS {position}</strong>
                </div>
                <div style={{ fontSize: "11px", color: "#999", marginBottom: "8px" }}>
                  {POSITION_NAMES[position]}
                </div>
                {assigned ? (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                      #{assigned.number} {assigned.name}
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(position)}
                      style={{
                        padding: "4px 8px",
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        fontSize: "12px",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    Sin asignar
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Jugadores disponibles */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Jugadores disponibles:</h4>
        {availablePlayers.length === 0 ? (
          <p style={{ color: "#999" }}>Todos los jugadores han sido asignados</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "8px",
          }}>
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                style={{
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "#f9f9f9",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                  #{player.number} {player.name}
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
                  {player.primaryRole}
                </div>
                <select
                  onChange={(e) => {
                    const pos = parseInt(e.target.value) as CourtPosition;
                    if (pos) {
                      handleAssignPlayer(pos, player);
                    }
                  }}
                  defaultValue=""
                  style={{
                    width: "100%",
                    padding: "4px",
                    fontSize: "12px",
                    borderRadius: "3px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">→ Posición</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos} disabled={!!currentAssignments[pos]}>
                      Pos {pos}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginTop: "20px",
      }}>
        <button
          onClick={onBack}
          style={{
            padding: "12px",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Atrás
        </button>
        {currentTeam === "away" && homeAssignments[1] && awayAssignments[1] && (
          <button
            onClick={handleConfirmAssignments}
            style={{
              padding: "12px",
              background: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✓ Confirmar Asignaciones
          </button>
        )}
      </div>

      {availablePlayers.length === 0 && currentTeam === "home" && (
        <div style={{
          marginTop: "15px",
          padding: "12px",
          background: "#fff3cd",
          borderRadius: "4px",
          fontSize: "14px",
        }}>
          ✓ Equipo local completado. Cambiar al equipo visitante →
        </div>
      )}
    </div>
  );
}
