"use client";

import { useState } from "react";
import { Court } from "@/components/Court/Court";
import { Stats } from "@/components/Stats/Stats";
import { DataExportImport } from "@/components/DataExportImport/DataExportImport";
import { ModeSelector } from "@/components/RotationFlow/ModeSelector";
import { MatchSetupFlow } from "@/components/RotationFlow/MatchSetupFlow";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories, type GameTrajectories } from "@/hooks/useGameTrajectories";
import { clearStorage, storageKeys } from "@/hooks/usePersistentStorage";
import "@/components/DataExportImport/dataExportImport.css";
import "@/components/RotationFlow/modeSelector.css";
import "@/components/RotationFlow/matchSetup.css";
import type { Match } from "@/types/volley-model";

export default function Page() {
  const [mode, setMode] = useState<"attack" | "rotation" | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const { trajectories, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();
  const { stats, addAttack, toggleMode, resetGame: resetStats } = useGameStats(trajectories.own, trajectories.opponent);

  const handleResetAll = () => {
    resetStats();
    resetTrajectories();
    clearStorage(storageKeys.trajectories);
    clearStorage(storageKeys.stats);
  };

  const handleImportTrajectories = (data: GameTrajectories) => {
    // Lógica para importar trayectorias
  };

  const handleImportStats = (data: any) => {
    // Lógica para importar stats
  };

  const handleMatchConfirmed = (match: Match) => {
    setCurrentMatch(match);
  };

  const handleBackToSetup = () => {
    setCurrentMatch(null);
  };

  // Si no hay modo seleccionado, mostrar selector
  if (!mode) {
    return <ModeSelector onSelectMode={setMode} />;
  }

  // Modo de Ataques (lo existente, congelado)
  if (mode === "attack") {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
          <button
            onClick={() => setMode(null)}
            style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ← Volver a menú
          </button>
        </div>

        <Court
          stats={stats}
          trajectories={trajectories}
          onAttack={addAttack}
          onToggleMode={toggleMode}
          onReset={() => {
            resetStats();
            resetTrajectories();
          }}
          onSpikeDraw={addTrajectory}
        />

        <Stats trajectories={trajectories.own} />

        <DataExportImport
          trajectories={trajectories}
          stats={stats}
          onImportTrajectories={handleImportTrajectories}
          onImportStats={handleImportStats}
          onReset={handleResetAll}
        />
      </>
    );
  }

  // Modo de Rotaciones (PHASE 1b: Match Setup Flow)
  if (mode === "rotation") {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
          <button
            onClick={() => setMode(null)}
            style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ← Volver a menú
          </button>
        </div>
        
        <div style={{ padding: "20px" }}>
          <h2>🔄 Sistema de Rotaciones</h2>
          
          {!currentMatch ? (
            <MatchSetupFlow 
              onMatchReady={handleMatchConfirmed}
              onCancel={() => setMode(null)}
            />
          ) : (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <button
                onClick={handleBackToSetup}
                style={{
                  padding: "8px 16px",
                  marginBottom: "16px",
                  backgroundColor: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Volver a Seleccionar Equipos
              </button>
              <h3>Partido: {currentMatch.homeTeam.name} vs {currentMatch.awayTeam.name}</h3>
              <p style={{ color: "#666" }}>
                Próximamente: Configuración de rotación en FASES 2-6...
              </p>
            </div>
          )}
        </div>
      </>
    );
  }
}
