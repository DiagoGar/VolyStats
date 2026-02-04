import { ZoneButton } from "./Zone";
import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import { averageAngle, angularDeviation } from "@/utils/spikeMath";
import { SpikeDraw } from "../SpikeDraw/SpikeDraw";
import type { SpikeTrajectoriesByZone } from "@/hooks/useGameTrajectories";
import { useState, useRef, useEffect } from "react";
import type { Complex, PlayerRole, Evaluation } from "@/types/spike";
import { drawPersistentTrajectories } from "@/utils/canvasUtils";

interface HalfCourtProps {
  team: "own" | "opponent";
  stats: MatchStats;
  spikeTrajectories: SpikeTrajectoriesByZone;
  onAttack: (zone: Zone) => void;
  onToggleMode: () => void;
  onSpikeDraw: (zone: Zone, start: { x: number; y: number }, end: { x: number; y: number }, complex: Complex, playerRole?: PlayerRole, evaluation?: Evaluation) => void;
}

export function HalfCourt({
  team,
  stats,
  spikeTrajectories,
  onAttack,
  onToggleMode,
  onSpikeDraw,
}: HalfCourtProps) {
  const [drawState, setDrawState] = useState<{ zone: Zone; complex: Complex | null; playerRole: PlayerRole | null; trajectory: { start: { x: number; y: number }; end: { x: number; y: number } } | null } | null>(null);
  const [filterComplex, setFilterComplex] = useState<Complex | null>(null);
  const [filterEvaluation, setFilterEvaluation] = useState<Evaluation | null>(null);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showTrajectories) {
      drawPersistentTrajectories(ctx, canvas, spikeTrajectories, filterComplex, filterEvaluation);
    }
  }, [spikeTrajectories, filterComplex, filterEvaluation, showTrajectories]);

  const getValue = (zone: Zone) => {
    if (stats.mode === "cantidad") {
      return stats.zones[zone];
    }

    const percentage = calculatePercentage(stats.zones[zone], stats.total);
    return `${percentage}%`;
  };

  const handleLongPress = (zone: Zone) => {
    setDrawState({ zone, complex: null, playerRole: null, trajectory: null });
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

  const handleTrajectoryDrawn = (zone: Zone, start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (drawState) {
      setDrawState({ ...drawState, trajectory: { start, end } });
    }
  };

  const handleEvaluationSelect = (evaluation: Evaluation | undefined) => {
    if (drawState && drawState.trajectory) {
      onSpikeDraw(drawState.zone, drawState.trajectory.start, drawState.trajectory.end, drawState.complex!, drawState.playerRole || undefined, evaluation);
      setDrawState(null);
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

      {/* Canvas para trayectorias */}
      <canvas
        ref={canvasRef}
        className="trajectory-canvas"
        width={400}
        height={300}
      />

      {/* Controles de filtros */}
      <div className="trajectory-controls">
        <button 
          className={`control-btn ${showTrajectories ? 'active' : ''}`}
          onClick={() => setShowTrajectories(!showTrajectories)}
        >
          {showTrajectories ? 'Ocultar' : 'Mostrar'} Trayectorias
        </button>
        
        <div className="filter-group">
          <label>Complejo:</label>
          <select 
            value={filterComplex || ''} 
            onChange={(e) => setFilterComplex(e.target.value as Complex || null)}
          >
            <option value="">Todos</option>
            <option value="K1">K1</option>
            <option value="K2">K2</option>
            <option value="K3">K3</option>
            <option value="K4">K4</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Evaluación:</label>
          <select 
            value={filterEvaluation || ''} 
            onChange={(e) => setFilterEvaluation(e.target.value as Evaluation || null)}
          >
            <option value="">Todas</option>
            <option value="ace">Ace</option>
            <option value="kill">Kill</option>
            <option value="error">Error</option>
          </select>
        </div>
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
      {drawState !== null && drawState.complex !== null && drawState.playerRole !== null && !drawState.trajectory && (
        <SpikeDraw
          zone={drawState.zone}
          complex={drawState.complex}
          playerRole={drawState.playerRole}
          onClose={handleCloseDraw}
          onSpikeDraw={handleTrajectoryDrawn}
          averageAngle={averageAngle(spikeTrajectories[drawState.zone])}
          trajectories={spikeTrajectories[drawState.zone]}
          angularDeviation={angularDeviation(spikeTrajectories[drawState.zone])}
        />
      )}
      {drawState !== null && drawState.trajectory && (
        <div className="evaluation-selector-overlay">
          <div className="evaluation-selector">
            <h3>Evalúa la Acción (Opcional)</h3>
            <div className="evaluation-buttons">
              <button onClick={() => handleEvaluationSelect('#')}># Punto directo</button>
              <button onClick={() => handleEvaluationSelect('++')}>++ Muy positivo</button>
              <button onClick={() => handleEvaluationSelect('+')}>+ Positivo</button>
              <button onClick={() => handleEvaluationSelect('/')}>/ Neutro</button>
              <button onClick={() => handleEvaluationSelect('-')}>- Negativo</button>
              <button onClick={() => handleEvaluationSelect('--')}>-- Error directo</button>
            </div>
            <button className="skip-btn" onClick={() => handleEvaluationSelect(undefined)}>Omitir</button>
            <button className="cancel-btn" onClick={handleCloseDraw}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
