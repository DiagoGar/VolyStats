// components/RotationFlow/MatchSetupFlow.tsx
/**
 * PHASE 1b - Flujo de Configuración de Partido
 * 
 * Orquesta el proceso de crear/seleccionar un partido:
 * Paso 1: Seleccionar o crear Equipo Local
 * Paso 2: Seleccionar o crear Equipo Visitante
 * Paso 3: Confirmar partido
 */

"use client";

import React, { useState, useEffect } from "react";
import { TeamSelector } from "./TeamSelector";
import { TeamEditor } from "./TeamEditor";
import type { Team, Match } from "@/types/volley-model";

interface MatchSetupFlowProps {
  onMatchReady: (match: Match) => void;
  onCancel: () => void;
}

type MatchSetupStep = "selectHome" | "selectAway" | "confirm" | "editingTeam";

export function MatchSetupFlow({
  onMatchReady,
  onCancel,
}: MatchSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState<MatchSetupStep>("selectHome");
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [editingSide, setEditingSide] = useState<"home" | "away" | null>(null);
  const [editingTeamData, setEditingTeamData] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [servingTeam, setServingTeam] = useState<"home" | "away">("home");

  // Cargar equipos disponibles desde storage
  const loadTeams = () => {
    try {
      const stored = localStorage.getItem("voley-stats:teams");
      if (stored) {
        const teams = JSON.parse(stored);
        setAllTeams(teams);
      }
    } catch (err) {
      console.error("Error loading teams:", err);
    }
  };

  const handleSelectTeam = (teamId: string, side: "home" | "away") => {
    const team = allTeams.find((t) => t.id === teamId);
    if (!team) return;

    if (side === "home") {
      setHomeTeam(team);
      if (awayTeam) {
        setCurrentStep("confirm");
      } else {
        setCurrentStep("selectAway");
      }
    } else {
      setAwayTeam(team);
      if (homeTeam) {
        setCurrentStep("confirm");
      } else {
        setCurrentStep("selectHome");
      }
    }
  };

  const handleCreateNewTeam = (side: "home" | "away") => {
    setEditingSide(side);
    setEditingTeamData({
      id: crypto.randomUUID(),
      name: "",
      players: [],
      createdAt: Date.now(),
    });
    setCurrentStep("editingTeam");
  };

  const handleSaveTeam = (team: Team) => {
    // Guardar equipo en storage
    const teams = allTeams.concat(team);
    localStorage.setItem("voley-stats:teams", JSON.stringify(teams));
    setAllTeams(teams);

    // Asignar a partido según lado
    if (editingSide === "home") {
      setHomeTeam(team);
      if (awayTeam) {
        setCurrentStep("confirm");
      } else {
        setCurrentStep("selectAway");
      }
    } else if (editingSide === "away") {
      setAwayTeam(team);
      if (homeTeam) {
        setCurrentStep("confirm");
      } else {
        setCurrentStep("selectHome");
      }
    }
    setEditingSide(null);
    setEditingTeamData(null);
  };

  const handleConfirmMatch = () => {
    if (!homeTeam || !awayTeam) {
      alert("Debes seleccionar ambos equipos");
      return;
    }

    if (homeTeam.players.length < 6) {
      alert("El equipo local necesita al menos 6 jugadores");
      return;
    }

    if (awayTeam.players.length < 6) {
      alert("El equipo visitante necesita al menos 6 jugadores");
      return;
    }

    // Crear partido
    const match: Match = {
      id: crypto.randomUUID(),
      homeTeam,
      awayTeam,
      actions: [],
      homeRotations: [],
      awayRotations: [],
      currentHomeRotation: null as any, // Se asignará en siguiente fase
      currentAwayRotation: null as any,
      homeScore: 0,
      awayScore: 0,
      currentSet: 1,
      servingTeam,
      rallyStatus: "waiting_serve",
      lastActionType: null,
      lastActionTeam: null,
      status: "setup",
      createdAt: Date.now(),
    };

    onMatchReady(match);
  };

  const handleBack = () => {
    if (currentStep === "editingTeam") {
      setCurrentStep(editingSide === "home" ? "selectHome" : "selectAway");
      setEditingSide(null);
      setEditingTeamData(null);
    } else if (currentStep === "selectAway") {
      setCurrentStep("selectHome");
      setAwayTeam(null);
    } else if (currentStep === "confirm") {
      setCurrentStep("selectAway");
    } else {
      onCancel();
    }
  };

  // Cargar equipos al montar componente
  useEffect(() => {
    loadTeams();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🏐 Configurar Partido</h2>

      {currentStep === "editingTeam" && editingTeamData && (
        <div>
          <TeamEditor
            team={editingTeamData}
            onSaveTeam={handleSaveTeam}
            onCancel={handleBack}
            isCreatingNew={true}
          />
        </div>
      )}

      {currentStep === "selectHome" && (
        <div>
          <h3>Paso 1/3: Equipo Local</h3>
          {homeTeam && (
            <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", color: "#000", borderRadius: "4px" }}>
              <p><strong>Seleccionado:</strong> {homeTeam.name} ({homeTeam.players.length} jugadores)</p>
              <button
                onClick={() => setHomeTeam(null)}
                style={{
                  padding: "8px 12px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cambiar
              </button>
            </div>
          )}
          {!homeTeam && (
            <div>
              <div style={{ marginBottom: "15px" }}>
                <h4>Equipos disponibles:</h4>
                {allTeams.length === 0 ? (
                  <p style={{ color: "#999" }}>No hay equipos creados aún</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                    {allTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleSelectTeam(team.id, "home")}
                        style={{
                          padding: "12px",
                          background: "#f9f9f9",
                          color: "#333",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <strong>{team.name}</strong> ({team.players.length} jugadores)
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCreateNewTeam("home")}
                style={{
                  padding: "10px 16px",
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Crear nuevo equipo
              </button>
            </div>
          )}
          {homeTeam && (
            <button
              onClick={() => setCurrentStep("selectAway")}
              style={{
                marginTop: "20px",
                padding: "10px 16px",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      )}

      {currentStep === "selectAway" && (
        <div>
          <h3>Paso 2/3: Equipo Visitante</h3>
          <p style={{ background: "#e8f5e9", color: "#333", padding: "10px", borderRadius: "4px", marginBottom: "15px" }}>
            Local: <strong>{homeTeam?.name}</strong>
          </p>
          {awayTeam && (
            <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", color: "#333", borderRadius: "4px" }}>
              <p><strong>Seleccionado:</strong> {awayTeam.name} ({awayTeam.players.length} jugadores)</p>
              <button
                onClick={() => setAwayTeam(null)}
                style={{
                  padding: "8px 12px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cambiar
              </button>
            </div>
          )}
          {!awayTeam && (
            <div>
              <div style={{ marginBottom: "15px" }}>
                <h4>Equipos disponibles:</h4>
                {allTeams.length === 0 ? (
                  <p style={{ color: "#999" }}>No hay equipos creados aún</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                    {allTeams
                      .filter((t) => t.id !== homeTeam?.id)
                      .map((team) => (
                        <button
                          key={team.id}
                          onClick={() => handleSelectTeam(team.id, "away")}
                          style={{
                            padding: "12px",
                            background: "#f9f9f9",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <strong>{team.name}</strong> ({team.players.length} jugadores)
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCreateNewTeam("away")}
                style={{
                  padding: "10px 16px",
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Crear nuevo equipo
              </button>
            </div>
          )}
          {awayTeam && (
            <button
              onClick={() => setCurrentStep("confirm")}
              style={{
                marginTop: "20px",
                padding: "10px 16px",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      )}

      {currentStep === "confirm" && homeTeam && awayTeam && (
        <div>
          <h3>Paso 3/3: Confirmar Partido</h3>
          <div style={{ 
            background: "#f9f9f9", 
            padding: "20px", 
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <h4 style={{color: "#333"}}>{homeTeam.name}</h4>
                <p style={{ color: "#999", fontSize: "12px" }}>{homeTeam.players.length} jugadores</p>
              </div>
              <div style={{ fontSize: "20px", padding: "0 20px", color: "#5f5f5f" }}>vs</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <h4 style={ {color: "#333"} }>{awayTeam.name}</h4>
                <p style={{ color: "#999", fontSize: "12px" }}>{awayTeam.players.length} jugadores</p>
              </div>
            </div>
          </div>

          <div style={{
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
          }}>
            <p style={{ margin: 0, marginBottom: "8px", color: "#8c6d1f" }}>
              ¿Quién empieza sacando?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setServingTeam("home")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: servingTeam === "home" ? "2px solid #fa8c16" : "1px solid #ddd",
                  background: servingTeam === "home" ? "#fff7e6" : "#fff",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {homeTeam.name}
              </button>
              <button
                onClick={() => setServingTeam("away")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: servingTeam === "away" ? "2px solid #fa8c16" : "1px solid #ddd",
                  background: servingTeam === "away" ? "#fff7e6" : "#fff",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {awayTeam.name}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={handleBack}
              style={{
                padding: "10px 16px",
                background: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ← Atrás
            </button>
            <button
              onClick={handleConfirmMatch}
              style={{
                padding: "10px 16px",
                background: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ✓ Confirmar Partido
            </button>
          </div>
        </div>
      )}

      {(currentStep === "selectHome" || currentStep === "selectAway") && (
        <button
          onClick={handleBack}
          style={{
            marginTop: "20px",
            padding: "8px 12px",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ← Atrás
        </button>
      )}
    </div>
  );
}
