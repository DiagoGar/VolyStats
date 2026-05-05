"use client";

import type { Action, Match } from "@/types/volley-model";
import { useMemo, useState } from "react";

interface ActionLogProps {
  actions: Action[];
  match?: Match | null;
}

const EVALUATION_OPTIONS: Array<Action["evaluation"]> = ["#", "++", "+", "/", "-", "--"];
const COMPLEX_OPTIONS = ["K0", "K1", "K2", "K3", "K4", "K5"] as const;

export function ActionLog({ actions, match }: ActionLogProps) {
  const [filterComplex, setFilterComplex] = useState<string>("");
  const [filterEvaluation, setFilterEvaluation] = useState<string>("");
  const [filterTeam, setFilterTeam] = useState<"own" | "opponent" | "all">("own");

  const getTeamLabel = (action: Action) => {
    if (!match) return action.team || "Equipo";
    if (action.teamId === match.homeTeam.id) return "Local";
    if (action.teamId === match.awayTeam.id) return "Visitante";
    return "Equipo";
  };

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const p1 = !filterComplex || action.complex === filterComplex;
      const p2 = !filterEvaluation || action.evaluation === filterEvaluation;
      const p3 =
        filterTeam === "all" ||
        (!match && action.team === (filterTeam === "own" ? "home" : "away")) ||
        (match &&
          ((filterTeam === "own" && action.teamId === match.homeTeam.id) ||
            (filterTeam === "opponent" && action.teamId === match.awayTeam.id)));
      return p1 && p2 && p3;
    });
  }, [actions, filterComplex, filterEvaluation, filterTeam, match]);

  const getEvaluationLabel = (action: Action) => {
    if (action.evaluation) return action.evaluation;
    if (action.serveResult === "ace") return "Ace";
    if (action.serveResult === "error") return "Error";
    if (action.serveResult === "en_juego") return "En juego";
    return "-";
  };

  const totalByComplex = useMemo(() => {
    const counter: Record<string, number> = { K0: 0, K1: 0, K2: 0, K3: 0, K4: 0, K5: 0 };
    for (const action of actions) {
      if (action.complex && counter[action.complex] !== undefined) {
        counter[action.complex]++;
      }
    }
    return counter;
  }, [actions]);

  const totalByEvaluation = useMemo(() => {
    const counter: Record<string, number> = { "#": 0, "++": 0, "+": 0, "/": 0, "-": 0, "--": 0 };
    for (const action of actions) {
      if (action.evaluation && counter[action.evaluation] !== undefined) {
        counter[action.evaluation]++;
      }
    }
    return counter;
  }, [actions]);

  return (
    <section style={{ marginTop: "24px" }}>
      <h2>Historial de Acciones</h2>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        <select
          value={match ? filterTeam : "own"}
          onChange={(e) => setFilterTeam(e.target.value as "own" | "opponent" | "all")}
          disabled={!match && !actions.some((action) => action.team)}
        >
          <option value="all">Ambos equipos</option>
          <option value="own">Equipo propio</option>
          <option value="opponent">Equipo rival</option>
        </select>

        <select value={filterComplex} onChange={(e) => setFilterComplex(e.target.value)}>
          <option value="">Todos los complejos</option>
          {COMPLEX_OPTIONS.map((c) => (
            <option value={c} key={c}>{c}</option>
          ))}
        </select>

        <select value={filterEvaluation} onChange={(e) => setFilterEvaluation(e.target.value)}>
          <option value="">Todas las evaluaciones</option>
          {EVALUATION_OPTIONS.map((e) => (
            <option value={e} key={e}>{e}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(110px, 1fr))", gap: "8px", marginBottom: "12px" }}>
        {COMPLEX_OPTIONS.map((c) => (
          <div key={c} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "6px" }}>
            <strong>{c}</strong>: {totalByComplex[c]}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(60px, 1fr))", gap: "8px", marginBottom: "16px" }}>
        {Object.entries(totalByEvaluation).map(([evalKey, count]) => (
          <div key={evalKey} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "6px" }}>
            <strong>{evalKey}</strong>: {count}
          </div>
        ))}
      </div>

      <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px" }}>
        {filteredActions.length === 0 ? (
          <p style={{ padding: "10px", margin: "0", color: "#555" }}>No hay acciones para mostrar.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filteredActions.map((action, idx) => (
              <li key={action.id} style={{ padding: "8px 10px", borderBottom: "1px solid #f2f2f2", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                <span><strong>#{idx + 1}</strong></span>
                <span>{getTeamLabel(action)} / {action.actionType}</span>
                <span>Zona {action.zone}{action.position ? ` (pos ${action.position})` : ''}</span>
                <span>Complejo {action.complex || '-'}</span>
                <span>Eval {getEvaluationLabel(action)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
