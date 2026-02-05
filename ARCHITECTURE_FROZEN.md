/**
 * ARQUITECTURA ACTUAL (CONGELADA - NO MODIFICAR)
 * 
 * Flujo de Ataques y Estadísticas:
 * 
 * page.tsx (main entry)
 *   ├── Court (vista dual: propio vs contrario)
 *   │   ├── HalfCourt (cada mitad)
 *   │   │   ├── Zone.tsx (botones de zonas)
 *   │   │   ├── SpikeDraw.tsx (dibujar trayectorias)
 *   │   │   └── canvas (visualización de trayectorias)
 *   │   └── court.css (estilos)
 *   │
 *   ├── Stats (estadísticas avanzadas)
 *   │   ├── Por complejo (K1-K4)
 *   │   ├── Por rol (opuesto, punta, etc)
 *   │   ├── Por evaluación (#, ++, +, /, -, --)
 *   │   ├── Patrones direccionales (línea, diagonal, etc)
 *   │   └── Tasas de éxito
 *   │
 *   └── DataExportImport (persistencia)
 *       ├── localStorage (automático)
 *       └── JSON import/export
 *
 * Hooks (NO MODIFICAR):
 *   ├── useGameTrajectories
 *   │   ├── Guarda trayectorias por zona, equipo
 *   │   ├── Datos: zone, start, end, angle, complex, playerRole, evaluation
 *   │   └── Persistencia en localStorage
 *   │
 *   ├── useGameStats
 *   │   ├── Calcula estadísticas en vivo
 *   │   ├── Modos: cantidad vs porcentaje
 *   │   └── Persistencia en localStorage
 *   │
 *   └── usePersistentStorage
 *       ├── localStorage I/O
 *       └── JSON export/import
 *
 * Tipos (NO MODIFICAR):
 *   ├── types/spike.ts
 *   │   ├── Complex = 'K1' | 'K2' | 'K3' | 'K4'
 *   │   ├── PlayerRole = 'opuesto' | 'punta' | 'central' | 'armador' | 'libero' | 'zaguero'
 *   │   ├── Evaluation = '#' | '++' | '+' | '/' | '-' | '--'
 *   │   └── SpikeVector (vector de ataque completo)
 *   │
 *   └── types/stats.ts
 *       ├── Zone = 1 | 2 | 3 | 4 | 6
 *       └── MatchStats (stats agregadas)
 *
 * Funciones utilidad (NO MODIFICAR):
 *   ├── utils/spikeMath.ts
 *   │   ├── averageAngle()
 *   │   ├── angularDeviation()
 *   │   ├── calculateAngle()
 *   │   ├── createSpikeVector()
 *   │   ├── classifyDirection()
 *   │   └── directionPatterns
 *   │
 *   ├── utils/canvasUtils.ts
 *   │   ├── drawCourt()
 *   │   ├── drawLine()
 *   │   ├── drawPersistentTrajectories()
 *   │   ├── drawAngularFan()
 *   │   └── otros helpers de canvas
 *   │
 *   └── utils/calculations.ts
 *       └── calculatePercentage()
 *
 * Estado Global:
 *   ✓ SpikeVector[][][] (por zona, equipo)
 *   ✓ MatchStats (stats por equipo)
 *   ✓ Persistencia automática en localStorage
 *
 * GARANTÍAS DE CONGELACIÓN:
 *   ✔️ No modificar archivos .tsx/.ts de componentes actuales
 *   ✔️ No cambiar tipos en types/spike.ts ni types/stats.ts
 *   ✔️ No cambiar comportamiento de hooks
 *   ✔️ No tocar utils/ (excepto agregar nuevas funciones)
 *   ✔️ No modificar CSS existente (excepto agregar nuevas clases)
 * 
 * TODO LO NUEVO debe estar en:
 *   ├── src/types/rotation.ts (tipos de rotaciones)
 *   ├── src/types/team.ts (tipos de equipos)
 *   ├── src/hooks/useRotationSystem.ts (hook principal de rotaciones)
 *   ├── src/hooks/useTeamManagement.ts (gestión de equipos)
 *   ├── src/components/RotationFlow/ (componentes de rotaciones)
 *   └── src/app/match-setup.tsx (pantalla de setup)
 */

export const FROZEN_ARCHITECTURE = {
  description: "Arquitectura de ataques y estadísticas - CONGELADA",
  locked: true,
  reason: "Estabilidad y referencias de calidad",
  untouchable: [
    "src/components/Court/**",
    "src/components/Stats/**",
    "src/components/SpikeDraw/**",
    "src/components/Controls/**",
    "src/hooks/useGameTrajectories.ts",
    "src/hooks/useGameStats.ts",
    "src/types/spike.ts",
    "src/types/stats.ts",
    "src/utils/spikeMath.ts",
    "src/utils/canvasUtils.ts",
    "src/utils/calculations.ts",
  ],
};
