// components/RotationFlow/RotationConfigFlow.tsx
/**
 * PHASE 2 - Flujo de Configuración de Rotación
 * 
 * Orquesta dos pasos:
 * Paso 1: Seleccionar Armador (Local y Visitante)
 * Paso 2: Seleccionar Tipo de Rotación
 */

"use client";

import { useState } from "react";
import { SetterSelector } from "./SetterSelector";
import { RotationTypeSelector } from "./RotationTypeSelector";
import type { Match, Player } from "@/types/volley-model";
import type { RotationType } from "@/types/rotation";

interface RotationConfigFlowProps {
  match: Match;
  onConfigComplete: (config: {
    homeTeamSetter: Player;
    awayTeamSetter: Player;
    rotationType: RotationType;
  }) => void;
  onBack: () => void;
}

type ConfigStep = "homeTeamSetter" | "awayTeamSetter" | "rotationType" | "confirm";

export function RotationConfigFlow({
  match,
  onConfigComplete,
  onBack,
}: RotationConfigFlowProps) {
  const [step, setStep] = useState<ConfigStep>("homeTeamSetter");
  const [homeTeamSetter, setHomeTeamSetter] = useState<Player | null>(null);
  const [awayTeamSetter, setAwayTeamSetter] = useState<Player | null>(null);
  const [rotationType, setRotationType] = useState<RotationType | null>(null);

  const canProceed = () => {
    switch (step) {
      case "homeTeamSetter":
        return homeTeamSetter !== null;
      case "awayTeamSetter":
        return awayTeamSetter !== null;
      case "rotationType":
        return rotationType !== null;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const handleProceed = () => {
    if (step === "homeTeamSetter") {
      setStep("awayTeamSetter");
    } else if (step === "awayTeamSetter") {
      setStep("rotationType");
    } else if (step === "rotationType") {
      setStep("confirm");
    } else if (step === "confirm") {
      if (homeTeamSetter && awayTeamSetter && rotationType) {
        onConfigComplete({
          homeTeamSetter,
          awayTeamSetter,
          rotationType,
        });
      }
    }
  };

  const handleBack = () => {
    if (step === "homeTeamSetter") {
      onBack();
    } else if (step === "awayTeamSetter") {
      setStep("homeTeamSetter");
    } else if (step === "rotationType") {
      setStep("awayTeamSetter");
    } else if (step === "confirm") {
      setStep("rotationType");
    }
  };

  return (
    <div className="rotation-config-flow">
      <div className="config-header">
        <h2>⚙️ Configuración de Rotación</h2>
        <p className="step-indicator">
          {step === "homeTeamSetter" && "Paso 1 de 3: Armador del Equipo Local"}
          {step === "awayTeamSetter" && "Paso 2 de 3: Armador del Equipo Visitante"}
          {step === "rotationType" && "Paso 3 de 3: Tipo de Rotación"}
          {step === "confirm" && "Resumen de Configuración"}
        </p>
      </div>

      <div className="config-content">
        {step === "homeTeamSetter" && (
          <SetterSelector
            match={match}
            selectedSetter={homeTeamSetter}
            onSelectSetter={setHomeTeamSetter}
            homeTeam={true}
          />
        )}

        {step === "awayTeamSetter" && (
          <SetterSelector
            match={match}
            selectedSetter={awayTeamSetter}
            onSelectSetter={setAwayTeamSetter}
            homeTeam={false}
          />
        )}

        {step === "rotationType" && (
          <RotationTypeSelector
            selectedType={rotationType}
            onSelectType={setRotationType}
          />
        )}

        {step === "confirm" && (
          <div className="config-summary">
            <h3>✓ Configuración Completada</h3>
            
            <div className="summary-item">
              <div className="summary-label">Equipo Local:</div>
              <div className="summary-value">
                {match.homeTeam.name}
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Armador Local:</div>
              <div className="summary-value">
                #{homeTeamSetter?.number} {homeTeamSetter?.name} ({homeTeamSetter?.primaryRole})
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <div className="summary-label">Equipo Visitante:</div>
              <div className="summary-value">
                {match.awayTeam.name}
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-label">Armador Visitante:</div>
              <div className="summary-value">
                #{awayTeamSetter?.number} {awayTeamSetter?.name} ({awayTeamSetter?.primaryRole})
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <div className="summary-label">Sistema de Rotación:</div>
              <div className="summary-value">{rotationType}</div>
            </div>

            <p className="config-ready">
              ¡Listo para continuar con la asignación de posiciones!
            </p>
          </div>
        )}
      </div>

      <div className="config-buttons">
        <button
          className="config-button back-button"
          onClick={handleBack}
        >
          ← Atrás
        </button>

        <button
          className="config-button proceed-button"
          onClick={handleProceed}
          disabled={!canProceed()}
        >
          {step === "confirm" ? "✓ Confirmar" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}
