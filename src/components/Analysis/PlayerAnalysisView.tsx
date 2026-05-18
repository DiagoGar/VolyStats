"use client";

import { useMemo, useState } from "react";
import type { PlayerAnalysis } from "@/types/analysis";
import type { CourtPosition, Match, Player } from "@/types/volley-model";
import { buildPlayerAnalysis } from "@/utils/analysis";
import { getCourtPositionCoords, isTeamOnBottom, type CourtOrientation } from "@/utils/courtGeometry";
import "@/components/Court/court.css";

interface PlayerAnalysisViewProps {
  match: Match;
  roleAssignments: {
    homeTeamAssignments: Record<CourtPosition, Player>;
    awayTeamAssignments: Record<CourtPosition, Player>;
  };
}

const courtOrientation: CourtOrientation = "normal";
const positions: CourtPosition[] = [1, 2, 3, 4, 5, 6];

const formatPercent = (value: number) => `${value}%`;
const formatCourtValue = (value: number) => `${Math.round(value * 100)}%`;

const getHeatCellStyle = (zone: CourtPosition, team: "own" | "opponent", intensity: number) => {
  const isBottom = isTeamOnBottom(team, courtOrientation);
  const top = isBottom ? "50%" : "0%";
  const row = zone === 4 || zone === 3 || zone === 2 ? 0 : 1;
  const column = zone === 4 || zone === 5 ? 0 : zone === 3 || zone === 6 ? 1 : 2;

  return {
    left: `${column * 33.333}%`,
    top: `calc(${top} + ${row * 25}%)`,
    width: "33.333%",
    height: "25%",
    opacity: 0.18 + intensity * 0.52,
  };
};

function AnalysisOverlay({ analysis }: { analysis: PlayerAnalysis }) {
  const trajectories = [...analysis.attack.trajectories, ...analysis.reception.trajectories, ...analysis.set.trajectories];

  return (
    <>
      {analysis.reception.heatmap
        .filter((cell) => cell.count > 0)
        .map((cell) => (
          <div
            key={`heat-${cell.zone}`}
            className="analysis-heat-cell"
            style={getHeatCellStyle(cell.zone as CourtPosition, analysis.teamSide, cell.intensity)}
            title={`Recepciones en zona ${cell.zone}: ${cell.count}`}
          >
            <span>{cell.count}</span>
          </div>
        ))}

      <svg className="analysis-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {analysis.attack.cone && (
          <polygon
            className="analysis-cone"
            points={[
              `${analysis.attack.cone.origin.x * 100},${analysis.attack.cone.origin.y * 100}`,
              `${analysis.attack.cone.left.x * 100},${analysis.attack.cone.left.y * 100}`,
              `${analysis.attack.cone.right.x * 100},${analysis.attack.cone.right.y * 100}`,
            ].join(" ")}
          />
        )}

        {trajectories.map((trajectory) => (
          <line
            key={trajectory.id}
            className={`analysis-trajectory ${trajectory.kind}`}
            x1={trajectory.start.x * 100}
            y1={trajectory.start.y * 100}
            x2={trajectory.end.x * 100}
            y2={trajectory.end.y * 100}
          />
        ))}

        {analysis.attack.contactPoints.map((point) => (
          <circle
            key={point.id}
            className="analysis-contact attack"
            cx={point.x * 100}
            cy={point.y * 100}
            r="1.2"
          />
        ))}

        {analysis.reception.contactPoints.map((point) => (
          <circle
            key={point.id}
            className="analysis-contact reception"
            cx={point.x * 100}
            cy={point.y * 100}
            r="1.1"
          />
        ))}

        {analysis.set.contactPoints.map((point) => (
          <circle
            key={point.id}
            className="analysis-contact set"
            cx={point.x * 100}
            cy={point.y * 100}
            r="1.1"
          />
        ))}

        <circle
          className="analysis-contact reception"
          cx={analysis.reception.referencePoint.x * 100}
          cy={analysis.reception.referencePoint.y * 100}
          r="1.4"
        />
      </svg>
    </>
  );
}

