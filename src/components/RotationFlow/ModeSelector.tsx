// components/RotationFlow/ModeSelector.tsx
/**
 * Pantalla inicial: selector de modo
 * Ataque vs Rotaciones
 */

"use client";

interface ModeSelectorProps {
  onSelectMode: (mode: "attack" | "rotation") => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="mode-selector-container">
      <h1>Volley Stats</h1>
      <p className="subtitle">Selecciona el modo de análisis</p>

      <div className="mode-buttons">
        <button
          className="mode-btn attack-mode"
          onClick={() => onSelectMode("attack")}
        >
          <span className="icon">⚡</span>
          <span className="label">Análisis de Ataques</span>
          <span className="description">
            Registra y analiza trayectorias, patrones y estadísticas
          </span>
        </button>

        <button
          className="mode-btn rotation-mode"
          onClick={() => onSelectMode("rotation")}
        >
          <span className="icon">🔄</span>
          <span className="label">Sistema de Rotaciones</span>
          <span className="description">
            Gestiona equipos, rotaciones y posicionamiento
          </span>
        </button>
      </div>

      <div className="info-section">
        <h3>ℹ️ Sobre esta app</h3>
        <p>Sistema completo de análisis y gestión de voleibol con:</p>
        <ul>
          <li>Registro detallado de ataques con contexto</li>
          <li>Estadísticas avanzadas y patrones</li>
          <li>Sistema de rotaciones automático</li>
          <li>Exportación e importación de datos</li>
        </ul>
      </div>
    </div>
  );
}
