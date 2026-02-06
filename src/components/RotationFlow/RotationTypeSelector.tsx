// components/RotationFlow/RotationTypeSelector.tsx
/**
 * PHASE 2 - Paso 2: Seleccionar Tipo de Rotación
 * 
 * Hay 4 sistemas de rotación principales en voleibol:
 * - 5-1: Un setter (estándar profesional)
 * - 4-2: Dos setters (básico, iniciantes)
 * - 6-2: Dos setters (avanzado)
 * - 6-3: Tres setters (especializado)
 */

"use client";

import type { RotationType } from "@/types/rotation";

interface RotationTypeSelectorProps {
  selectedType: RotationType | null;
  onSelectType: (type: RotationType) => void;
}

const ROTATION_TYPES: Array<{
  type: RotationType;
  name: string;
  description: string;
  difficulty: "Iniciante" | "Intermedio" | "Avanzado";
  icon: string;
}> = [
  {
    type: "5-1",
    name: "Sistema 5-1",
    description:
      "Un único armador en rotación. Estándar en voleibol profesional. El setter en primera línea de ataque, en segunda defensa.",
    difficulty: "Avanzado",
    icon: "⚡",
  },
  {
    type: "4-2",
    name: "Sistema 4-2",
    description:
      "Dos armadores opuestos. El setter hace tiempo de defensa. Ideal para iniciar en voleibol.",
    difficulty: "Iniciante",
    icon: "📚",
  },
  {
    type: "6-2",
    name: "Sistema 6-2",
    description:
      "Dos setters (levantadores) que entran como zagueros y suben a primera línea. Sistema versátil.",
    difficulty: "Intermedio",
    icon: "🎯",
  },
  {
    type: "6-3",
    name: "Sistema 6-3",
    description:
      "Tres setters en el equipo. Variante del 6-2 para equipos especializados.",
    difficulty: "Avanzado",
    icon: "🚀",
  },
];

export function RotationTypeSelector({
  selectedType,
  onSelectType,
}: RotationTypeSelectorProps) {
  return (
    <div className="rotation-type-selector">
      <div className="rotation-header">
        <h3>🔄 Tipo de Rotación</h3>
        <p>Selecciona el sistema de rotación para tu equipo</p>
      </div>

      <div className="rotation-types-grid">
        {ROTATION_TYPES.map((rotationType) => (
          <div
            key={rotationType.type}
            className={`rotation-card ${selectedType === rotationType.type ? "selected" : ""}`}
            onClick={() => onSelectType(rotationType.type)}
          >
            <div className="rotation-icon">{rotationType.icon}</div>
            <div className="rotation-content">
              <h4>{rotationType.name}</h4>
              <p className="rotation-description">{rotationType.description}</p>
              <div className="rotation-meta">
                <span className="difficulty">{rotationType.difficulty}</span>
              </div>
            </div>
            {selectedType === rotationType.type && (
              <div className="selection-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="rotation-selected-info">
          <p>
            <strong>Sistema seleccionado:</strong>{" "}
            {ROTATION_TYPES.find((r) => r.type === selectedType)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
