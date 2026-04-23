import type { MatchStats, Zone } from "@/types/stats";
import { calculatePercentage } from "@/utils/calculations";
import type { GameTrajectoryHistory, SpikeTrajectoriesByZone } from "@/hooks/useGameTrajectories";
import { useState, useRef, useEffect } from "react";
import type { Complex, PlayerRole, Evaluation } from "@/types/spike";
import { drawPersistentTrajectories, drawOrigin, drawLine, getNormalizedPos } from "@/utils/canvasUtils";
import type { CourtPosition, Match, Player, RallyStatus, ServeResult, ServeType } from "@/types/volley-model";
import {
  getActionZoneFromPosition,
  getCourtPositionCoords,
  isTeamOnBottom,
  toLegacyZone,
  type CourtOrientation,
} from "@/utils/courtGeometry";

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
  match: Match;
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  } | null;
  servingTeam: "home" | "away";
  teamNames: {
    home: string;
    away: string;
  };
  rallyStatus: RallyStatus;
  lastActionType?: "serve" | "attack" | "defense" | null;
  lastActionTeam?: "home" | "away" | null;
  onSubstitute: (
    teamType: "home" | "away",
    position: CourtPosition,
    outPlayerId: string,
    inPlayerId: string
  ) => { ok: true } | { ok: false; message: string };
  onAttack: (team: "own" | "opponent", zone: Zone) => void;
  onToggleMode: (team: "own" | "opponent") => void;
  onServe: (
    team: "own" | "opponent",
    serveType: ServeType,
    serveResult: ServeResult,
    serve: { start: { x: number; y: number }; end: { x: number; y: number } }
  ) => void;
  onServeReception: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    playerId?: string,
    playerRole?: PlayerRole
  ) => void;
  onRallyResult: (team: "own" | "opponent") => void;
  onSpikeDraw: (
    team: "own" | "opponent",
    zone: Zone,
    start: { x: number; y: number },
    end: { x: number; y: number },
    complex?: Complex,
    playerId?: string,
    playerRole?: PlayerRole,
    evaluation?: Evaluation
  ) => void;
}

