// components/RotationFlow/RoleAssignmentFlow.tsx
/**
 * PHASE 3 - Flujo de Asignación de Roles y Posiciones
 * 
 * Permite asignar jugadores a posiciones en cancha (1-6)
 * para ambos equipos en la rotación inicial usando drag and drop.
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

const POSITIONS: CourtPosition[] = [4, 3, 2, 5, 6, 1];

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
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<CourtPosition | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

  const handleDragStart = (player: Player) => {
    setDraggedPlayer(player);
    setSelectedPlayer(player);
  };

  const handleDragOver = (e: React.DragEvent, position: CourtPosition) => {
    e.preventDefault();
    setDragOverPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (position: CourtPosition) => {
    const playerToAssign = draggedPlayer ?? selectedPlayer;
    if (!playerToAssign) return;

    // Verificar si el jugador ya está asignado a otra posición
    const currentPosition = Object.entries(currentAssignments).find(
      ([_, player]) => player?.id === playerToAssign.id
    )?.[0];

    if (currentPosition) {
      // Si ya está asignado, remover de la posición anterior
      const updatedAssignments = { ...currentAssignments };
      updatedAssignments[parseInt(currentPosition) as CourtPosition] = null;
      
      if (currentTeam === "home") {
        setHomeAssignments({
          ...updatedAssignments,
          [position]: playerToAssign,
        });
      } else {
        setAwayAssignments({
          ...updatedAssignments,
          [position]: playerToAssign,
        });
      }
    } else {
      // Asignar a nueva posición
      if (currentTeam === "home") {
        setHomeAssignments({
          ...homeAssignments,
          [position]: playerToAssign,
        });
      } else {
        setAwayAssignments({
          ...awayAssignments,
          [position]: playerToAssign,
        });
      }
    }

    setDraggedPlayer(null);
    setDragOverPosition(null);
    setSelectedPlayer(null);
  };

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer((current) => (current?.id === player.id ? null : player));
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
    setDraggedPlayer(null);
    setDragOverPosition(null);
    setSelectedPlayer(null);
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
    <>
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

      {/* Indicador de drag en progreso */}
      {draggedPlayer && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#3498db",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          Arrastrando: #{draggedPlayer.number} {draggedPlayer.name}
        </div>
      )}
      {selectedPlayer && !draggedPlayer && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1f2937",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          Seleccionado: #{selectedPlayer.number} {selectedPlayer.name}. Toca una posición para ubicarlo.
        </div>
      )}

      {/* Asignaciones con Drag & Drop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
      }}>
          {POSITIONS.map((position) => {
            const assigned = currentAssignments[position];
            const isDragOver = dragOverPosition === position;
            return (
              <div
                key={position}
                onDragOver={(e) => handleDragOver(e, position)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(position)}
                onClick={() => handleDrop(position)}
                onPointerDown={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  padding: "12px",
                  border: `2px ${isDragOver ? 'solid' : 'dashed'} ${isDragOver ? '#27ae60' : '#ddd'}`,
                  borderRadius: "8px",
                  background: assigned ? "#e8f5e9" : isDragOver || selectedPlayer ? "#d4edda" : "#fafafa",
                  minHeight: "80px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  touchAction: "manipulation",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                  transition: "all 0.2s ease",
                  transform: isDragOver ? "scale(1.05)" : "scale(1)",
                  boxShadow: isDragOver ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                  <strong>POS {position}</strong>
                </div>
                <div style={{ fontSize: "10px", color: "#999", marginBottom: "8px", textAlign: "center" }}>
                  {POSITION_NAMES[position]}
                </div>
                {assigned ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      #{assigned.number} {assigned.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                      {assigned.primaryRole}
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
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: dragOverPosition === position ? "#27ae60" : "#999", textAlign: "center" }}>
                    {dragOverPosition === position ? "¡Suelta aquí!" : "Arrastra un jugador aquí"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Jugadores disponibles:</h4>
        {availablePlayers.length === 0 ? (
          <p style={{ color: "#999" }}>Todos los jugadores han sido asignados</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "8px",
          }}>
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                draggable
                onDragStart={() => handleDragStart(player)}
                onClick={() => handleSelectPlayer(player)}
                onPointerDown={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  padding: "12px",
                  border: selectedPlayer?.id === player.id ? "2px solid #27ae60" : "2px solid #3498db",
                  borderRadius: "8px",
                  background: selectedPlayer?.id === player.id ? "#e8f5e9" : "#f8f9fa",
                  cursor: "grab",
                  userSelect: "none",
                  touchAction: "manipulation",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e3f2fd";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedPlayer?.id === player.id ? "#e8f5e9" : "#f8f9fa";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  fontSize: "12px",
                  color: "#666"
                }}>
                  ✋
                </div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  #{player.number} {player.name}
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
                  {player.primaryRole}
                </div>
                <div style={{ fontSize: "10px", color: "#999" }}>
                  Arrastra a una posición
                </div>
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
    </>
  );
}