function AnalysisSidebar({ analysis }: { analysis: PlayerAnalysis | null }) {
  if (!analysis) {
    return (
      <aside className="analysis-sidebar">
        <div className="analysis-empty">
          <h3>Analisis contextual</h3>
          <p>Click en una jugadora o un jugador dentro de la cancha para abrir el panel.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="analysis-sidebar">
      <div className="analysis-panel-card">
        <div className="analysis-kicker">Jugador seleccionado</div>
        <h3>{analysis.player.name}</h3>
        <p>
          #{analysis.player.number} - {analysis.player.primaryRole}
        </p>
      </div>

      <div className="analysis-panel-card">
        <div className="analysis-section-title">Ataque</div>
        <div className="analysis-metric-grid">
          <div>
            <strong>{formatPercent(analysis.attack.successRate)}</strong>
            <span>Exito</span>
          </div>
          <div>
            <strong>{analysis.attack.total}</strong>
            <span>Volumen</span>
          </div>
          <div>
            <strong>{analysis.attack.dominantTrend?.label ?? "-"}</strong>
            <span>Tendencia</span>
          </div>
        </div>
        <div className="analysis-list">
          {analysis.attack.trends.map((trend) => (
            <div key={trend.key} className="analysis-list-row">
              <span>{trend.label}</span>
              <span>{trend.total}</span>
              <span>{formatPercent(trend.rate)}</span>
              <span>{formatPercent(trend.successRate)} exito</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analysis-panel-card">
        <div className="analysis-section-title">Armado</div>
        <div className="analysis-metric-grid">
          <div>
            <strong>{analysis.set.total}</strong>
            <span>Volumen</span>
          </div>
          <div>
            <strong>{formatPercent(analysis.set.successRate)}</strong>
            <span>Exito</span>
          </div>
          <div>
            <strong>{analysis.set.dominantZone ? `Z${analysis.set.dominantZone}` : "-"}</strong>
            <span>Zona dominante</span>
          </div>
          <div>
            <strong>{analysis.set.bestSuccessZone ? `Z${analysis.set.bestSuccessZone}` : "-"}</strong>
            <span>Mejor eficiencia</span>
          </div>
        </div>
        <div className="analysis-context-group">
          <h4>Precision</h4>
          <div className="analysis-chip-row">
            <span>Distancia media al punto ideal</span>
            <strong>{formatCourtValue(analysis.set.averagePrecisionDistance)}</strong>
          </div>
        </div>
        <div className="analysis-context-group">
          <h4>Distribucion de juego</h4>
          {analysis.set.distributions.every((item) => item.total === 0) ? (
            <p>Sin datos</p>
          ) : (
            analysis.set.distributions.map((item) => (
              <div key={item.zone} className="analysis-chip-row">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <span>{formatPercent(item.rate)}</span>
                <span>{formatPercent(item.successRate)} exito</span>
              </div>
            ))
          )}
        </div>
        <div className="analysis-context-group">
          <h4>Lectura tactica</h4>
          {analysis.set.tactical.insights.length === 0 ? (
            <p>Sin datos suficientes</p>
          ) : (
            analysis.set.tactical.insights.map((insight) => (
              <div key={insight.id} className="analysis-chip-row">
                <span>{insight.text}</span>
              </div>
            ))
          )}
        </div>
        <div className="analysis-context-group">
          <h4>Distribucion por complejo</h4>
          {analysis.set.tactical.byComplex.length === 0 ? (
            <p>Sin datos</p>
          ) : (
            analysis.set.tactical.byComplex.map((item) => (
              <div key={item.key} className="analysis-chip-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: "6px" }}>
                <span>
                  {item.label} · {item.total} armados · {formatPercent(item.successRate)} exito
                </span>
                <span>
                  Dominante: {item.dominantZone ? `Z${item.dominantZone}` : "-"}
                </span>
                <span>
                  {item.distributions
                    .filter((distribution) => distribution.total > 0)
                    .map((distribution) => `${distribution.label}: ${distribution.total} (${formatPercent(distribution.rate)})`)
                    .join(" · ") || "Sin destinos"}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="analysis-context-group">
          <h4>Distribucion por rotacion</h4>
          {analysis.set.tactical.byRotation.length === 0 ? (
            <p>Sin datos</p>
          ) : (
            analysis.set.tactical.byRotation.map((item) => (
              <div key={item.key} className="analysis-chip-row">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <span>{item.dominantZone ? `Z${item.dominantZone}` : "-"}</span>
                <span>{formatPercent(item.successRate)} exito</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="analysis-panel-card">
        <div className="analysis-section-title">Recepcion</div>
        <div className="analysis-metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div>
            <strong>{analysis.reception.total}</strong>
            <span>Volumen</span>
          </div>
          <div>
            <strong>
              {analysis.reception.dominantQuality
                ? analysis.reception.qualities.find((quality) => quality.key === analysis.reception.dominantQuality)?.label
                : "-"}
            </strong>
            <span>Calidad dominante</span>
          </div>
        </div>
        <div className="analysis-list">
          {analysis.reception.qualities.map((quality) => (
            <div key={quality.key} className="analysis-list-row" style={{ gridTemplateColumns: "1fr auto auto" }}>
              <span>{quality.label}</span>
              <span>{quality.total}</span>
              <span>{formatPercent(quality.rate)}</span>
            </div>
          ))}
        </div>
        <div className="analysis-context-group">
          <h4>Punto de armado fijo</h4>
          <div className="analysis-chip-row">
            <span>Referencia</span>
            <strong>
              x {formatCourtValue(analysis.reception.referencePoint.x)} | y {formatCourtValue(analysis.reception.referencePoint.y)}
            </strong>
          </div>
          <div className="analysis-chip-row">
            <span>Distancia media</span>
            <strong>{formatCourtValue(analysis.reception.averageDistanceToTarget)}</strong>
          </div>
          <div className="analysis-chip-row">
            <span>Desvio lateral</span>
            <strong>{formatCourtValue(analysis.reception.averageLateralOffset)}</strong>
          </div>
          <div className="analysis-chip-row">
            <span>Desvio profundidad</span>
            <strong>{formatCourtValue(analysis.reception.averageDepthOffset)}</strong>
          </div>
        </div>
      </div>

      <div className="analysis-panel-card">
        <div className="analysis-section-title">Contexto</div>
        <div className="analysis-context-group">
          <h4>Por rotacion</h4>
          {analysis.context.byRotation.length === 0 ? (
            <p>Sin datos</p>
          ) : (
            analysis.context.byRotation.map((item) => (
              <div key={item.key} className="analysis-chip-row">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <span>{formatPercent(item.successRate)} exito</span>
              </div>
            ))
          )}
        </div>
        <div className="analysis-context-group">
          <h4>Por complejo</h4>
          {analysis.context.byComplex.length === 0 ? (
            <p>Sin datos</p>
          ) : (
            analysis.context.byComplex.map((item) => (
              <div key={item.key} className="analysis-chip-row">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <span>{formatPercent(item.successRate)} exito</span>
              </div>
            ))
          )}
        </div>
        <div className="analysis-context-group">
          <h4>Por zona real</h4>
          {analysis.context.byZone.length === 0 ? (
            <p>Sin datos</p>
          ) : (
            analysis.context.byZone.map((item) => (
              <div key={item.key} className="analysis-chip-row">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
                <span>{formatPercent(item.successRate)} exito</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export function PlayerAnalysisView({ match, roleAssignments }: PlayerAnalysisViewProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const analysis = useMemo(
    () => (selectedPlayerId ? buildPlayerAnalysis(match, selectedPlayerId) : null),
    [match, selectedPlayerId]
  );

  const renderPlayerMarkers = (team: "own" | "opponent") => {
    const assignments = team === "own" ? roleAssignments.homeTeamAssignments : roleAssignments.awayTeamAssignments;

    return positions.map((position) => {
      const player = assignments[position];
      const coords = getCourtPositionCoords(position, team, courtOrientation);
      const isSelected = player?.id === selectedPlayerId;
      const actionCount = player ? match.actions.filter((action) => action.playerId === player.id).length : 0;

      return (
        <button
          key={`${team}-${position}`}
          type="button"
          className={`player-marker ${team} ${isSelected ? "selected" : ""} analysis-player-marker`}
          style={{ left: `${coords.x * 100}%`, top: `${coords.y * 100}%` }}
          onClick={() => setSelectedPlayerId(player?.id ?? null)}
        >
          <span className="player-zone">Z{position}</span>
          <span className="player-name">{player?.name ?? "Sin asignar"}</span>
          <span className="player-value">{actionCount} acciones</span>
        </button>
      );
    });
  };

  return (
    <section className="analysis-layout">
      <div className="analysis-court-wrap">
        <div className="court-header analysis-header">
          <span className="court-title">Modo Analisis</span>
          <span className="analysis-header-copy">Click en un jugador para ver tendencias, armado, recepcion y contexto real.</span>
        </div>

        <div className="court analysis-court">
          <div className="court-label court-label--top">Equipo Contrario - {match.awayTeam.name}</div>
          <div className="court-label court-label--bottom">Equipo Propio - {match.homeTeam.name}</div>
          <div className="center-line"></div>

          {analysis && <AnalysisOverlay analysis={analysis} />}

          <div className="court-players">{renderPlayerMarkers("opponent")}</div>
          <div className="court-players">{renderPlayerMarkers("own")}</div>
        </div>
      </div>

      <AnalysisSidebar analysis={analysis} />
    </section>
  );
}
