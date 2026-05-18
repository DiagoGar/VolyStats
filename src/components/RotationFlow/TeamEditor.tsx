// components/RotationFlow/TeamEditor.tsx
/**
 * Pantalla 2: Editar equipo (crear/editar jugadores)
 * Permite configurar el nombre del equipo y sus jugadores
 */

"use client";

import { useState } from "react";
import type { Team, Player, PlayerRole } from "@/types/volley-model";

const PLAYER_ROLES: PlayerRole[] = [
  "armador",
  "opuesto",
  "punta",
  "central",
  "libero",
];

interface TeamEditorProps {
  team: Team | null;
  onSaveTeam: (team: Team) => void;
  onCancel: () => void;
  isCreatingNew: boolean;
}

interface PlayerFormState {
  id: string;
  numberInput: string;
  name: string;
  primaryRole: PlayerRole;
}

const normalizePlayer = (player: Player): Player => ({
  ...player,
  number: Number(player.number) || 0,
});

const createEmptyPlayerForm = (): PlayerFormState => ({
  id: "",
  numberInput: "",
  name: "",
  primaryRole: "punta",
});

const createPlayerFormFromPlayer = (player: Player): PlayerFormState => ({
  id: player.id,
  numberInput: player.number > 0 ? String(player.number) : "",
  name: player.name,
  primaryRole: player.primaryRole,
});

export function TeamEditor({
  team,
  onSaveTeam,
  onCancel,
  isCreatingNew,
}: TeamEditorProps) {
  const [teamName, setTeamName] = useState(team?.name || "");
  const [teamColor, setTeamColor] = useState(team?.color || "#667eea");
  const [players, setPlayers] = useState<Player[]>(() =>
    (team?.players || []).map(normalizePlayer)
  );
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [newPlayer, setNewPlayer] = useState<PlayerFormState>(createEmptyPlayerForm);

  const handleAddPlayer = () => {
    const parsedNumber = Number.parseInt(newPlayer.numberInput, 10);

    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      alert("El numero es obligatorio");
      return;
    }

    const duplicatedNumber = players.some(
      (player, index) => player.number === parsedNumber && index !== editingPlayerIndex
    );

    if (duplicatedNumber) {
      alert("El numero ya existe");
      return;
    }

    const player: Player = {
      id: newPlayer.id || crypto.randomUUID(),
      number: parsedNumber,
      name: newPlayer.name.trim(),
      primaryRole: newPlayer.primaryRole,
    };

    if (editingPlayerIndex !== null) {
      const updated = [...players];
      updated[editingPlayerIndex] = player;
      setPlayers(updated);
      setEditingPlayerIndex(null);
    } else {
      setPlayers([...players, player]);
    }

    setNewPlayer(createEmptyPlayerForm());
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleEditPlayer = (index: number) => {
    setNewPlayer(createPlayerFormFromPlayer(players[index]));
    setEditingPlayerIndex(index);
  };

  const handleSave = () => {
    const normalizedTeamName = teamName.trim();

    if (!normalizedTeamName) {
      alert("El nombre del equipo es obligatorio");
      return;
    }

    if (players.length < 6) {
      alert("El equipo necesita al menos 6 jugadores");
      return;
    }

    const updatedTeam: Team = {
      id: team?.id || crypto.randomUUID(),
      name: normalizedTeamName,
      players: players.map(normalizePlayer),
      color: teamColor,
      createdAt: team?.createdAt || Date.now(),
    };

    onSaveTeam(updatedTeam);
  };

  return (
    <div className="team-editor">
      <h3>{isCreatingNew ? "Crear Nuevo Equipo" : "Editar Equipo"}</h3>

      <div className="team-config">
        <div className="form-group">
          <label>Nombre del Equipo</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ej: Equipo A"
          />
        </div>

        <div className="form-group">
          <label>Color del Uniforme</label>
          <div className="color-picker">
            <input
              type="color"
              value={teamColor}
              onChange={(e) => setTeamColor(e.target.value)}
            />
            <div className="color-preview" style={{ background: teamColor }} />
          </div>
        </div>
      </div>

      <div className="players-section">
        <h4>Jugadores ({players.length})</h4>

        <div className="player-input">
          <div className="input-row">
            <input
              type="number"
              min="1"
              max="99"
              value={newPlayer.numberInput}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, numberInput: e.target.value })
              }
              placeholder="Nro"
              className="number-input"
            />
            <input
              type="text"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              placeholder="Nombre (opcional)"
              className="name-input"
            />
            <select
              value={newPlayer.primaryRole}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, primaryRole: e.target.value as PlayerRole })
              }
            >
              {PLAYER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              className="add-btn"
              onClick={handleAddPlayer}
            >
              {editingPlayerIndex !== null ? "Guardar" : "+ Agregar"}
            </button>
            {editingPlayerIndex !== null && (
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditingPlayerIndex(null);
                  setNewPlayer(createEmptyPlayerForm());
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.id} className="player-item">
              <div className="player-badge">#{player.number}</div>
              <div className="player-info">
                <p className="name">{player.name || "Sin nombre"}</p>
                <p className="role">{player.primaryRole}</p>
              </div>
              <div className="player-actions">
                <button className="edit-btn" onClick={() => handleEditPlayer(index)}>
                  Editar
                </button>
                <button className="delete-btn" onClick={() => handleRemovePlayer(index)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="cancel-btn" onClick={onCancel}>
          Cancelar
        </button>
        <button className="save-btn" onClick={handleSave}>
          Guardar Equipo
        </button>
      </div>
    </div>
  );
}
