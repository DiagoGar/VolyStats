import { ZoneButton } from "./Zone";
import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import { averageAngle, angularDeviation } from "@/utils/spikeMath";
import { SpikeDraw } from "../SpikeDraw/SpikeDraw";
import type { SpikeTrajectoriesByZone } from "@/hooks/useGameTrajectories";
import { useState } from "react";
import type { Complex, PlayerRole } from "@/types/spike";

interface HalfCourtProps {
  team: "own" | "opponent";
  stats: MatchStats;
  spikeTrajectories: SpikeTrajectoriesByZone;
  onAttack: (zone: Zone) => void;
  onToggleMode: () => void;
  onSpikeDraw: (zone: Zone, start: { x: number; y: number }, end: { x: number; y: number }, complex: Complex, playerRole?: PlayerRole) => void;
}

export function HalfCourt({
  team,
  stats,
  spikeTrajectories,
  onAttack,
  onToggleMode,
  onSpikeDraw,
}: HalfCourtProps) {
  const [drawState, setDrawState] = useState<{ zone: Zone; complex: Complex | null; playerRole: PlayerRole | null } | null>(null);

  const getValue = (zone: Zone) => {
    if (stats.mode === "cantidad") {
      return stats.zones[zone];
    }

    const percentage = calculatePercentage(stats.zones[zone], stats.total);
    return `${percentage}%`;
  };

  const handleLongPress = (zone: Zone) => {
    setDrawState({ zone, complex: null, playerRole: null });
  };

  const handleAttack = (zone: Zone) => {
    onAttack(zone);
  };

  const handleComplexSelect = (complex: Complex) => {
    if (drawState) {
      setDrawState({ ...drawState, complex, playerRole: null });
    }
  };

  const handlePlayerRoleSelect = (playerRole: PlayerRole) => {
    if (drawState) {
      setDrawState({ ...drawState, playerRole });
    }
  };

  const handleCloseDraw = () => {
    setDrawState(null);
  };

  const isOpponent = team === "opponent";

  return (
    <div className={`half-court ${team}`}>
      {/* Encabezado */}
      <div className="half-court-header">
        <span className="team-name">{isOpponent ? "Equipo Contrario" : "Equipo Propio"}</span>
        <button
          className="mode-toggle"
          onClick={onToggleMode}
          aria-label="Cambiar modo"
          title={stats.mode === "cantidad" ? "Modo: cantidad" : "Modo: porcentaje"}
        >
          {stats.mode === "cantidad" ? "%" : "#"}
        </button>
      </div>

      {/* Cancha */}
      <div className="court">
        {/* Fila delantera */}
        <ZoneButton
          zone={4}
          value={getValue(4)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={3}
          value={getValue(3)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={2}
          value={getValue(2)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />

        {/* Fila zaguera */}
        <div className="zone disabled">
          <div className="zone-label">Zona 5</div>
        </div>

        <ZoneButton
          zone={6}
          value={getValue(6)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
        <ZoneButton
          zone={1}
          value={getValue(1)}
          onClick={handleAttack}
          onLongPress={handleLongPress}
        />
      </div>

      {/* Modal de dibujo */}
      {drawState !== null && drawState.complex === null && (
        <div className="complex-selector-overlay">
          <div className="complex-selector">
            <h3>Selecciona el Complejo de Juego</h3>
            <div className="complex-buttons">
              <button onClick={() => handleComplexSelect('K1')}>K1 - Side-out</button>
              <button onClick={() => handleComplexSelect('K2')}>K2 - Break-point</button>
              <button onClick={() => handleComplexSelect('K3')}>K3 - Contraataque</button>
              <button onClick={() => handleComplexSelect('K4')}>K4 - Freeball</button>
            </div>
            <button className="cancel-btn" onClick={handleCloseDraw}>Cancelar</button>
          </div>
        </div>
      )}
      {drawState !== null && drawState.complex !== null && drawState.playerRole === null && (
        <div className="role-selector-overlay">
          <div className="role-selector">
            <h3>Selecciona el Rol del Jugador</h3>
            <div className="role-buttons">
              <button onClick={() => handlePlayerRoleSelect('opuesto')}>Opuesto</button>
              <button onClick={() => handlePlayerRoleSelect('punta')}>Punta</button>
              <button onClick={() => handlePlayerRoleSelect('central')}>Central</button>
              <button onClick={() => handlePlayerRoleSelect('armador')}>Armador</button>
              <button onClick={() => handlePlayerRoleSelect('libero')}>Líbero</button>
              <button onClick={() => handlePlayerRoleSelect('zaguero')}>Zaguero</button>
            </div>
            <button className="skip-btn" onClick={() => handlePlayerRoleSelect(undefined as any)}>Omitir</button>
            <button className="cancel-btn" onClick={handleCloseDraw}>Cancelar</button>
          </div>
        </div>
      )}
      {drawState !== null && drawState.complex !== null && drawState.playerRole !== null && (
        <SpikeDraw
          zone={drawState.zone}
          complex={drawState.complex}
          playerRole={drawState.playerRole}
          onClose={handleCloseDraw}
          onSpikeDraw={(zone, start, end) => onSpikeDraw(zone, start, end, drawState.complex!, drawState.playerRole)}
          averageAngle={averageAngle(spikeTrajectories[drawState.zone])}
          trajectories={spikeTrajectories[drawState.zone]}
          angularDeviation={angularDeviation(spikeTrajectories[drawState.zone])}
        />
      )}
    </div>
  );
}