export function FullCourt({
  stats,
  trajectories,
  trajectoryHistory,
  match,
  roleAssignments,
  servingTeam,
  teamNames,
  rallyStatus,
  lastActionType,
  lastActionTeam,
  onSubstitute,
  onAttack,
  onToggleMode,
  onServe,
  onServeReception,
  onRallyResult,
  onSpikeDraw,
}: FullCourtProps) {
  const courtOrientation: CourtOrientation = "normal";
  const [filterComplex, setFilterComplex] = useState<Complex | null>(null);
  const [filterEvaluation, setFilterEvaluation] = useState<Evaluation | null>(null);
  const [filterTeam, setFilterTeam] = useState<"own" | "opponent" | null>(null);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedHistoryRallyId, setSelectedHistoryRallyId] = useState<string | null>(null);
  const [serveType, setServeType] = useState<ServeType>("flotado");
  const [serveTrajectory, setServeTrajectory] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [serveDrawOpen, setServeDrawOpen] = useState(false);
  const [attackDrawState, setAttackDrawState] = useState<{
    team: "own" | "opponent";
    playerId?: string;
    playerRole?: PlayerRole;
    playerName?: string;
    position?: CourtPosition;
  } | null>(null);
  const [isAttackDrawing, setIsAttackDrawing] = useState(false);
  const [attackDrawStart, setAttackDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [attackDrawEnd, setAttackDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [isServeDrawing, setIsServeDrawing] = useState(false);
  const [serveDrawStart, setServeDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [serveDrawEnd, setServeDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [substitutionOpen, setSubstitutionOpen] = useState(false);
  const [substitutionTeam, setSubstitutionTeam] = useState<"home" | "away">("home");
  const [substitutionOutPlayerId, setSubstitutionOutPlayerId] = useState("");
  const [substitutionInPlayerId, setSubstitutionInPlayerId] = useState("");
  const [substitutionMessage, setSubstitutionMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const historyRallies = trajectoryHistory?.rallies ?? [];
  const servingSide: "own" | "opponent" = servingTeam === "home" ? "own" : "opponent";
  const receivingSide: "own" | "opponent" = servingSide === "own" ? "opponent" : "own";
  const servingTeamLabel = servingTeam === "home" ? teamNames.home : teamNames.away;
  const receivingTeamLabel = servingTeam === "home" ? teamNames.away : teamNames.home;
  const shouldEnableServeDrawing = rallyStatus === "waiting_serve" && (!serveTrajectory || serveDrawOpen);
  const interactionMode: "attack" | "serve" | null =
    attackDrawState ? "attack" : shouldEnableServeDrawing ? "serve" : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showTrajectories && !selectedHistoryRallyId) {
      // Dibujar solo trayectorias del rally en curso cuando no hay historial seleccionado
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
        const rallyItems = selectedRally.trajectories.filter((item) => {
          // Aplicar filtros de equipo
          if (filterTeam && item.team !== filterTeam) return false;
          // Aplicar filtro de complejo
          if (filterComplex && item.spike.complex !== filterComplex) return false;
          // Aplicar filtro de evaluación
          if (filterEvaluation && item.spike.evaluation !== filterEvaluation) return false;
          return true;
        });

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
          // Aplicar filtros al punto directo también
          const directPointItem = selectedRally.directPoint;
          const shouldShowDirectPoint =
            (!filterTeam || directPointItem.team === filterTeam) &&
            (!filterComplex || directPointItem.spike.complex === filterComplex) &&
            (!filterEvaluation || directPointItem.spike.evaluation === filterEvaluation);

          if (shouldShowDirectPoint) {
            const directPointMap = {
              [selectedRally.directPoint.spike.zone]: [selectedRally.directPoint.spike],
            };
            drawPersistentTrajectories(ctx, canvas, directPointMap, null, null, "#FFD700", false, 1.0, 4);
          }
        }
      }
    }
  }, [trajectories, trajectoryHistory, filterComplex, filterEvaluation, filterTeam, showTrajectories, selectedHistoryRallyId]);

  useEffect(() => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (rallyStatus !== "waiting_serve" && substitutionOpen) {
      setSubstitutionOpen(false);
      setSubstitutionMessage(null);
    }
  }, [rallyStatus, substitutionOpen]);

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

  const getAssignmentsForTeam = (teamType: "home" | "away") =>
    roleAssignments
      ? teamType === "home"
        ? roleAssignments.homeTeamAssignments
        : roleAssignments.awayTeamAssignments
      : null;

  const teamRoster = substitutionTeam === "home" ? match.homeTeam.players : match.awayTeam.players;
  const substitutionAssignments = getAssignmentsForTeam(substitutionTeam);
  const substitutionOnCourt = substitutionAssignments ? Object.values(substitutionAssignments) : [];
  const substitutionBench = teamRoster.filter(
    (player) => !substitutionOnCourt.some((onCourtPlayer) => onCourtPlayer.id === player.id)
  );
  const substitutionPosition = substitutionAssignments
    ? ([1, 2, 3, 4, 5, 6] as CourtPosition[]).find(
        (position) => substitutionAssignments[position]?.id === substitutionOutPlayerId
      ) ?? null
    : null;

  const handlePlayerAttack = (team: "own" | "opponent", position: CourtPosition, player?: Player | null) => {
    if (rallyStatus === "waiting_serve") {
      const markerPos = getCourtPositionCoords(position, team, courtOrientation);
      const legacyZone = toLegacyZone(getActionZoneFromPosition(markerPos, team, courtOrientation));
      onAttack(team, legacyZone);
      return;
    }
    if (rallyStatus === "awaiting_serve_reception" && team !== receivingSide) return;
    setAttackDrawState({
      team,
      playerId: player?.id,
      playerRole: player?.primaryRole,
      playerName: player?.name ?? "Sin asignar",
      position,
    });
  };

  const handleServeResult = (serveResult: ServeResult) => {
    if (!serveTrajectory) return;
    onServe(servingSide, serveType, serveResult, serveTrajectory);
    setServeTrajectory(null);
  };

  const handleAttackDrawn = (
    team: "own" | "opponent",
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    if (!attackDrawState) return;
    const actionZone = getActionZoneFromPosition(start, team, courtOrientation);
    const legacyZone = toLegacyZone(actionZone);
    if (rallyStatus === "awaiting_serve_reception") {
      onServeReception(team, legacyZone, start, end, attackDrawState.playerId, attackDrawState.playerRole);
      setAttackDrawState(null);
      setAttackDrawStart(null);
      return;
    }
    onAttack(team, legacyZone);
    onSpikeDraw(team, legacyZone, start, end, undefined, attackDrawState.playerId, attackDrawState.playerRole, undefined);
    setAttackDrawState(null);
    setAttackDrawStart(null);
  };

  const drawPreview = (
    start: { x: number; y: number },
    pos: { x: number; y: number },
    actionType: "attack" | "defense" | "serve" = "attack"
  ) => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOrigin(ctx, canvas, start);
    const isDefense = actionType === "defense";
    const isServe = actionType === "serve";
    drawLine(ctx, canvas, start, pos, {
      color: isDefense ? "#22c1ff" : isServe ? "#0f766e" : "#ff2d2d",
      lineWidth: 3,
      dash: isDefense ? [6, 4] : isServe ? [2, 6] : [],
    });
  };

  const isDefenseAction = (team: "own" | "opponent") => {
    if (rallyStatus === "awaiting_serve_reception" && team === receivingSide) return true;
    if (!lastActionType || !lastActionTeam) return false;
    if (lastActionType !== "attack") return false;
    const teamId = team === "own" ? "home" : "away";
    return lastActionTeam !== teamId;
  };

  const isAllowedServeStart = (pos: { x: number; y: number }, team: "own" | "opponent") => {
    const band = 0.15;
    const isBottom = isTeamOnBottom(team, courtOrientation);
    return isBottom ? pos.y >= 1 - band : pos.y <= band;
  };

  const clearInteractionCanvas = () => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactionMode) return;
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const pos = getNormalizedPos(e, canvas);

    if (interactionMode === "serve") {
      if (!isAllowedServeStart(pos, servingSide)) return;
      setServeDrawStart(pos);
      setServeDrawEnd(pos);
      setIsServeDrawing(true);
      drawPreview(pos, pos, "serve");
      return;
    }

    if (!attackDrawState) return;
    setAttackDrawStart(pos);
    setIsAttackDrawing(true);
    setAttackDrawEnd(pos);
    drawPreview(pos, pos, isDefenseAction(attackDrawState.team) ? "defense" : "attack");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactionMode) return;
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const pos = getNormalizedPos(e, canvas);

    if (interactionMode === "serve") {
      if (!isServeDrawing || !serveDrawStart) return;
      setServeDrawEnd(pos);
      drawPreview(serveDrawStart, pos, "serve");
      return;
    }

    if (!isAttackDrawing || !attackDrawState || !attackDrawStart) return;
    setAttackDrawEnd(pos);
    drawPreview(attackDrawStart, pos, isDefenseAction(attackDrawState.team) ? "defense" : "attack");
  };

  const handlePointerUp = () => {
    if (interactionMode === "serve") {
      if (!isServeDrawing || !serveDrawEnd || !serveDrawStart) {
        setIsServeDrawing(false);
        return;
      }
      setServeTrajectory({ start: serveDrawStart, end: serveDrawEnd });
      setServeDrawOpen(false);
      setIsServeDrawing(false);
      setServeDrawEnd(null);
      setServeDrawStart(null);
      clearInteractionCanvas();
      return;
    }

    if (!isAttackDrawing || !attackDrawState || !attackDrawEnd || !attackDrawStart) {
      setIsAttackDrawing(false);
      return;
    }
    handleAttackDrawn(attackDrawState.team, attackDrawStart, attackDrawEnd);
    setIsAttackDrawing(false);
    setAttackDrawEnd(null);
    setAttackDrawStart(null);
    clearInteractionCanvas();
  };

  const handleHistoryClick = (rallyId: string) => {
    setSelectedHistoryRallyId(rallyId);
  };

  const clearSelectedTrajectory = () => {
    setSelectedHistoryRallyId(null);
  };

  const handleOpenSubstitution = () => {
    setSubstitutionOpen((prev) => !prev);
    setSubstitutionMessage(null);
    setSubstitutionOutPlayerId("");
    setSubstitutionInPlayerId("");
    setSubstitutionTeam(servingTeam === "home" ? "home" : "away");
  };

  const handleTeamChange = (team: "home" | "away") => {
    setSubstitutionTeam(team);
    setSubstitutionOutPlayerId("");
    setSubstitutionInPlayerId("");
    setSubstitutionMessage(null);
  };

  const handleConfirmSubstitution = () => {
    if (!substitutionPosition || !substitutionOutPlayerId || !substitutionInPlayerId) {
      setSubstitutionMessage("Selecciona equipo, quien sale y quien entra.");
      return;
    }

    const result = onSubstitute(
      substitutionTeam,
      substitutionPosition,
      substitutionOutPlayerId,
      substitutionInPlayerId
    );

    if (!result.ok) {
      setSubstitutionMessage(result.message);
      return;
    }

    setSubstitutionMessage(null);
    setSubstitutionInPlayerId("");
    setSubstitutionOutPlayerId("");
    setSubstitutionOpen(false);
  };

  const serverPlayer = getPlayerAtZone(servingSide, 1);
  const legacyZones: Zone[] = [1, 2, 3, 4, 6];
  const getValueForPosition = (team: "own" | "opponent", position: CourtPosition) => {
    if (!legacyZones.includes(position as Zone)) return "-";
    return getValue(team, position as Zone);
  };

  const renderPlayerMarkers = (team: "own" | "opponent") => {
    const positions: CourtPosition[] = [1, 2, 3, 4, 5, 6];
    const assignments = roleAssignments
      ? team === "own"
        ? roleAssignments.homeTeamAssignments
        : roleAssignments.awayTeamAssignments
      : null;

    return positions.map((position) => {
      const player = assignments ? assignments[position] : null;
      const coords = getCourtPositionCoords(position, team, courtOrientation);
      const isSelected = attackDrawState?.position === position && attackDrawState?.team === team;
      const value = getValueForPosition(team, position);
      const label = player?.name?.trim()
        ? player.name
        : typeof player?.number === "number" && player.number > 0
          ? `#${player.number}`
          : "Sin asignar";

      return (
        <button
          key={`${team}-${position}`}
          className={`player-marker ${team} ${isSelected ? "selected" : ""}`}
          style={{ left: `${coords.x * 100}%`, top: `${coords.y * 100}%` }}
          onClick={() => handlePlayerAttack(team, position, player)}
          type="button"
        >
          <span className="player-name">{label}</span>
          <span className="player-value">{value}</span>
        </button>
      );
    });
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

      {rallyStatus === "waiting_serve" && (
        <div className="serve-panel">
          <div className="serve-title">Saque - {servingTeamLabel}</div>
          <div className="serve-row">
            <span className="serve-label">Jugador:</span>
            <span className="serve-value">
              {serverPlayer?.name || "Sin asignar"} (auto)
            </span>
          </div>
          <div className="serve-row">
            <span className="serve-label">Tipo:</span>
            <div className="serve-options">
              <button
                type="button"
                className={`serve-option ${serveType === "flotado" ? "active" : ""}`}
                onClick={() => setServeType("flotado")}
              >
                Flotado
              </button>
              <button
                type="button"
                className={`serve-option ${serveType === "salto" ? "active" : ""}`}
                onClick={() => setServeType("salto")}
              >
                Salto
              </button>
            </div>
          </div>
          <div className="serve-row">
            <span className="serve-label">Trayectoria:</span>
            <div className="serve-options">
              <button type="button" className="serve-option" onClick={() => setServeDrawOpen((prev) => !prev)}>
                {serveTrajectory ? "Redibujar" : "Dibujar"}
              </button>
              {serveTrajectory && <span className="serve-helper">Lista</span>}
            </div>
          </div>
          <div className="serve-row">
            <span className="serve-label">Resultado:</span>
            <div className="serve-options">
              <button
                type="button"
                className="serve-result in-play"
                onClick={() => handleServeResult("en_juego")}
                disabled={!serveTrajectory}
              >
                En juego
              </button>
              <button
                type="button"
                className="serve-result error"
                onClick={() => handleServeResult("error")}
                disabled={!serveTrajectory}
              >
                Error
              </button>
              <button
                type="button"
                className="serve-result ace"
                onClick={() => handleServeResult("ace")}
                disabled={!serveTrajectory}
              >
                Ace
              </button>
            </div>
          </div>
          <div className="serve-row serve-row--substitution">
            <span className="serve-label">Plantel:</span>
            <div className="serve-options">
              <button
                type="button"
                className={`serve-option ${substitutionOpen ? "active" : ""}`}
                onClick={handleOpenSubstitution}
              >
                Sustitucion
              </button>
            </div>
          </div>
          {substitutionOpen && (
            <div className="substitution-panel">
              <div className="substitution-grid">
                <div className="filter-group">
                  <label>Equipo:</label>
                  <select
                    value={substitutionTeam}
                    onChange={(e) => handleTeamChange(e.target.value as "home" | "away")}
                  >
                    <option value="home">{teamNames.home}</option>
                    <option value="away">{teamNames.away}</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Sale:</label>
                  <select
                    value={substitutionOutPlayerId}
                    onChange={(e) => {
                      setSubstitutionOutPlayerId(e.target.value);
                      setSubstitutionInPlayerId("");
                      setSubstitutionMessage(null);
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {substitutionOnCourt.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name?.trim() ? player.name : `#${player.number}`} · #{player.number}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Entra:</label>
                  <select
                    value={substitutionInPlayerId}
                    onChange={(e) => {
                      setSubstitutionInPlayerId(e.target.value);
                      setSubstitutionMessage(null);
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {substitutionBench.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name?.trim() ? player.name : `#${player.number}`} · #{player.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="substitution-summary">
                <span>
                  Posicion: {substitutionPosition ? `Z${substitutionPosition}` : "-"}
                </span>
                <span>
                  Banco disponible: {substitutionBench.length}
                </span>
              </div>
              {substitutionMessage && <p className="substitution-message">{substitutionMessage}</p>}
              <div className="serve-options">
                <button
                  type="button"
                  className="serve-option active"
                  onClick={handleConfirmSubstitution}
                  disabled={!substitutionOutPlayerId || !substitutionInPlayerId}
                >
                  Confirmar cambio
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {rallyStatus === "awaiting_serve_reception" && (
        <div className="rally-panel">
          <div className="serve-title">Recepción del saque - {receivingTeamLabel}</div>
          <div className="serve-row">
            <span className="serve-label">Paso actual:</span>
            <span className="serve-value">Selecciona la jugadora o jugador receptor y dibuja la defensa inicial.</span>
          </div>
        </div>
      )}
      {rallyStatus === "in_play" && (
        <div className="rally-panel">
          <div className="serve-title">Rally en juego</div>
          <div className="serve-row">
            <span className="serve-label">Punto:</span>
            <div className="serve-options">
              <button
                type="button"
                className="rally-result own"
                onClick={() => onRallyResult("own")}
              >
                Propio
              </button>
              <button
                type="button"
                className="rally-result opponent"
                onClick={() => onRallyResult("opponent")}
              >
                Contrario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancha completa */}
      <div className={`court ${rallyStatus === "waiting_serve" ? "court--waiting-serve" : ""}`}>
        {rallyStatus === "waiting_serve" && (
          <div className="court-waiting-overlay" aria-live="polite">
            Esperando saque
          </div>
        )}

        <div className="court-label court-label--top">
          {isTeamOnBottom("own", courtOrientation)
            ? `Equipo Contrario · ${teamNames.away}`
            : `Equipo Propio · ${teamNames.home}`}
        </div>
        <div className="court-label court-label--bottom">
          {isTeamOnBottom("own", courtOrientation)
            ? `Equipo Propio · ${teamNames.home}`
            : `Equipo Contrario · ${teamNames.away}`}
        </div>

        {interactionMode === "serve" && (
          <div className="court-hint">Saque: dibuja desde el fondo de la cancha</div>
        )}
        {rallyStatus === "awaiting_serve_reception" && !attackDrawState && (
          <div className="court-hint">Recepción del saque: elige un receptor del equipo {receivingTeamLabel} y arrastra hacia donde fue la defensa.</div>
        )}
        {interactionMode === "attack" && attackDrawState && (
          <div className="court-hint">
            {rallyStatus === "awaiting_serve_reception"
              ? "Recepción del saque"
              : isDefenseAction(attackDrawState.team)
                ? "Defensa"
                : "Ataque"}: {attackDrawState.playerName ?? "Jugador"} · arrastra para dibujar
            <button
              type="button"
              className="court-cancel"
              onClick={() => {
                setAttackDrawState(null);
                setIsAttackDrawing(false);
                setAttackDrawEnd(null);
                setAttackDrawStart(null);
                clearInteractionCanvas();
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="center-line"></div>
        <div className="court-players">{renderPlayerMarkers("opponent")}</div>
        <div className="court-players">{renderPlayerMarkers("own")}</div>

        {/* Canvas para trayectorias */}
        <canvas ref={canvasRef} className="trajectory-canvas" width={600} height={400} />
        <canvas
          ref={interactionCanvasRef}
          className={`interaction-canvas ${interactionMode ? "active" : ""}`}
          width={600}
          height={400}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
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
        <h4>Historial de Rallies</h4>
        {selectedHistoryRallyId && (
          <div className="selected-indicator">
            <span>Mostrando trayectoria seleccionada</span>
            <button onClick={clearSelectedTrajectory} className="clear-selection-btn">❌</button>
          </div>
        )}
        {historyRallies.length === 0 ? (
          <p className="muted">No hay rallies registrados aún.</p>
        ) : (
          <ul>
            {[...historyRallies].reverse().map((rally, index) => {
              const winnerTeam = rally.winnerTeam ?? rally.directPoint?.team ?? rally.trajectories[rally.trajectories.length - 1]?.team;
              const teamLabel = winnerTeam === "own" ? "Propio" : winnerTeam === "opponent" ? "Contrario" : "Sin definir";
              const hasDefense = rally.trajectories.some((item) => item.spike.actionType === "defense");
              return (
                <li 
                  key={rally.id}
                  className={selectedHistoryRallyId === rally.id ? 'selected' : ''}
                  onClick={() => handleHistoryClick(rally.id)}
                >
                  <strong>{hasDefense ? "Rally" : "Punto directo"} </strong>
                  Ganador: {teamLabel} – Rally {historyRallies.length - index} ({rally.trajectories.length} acciones)
                </li>
              );
            })}
          </ul>
        )}
      </div>


    </div>
  );
}
