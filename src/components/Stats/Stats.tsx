"use client";

import type { Action, Match } from "@/types/volley-model";
import { ActionLog } from "./ActionLog";
import { classifyDirection } from "@/utils/spikeMath";
import { useMemo, useState } from "react";

export interface StatsProps {
  trajectories: any;
  actions?: Action[];
  match?: Match | null;
}

export function Stats({ actions, match }: StatsProps) {
  const spikeActions = (actions || []).filter((action) => action.type === "spike" && action.spike);
  const [teamFilter, setTeamFilter] = useState<"own" | "opponent" | "all">("own");

  const allPlayers = match
    ? [...match.homeTeam.players, ...match.awayTeam.players]
    : [];

  const getPlayerLabel = (action: Action) => {
    const player = allPlayers.find((p) => p.id === action.playerId);
    const name = player?.name || "Jugador desconocido";
    const role = action.playerRole ? `(${action.playerRole})` : "";
    return `${name} ${role}`.trim();
  };

  const getTeamName = (action: Action) => {
    if (!match) return "Equipo";
    if (action.teamId === match.homeTeam.id) return match.homeTeam.name;
    if (action.teamId === match.awayTeam.id) return match.awayTeam.name;
    return "Equipo";
  };

  const filteredSpikeActions = useMemo(() => {
    if (!match) return spikeActions;
    if (teamFilter === "all") return spikeActions;
    if (teamFilter === "own") {
      return spikeActions.filter((action) => action.teamId === match.homeTeam.id);
    }
    return spikeActions.filter((action) => action.teamId === match.awayTeam.id);
  }, [match, spikeActions, teamFilter]);

  return (
    <section>
      <h2>Estadísticas de Ataques con Contexto</h2>
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
        <strong>Spikes registrados:</strong> {filteredSpikeActions.length}
        {filteredSpikeActions.length !== spikeActions.length && (
          <span style={{ color: "#666" }}>(total {spikeActions.length})</span>
        )}
      </div>

      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="spike-team-filter" style={{ fontWeight: 600 }}>Equipo:</label>
        <select
          id="spike-team-filter"
          value={match ? teamFilter : "all"}
          onChange={(e) => setTeamFilter(e.target.value as "own" | "opponent" | "all")}
          style={{ padding: "4px 8px" }}
          disabled={!match}
        >
          <option value="own">Equipo propio</option>
          <option value="opponent">Equipo rival</option>
          <option value="all">Ambos</option>
        </select>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", background: "#fafafa", padding: "8px 10px", fontWeight: 600 }}>
          <span>Quién atacó</span>
          <span>Equipo</span>
          <span>Desde dónde</span>
          <span>Hacia dónde</span>
        </div>
        {filteredSpikeActions.length === 0 ? (
          <div style={{ padding: "10px", color: "#666" }}>Sin spikes todavía.</div>
        ) : (
          filteredSpikeActions.map((action) => {
            const zone = action.zone ?? action.context?.zone;
            const direction = action.spike ? classifyDirection(action.spike) : "Dirección desconocida";
            return (
              <div
                key={action.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                  padding: "8px 10px",
                  borderTop: "1px solid #f2f2f2",
                }}
              >
                <span>{getPlayerLabel(action)}</span>
                <span>{getTeamName(action)}</span>
                <span>{zone ? `Zona ${zone}` : "Zona desconocida"}</span>
                <span>{direction}</span>
              </div>
            );
          })
        )}
      </div>

      {actions && actions.length > 0 && <ActionLog actions={actions} match={match} />}
    </section>
  );
}


