import { ZoneButton } from "./Zone";
import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import { averageAngle, angularDeviation } from "@/utils/spikeMath";
import { SpikeDraw } from "../SpikeDraw/SpikeDraw";
import type { GameTrajectoryHistory, SpikeTrajectoriesByZone } from "@/hooks/useGameTrajectories";
import { useState, useRef, useEffect } from "react";
import type { Complex, PlayerRole, Evaluation } from "@/types/spike";
import { drawPersistentTrajectories } from "@/utils/canvasUtils";
import type { CourtPosition, Player } from "@/types/volley-model";

interface FullCourtProps {
  stats: {
    own: MatchStats;
    opponent: MatchStats;
  };
  trajectories: {
    own: SpikeTrajectoriesByZone;
    opponent: SpikeTrajectoriesByZone;
  };
  trajectoryHistory: GameTrajectoryHistory;
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null;
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onSpikeDraw: (team: "own" | "opponent", zone: Zone, start: { x: number; y: number }, end: { x: number; y: number }, complex: Complex, playerRole?: PlayerRole, evaluation?: Evaluation) => void;
}

export function FullCourt({
  stats,
  trajectories,
  trajectoryHistory,
  roleAssignments,
  onAttack,
  onToggleMode,
  onSpikeDraw,
}: FullCourtProps) {
  const [drawState, setDrawState] = useState<{ team: "own" | "opponent"; zone: Zone; complex: Complex | null; playerRole: PlayerRole | null; trajectory: { start: { x: number; y: number }; end: { x: number; y: number } } | null } | null>(null);
  const [filterComplex, setFilterComplex] = useState<Complex | null>(null);
  const [filterEvaluation, setFilterEvaluation] = useState<Evaluation | null>(null);
  const [filterTeam, setFilterTeam] = useState<"own" | "opponent" | null>(null);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedHistoryRallyId, setSelectedHistoryRallyId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyPoints = trajectoryHistory?.rallies?.filter((rally) => rally.directPoint) ?? [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showTrajectories) {
      // Dibujar solo trayectorias del rally en curso (historial solo en panel de texto)
      if (!filterTeam || filterTeam === "own") {
        drawPersistentTrajectories(ctx, canvas, trajectories.own, filterComplex, filterEvaluation);
      }
      if (!filterTeam || filterTeam === "opponent") {
        drawPersistentTrajectories(ctx, canvas, trajectories.opponent, filterComplex, filterEvaluation);
      }
    }

    // Dibujar trayectoria seleccionada del historial con resaltado especial
    if (selectedHistoryRallyId) {
      const selectedRally = trajectoryHistory?.rallies?.find((rally) => rally.id === selectedHistoryRallyId);

      if (selectedRally) {
        const rallyItems = selectedRally.trajectories;
        const ownMap: SpikeTrajectoriesByZone = { 1: [], 2: [], 3: [], 4: [], 6: [] };
        const opponentMap: SpikeTrajectoriesByZone = { 1: [], 2: [], 3: [], 4: [], 6: [] };

        rallyItems.forEach((item) => {
          if (item.team === "own") {
            ownMap[item.spike.zone].push(item.spike);
          } else {
            opponentMap[item.spike.zone].push(item.spike);
          }
        });

        drawPersistentTrajectories(ctx, canvas, ownMap, null, null, undefined, false, 1.0, 3);
        drawPersistentTrajectories(ctx, canvas, opponentMap, null, null, undefined, false, 1.0, 3);

        if (selectedRally.directPoint) {
          const directPointMap = {
            [selectedRally.directPoint.spike.zone]: [selectedRally.directPoint.spike],
          };
          drawPersistentTrajectories(ctx, canvas, directPointMap, null, null, "#FFD700", false, 1.0, 4);
        }
      }
    }
  }, [trajectories, trajectoryHistory, filterComplex, filterEvaluation, filterTeam, showTrajectories, selectedHistoryRallyId]);

  const getValue = (team: "own" | "opponent", zone: Zone) => {
    const teamStats = stats[team];
    if (teamStats.mode === "cantidad") {
      return teamStats.zones[zone];
    }

    const percentage = calculatePercentage(teamStats.zones[zone], teamStats.total);
    return `${percentage}%`;
  };

  const getPlayerAtZone = (team: "own" | "opponent", zone: Zone): Player | null => {
    if (!roleAssignments) return null;
    const assignments = team === "own" ? roleAssignments.homeTeamAssignments : roleAssignments.awayTeamAssignments;
    return assignments[zone as CourtPosition] || null;
  };

  const handleLongPress = (team: "own" | "opponent", zone: Zone) => {
    setDrawState({ team, zone, complex: null, playerRole: null, trajectory: null });
  };

  const handleAttack = (team: "own" | "opponent", zone: Zone) => {
    onAttack(team, zone);
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

  const handleTrajectoryDrawn = (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    if (drawState) {
      setDrawState({ ...drawState, trajectory: { start, end } });
    }
  };

  const handleHistoryClick = (rallyId: string) => {
    setSelectedHistoryRallyId(rallyId);
  };

  const clearSelectedTrajectory = () => {
    setSelectedHistoryRallyId(null);
  };

  const handleEvaluationSelect = (evaluation: Evaluation | undefined) => {
    if (drawState && drawState.trajectory) {
      onSpikeDraw(drawState.team, drawState.zone, drawState.trajectory.start, drawState.trajectory.end, drawState.complex!, drawState.playerRole || undefined, evaluation);
      setDrawState(null);
    }
  };

  const handleCloseDraw = () => {
    setDrawState(null);
  };

  return (
    <div className="full-court">
      {/* Encabezado */}
      <div className="court-header">
        <span className="court-title">Cancha de Voleibol</span>
        <div className="mode-toggles">
          <button
            className="mode-toggle"
            onClick={() => onToggleMode("own")}
            title={stats.own.mode === "cantidad" ? "Modo: cantidad (propio)" : "Modo: porcentaje (propio)"}
          >
            {stats.own.mode === "cantidad" ? "%" : "#"} Propio
          </button>
          <button
            className="mode-toggle"
            onClick={() => onToggleMode("opponent")}
            title={stats.opponent.mode === "cantidad" ? "Modo: cantidad (contrario)" : "Modo: porcentaje (contrario)"}
          >
            {stats.opponent.mode === "cantidad" ? "%" : "#"} Contrario
          </button>
        </div>
      </div>

      {/* Cancha completa */}
      <div className="court">
        {/* Equipo contrario (arriba) */}
        <div className="team-section opponent-section">
          <div className="team-label">Equipo Contrario</div>
          <div className="zones-grid">
            <ZoneButton
              zone={1}
              value={getValue("opponent", 1)}
              onClick={() => handleAttack("opponent", 1)}
              onLongPress={() => handleLongPress("opponent", 1)}
              player={getPlayerAtZone("opponent", 1)}
            />
            <ZoneButton
              zone={6}
              value={getValue("opponent", 6)}
              onClick={() => handleAttack("opponent", 6)}
              onLongPress={() => handleLongPress("opponent", 6)}
              player={getPlayerAtZone("opponent", 6)}
            />
            <div className="zone disabled">
              <div className="zone-label">Zona 5</div>
            </div>
          </div>
          <div className="zones-grid back-row">
            <ZoneButton
              zone={2}
              value={getValue("opponent", 2)}
              onClick={() => handleAttack("opponent", 2)}
              onLongPress={() => handleLongPress("opponent", 2)}
              player={getPlayerAtZone("opponent", 2)}
            />
            <ZoneButton
              zone={3}
              value={getValue("opponent", 3)}
              onClick={() => handleAttack("opponent", 3)}
              onLongPress={() => handleLongPress("opponent", 3)}
              player={getPlayerAtZone("opponent", 3)}
            />
            <ZoneButton
              zone={4}
              value={getValue("opponent", 4)}
              onClick={() => handleAttack("opponent", 4)}
              onLongPress={() => handleLongPress("opponent", 4)}
              player={getPlayerAtZone("opponent", 4)}
            />
          </div>
        </div>

        {/* Línea central */}
        <div className="center-line"></div>

        {/* Equipo propio (abajo) */}
        <div className="team-section own-section">
          <div className="team-label">Equipo Propio</div>
          <div className="zones-grid">
            <ZoneButton
              zone={4}
              value={getValue("own", 4)}
              onClick={() => handleAttack("own", 4)}
              onLongPress={() => handleLongPress("own", 4)}
              player={getPlayerAtZone("own", 4)}
            />
            <ZoneButton
              zone={3}
              value={getValue("own", 3)}
              onClick={() => handleAttack("own", 3)}
              onLongPress={() => handleLongPress("own", 3)}
              player={getPlayerAtZone("own", 3)}
            />
            <ZoneButton
              zone={2}
              value={getValue("own", 2)}
              onClick={() => handleAttack("own", 2)}
              onLongPress={() => handleLongPress("own", 2)}
              player={getPlayerAtZone("own", 2)}
            />
          </div>
          <div className="zones-grid back-row">
            <div className="zone disabled">
              <div className="zone-label">Zona 5</div>
            </div>
            <ZoneButton
              zone={6}
              value={getValue("own", 6)}
              onClick={() => handleAttack("own", 6)}
              onLongPress={() => handleLongPress("own", 6)}
              player={getPlayerAtZone("own", 6)}
            />
            <ZoneButton
              zone={1}
              value={getValue("own", 1)}
              onClick={() => handleAttack("own", 1)}
              onLongPress={() => handleLongPress("own", 1)}
              player={getPlayerAtZone("own", 1)}
            />
          </div>
        </div>

        {/* Canvas para trayectorias */}
        <canvas
          ref={canvasRef}
          className="trajectory-canvas"
          width={600}
          height={400}
        />
      </div>

      {/* Leyenda de colores */}
      {showLegend && (
        <div className="trajectory-legend">
          <h4>Leyenda de Colores</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#00AA00" }}></span>
              <span># Punto directo</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#0066FF" }}></span>
              <span>++ Muy positivo / K1</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#66CCFF" }}></span>
              <span>+ Positivo</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#FFAA00" }}></span>
              <span>/ Neutro / K4</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#FF6600" }}></span>
              <span>- Negativo / K2</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#CC0000" }}></span>
              <span>-- Error directo</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#00AA00" }}></span>
              <span>K3 Contraataque</span>
            </div>
          </div>
          <p className="legend-note">Las flechas muestran dirección y evaluación del ataque. El historial de puntos directos se muestra abajo.</p>
        </div>
      )}
      <div className="trajectory-controls">
        <button
          className={`control-btn ${showTrajectories ? 'active' : ''}`}
          onClick={() => setShowTrajectories(!showTrajectories)}
        >
          {showTrajectories ? 'Ocultar' : 'Mostrar'} Trayectorias
        </button>

        <button
          className={`control-btn ${showLegend ? 'active' : ''}`}
          onClick={() => setShowLegend(!showLegend)}
        >
          {showLegend ? 'Ocultar' : 'Mostrar'} Leyenda
        </button>

        <div className="filter-group">
          <label>Equipo:</label>
          <select
            value={filterTeam || ''}
            onChange={(e) => setFilterTeam(e.target.value as "own" | "opponent" || null)}
          >
            <option value="">Ambos</option>
            <option value="own">Propio</option>
            <option value="opponent">Contrario</option>
          </select>
        </div>

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
            <option value="#"># Punto directo</option>
            <option value="++">++ Muy positivo</option>
            <option value="+">+ Positivo</option>
            <option value="/">/ Neutro</option>
            <option value="-">- Negativo</option>
            <option value="--">-- Error directo</option>
          </select>
        </div>
      </div>

      <div className="point-history">
        <h4>Historial de Puntos Directos</h4>
        {selectedHistoryRallyId && (
          <div className="selected-indicator">
            <span>📍 Mostrando trayectoria seleccionada</span>
            <button onClick={clearSelectedTrajectory} className="clear-selection-btn">✕</button>
          </div>
        )}
        {historyPoints.length === 0 ? (
          <p className="muted">No hay puntos directos anotados aún.</p>
        ) : (
          <ul>
            {historyPoints.map((rally, index) => {
              const directPoint = rally.directPoint!;
              const teamLabel = directPoint.team === "own" ? "Propio" : "Contrario";
              return (
                <li 
                  key={rally.id}
                  className={selectedHistoryRallyId === rally.id ? 'selected' : ''}
                  onClick={() => handleHistoryClick(rally.id)}
                >
                  <strong>{directPoint.spike.evaluation || '#'} </strong>
                  {teamLabel} desde zona {directPoint.spike.zone} â€“ Rally {index + 1} ({rally.trajectories.length} ataques)
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modales */}
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
          team={drawState.team}
          zone={drawState.zone}
          complex={drawState.complex}
          playerRole={drawState.playerRole}
          onClose={handleCloseDraw}
          onSpikeDraw={handleTrajectoryDrawn}
          averageAngle={averageAngle(trajectories[drawState.team][drawState.zone])}
          trajectories={trajectories[drawState.team][drawState.zone]}
          angularDeviation={angularDeviation(trajectories[drawState.team][drawState.zone])}
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
