import { useState } from "react";
import { exportData, importData } from "@/hooks/usePersistentStorage";
import type { GameTrajectories } from "@/hooks/useGameTrajectories";
import type { GameStats } from "@/hooks/useGameStats";

interface DataExportImportProps {
  trajectories: GameTrajectories;
  stats: any; // GameStats
  onImportTrajectories: (data: GameTrajectories) => void;
  onImportStats: (data: any) => void;
  onReset: () => void;
}

export function DataExportImport({
  trajectories,
  stats,
  onImportTrajectories,
  onImportStats,
  onReset,
}: DataExportImportProps) {
  const [importMessage, setImportMessage] = useState<string>("");

  const handleExportTrajectories = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportData(trajectories, `voley-stats-trajectories-${timestamp}.json`);
  };

  const handleExportStats = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportData(stats, `voley-stats-stats-${timestamp}.json`);
  };

  const handleExportAll = () => {
    const allData = { trajectories, stats, timestamp: new Date().toISOString() };
    const timestamp = new Date().toISOString().slice(0, 10);
    exportData(allData, `voley-stats-complete-${timestamp}.json`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importData<any>(file);
      if (!data) {
        setImportMessage("Error: archivo inválido");
        return;
      }

      // Detectar qué tipo de datos se importan
      if (data.trajectories && data.stats) {
        // Archivo completo
        onImportTrajectories(data.trajectories);
        onImportStats(data.stats);
        setImportMessage("✓ Datos completos importados exitosamente");
      } else if (data.own && data.opponent) {
        // Trayectorias
        onImportTrajectories(data);
        setImportMessage("✓ Trayectorias importadas exitosamente");
      } else {
        // Stats
        onImportStats(data);
        setImportMessage("✓ Estadísticas importadas exitosamente");
      }

      setTimeout(() => setImportMessage(""), 3000);
    } catch (err) {
      setImportMessage("Error al importar archivo");
    }
  };

  return (
    <section className="data-export-import">
      <h2>Gestión de Datos</h2>

      <div className="export-section">
        <h3>Exportar Datos</h3>
        <button onClick={handleExportTrajectories} className="export-btn">
          📥 Trayectorias
        </button>
        <button onClick={handleExportStats} className="export-btn">
          📥 Estadísticas
        </button>
        <button onClick={handleExportAll} className="export-btn primary">
          📥 Todo
        </button>
      </div>

      <div className="import-section">
        <h3>Importar Datos</h3>
        <label className="import-label">
          📤 Seleccionar archivo JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="import-input"
          />
        </label>
        {importMessage && <p className="import-message">{importMessage}</p>}
      </div>

      <div className="danger-section">
        <h3>Acciones Críticas</h3>
        <button
          className="danger-btn"
          onClick={() => {
            if (confirm("¿Estás seguro de que deseas borrar TODO? Esta acción no se puede deshacer.")) {
              onReset();
            }
          }}
        >
          🗑️ Borrar Todo
        </button>
      </div>
    </section>
  );
}
