"use client";

import { Court } from "@/components/Court/Court";
import { StatsPanel } from "@/components/Stats/StatsPanel";
import { Stats } from "@/components/Stats/Stats";
import { DataExportImport } from "@/components/DataExportImport/DataExportImport";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories, type GameTrajectories } from "@/hooks/useGameTrajectories";
import { clearStorage, storageKeys } from "@/hooks/usePersistentStorage";
import "@/components/DataExportImport/dataExportImport.css";

export default function Page() {
  const { trajectories, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();
  const { stats, addAttack, toggleMode, resetGame: resetStats } = useGameStats(trajectories.own, trajectories.opponent);

  const handleResetAll = () => {
    resetStats();
    resetTrajectories();
    clearStorage(storageKeys.trajectories);
    clearStorage(storageKeys.stats);
  };

  const handleImportTrajectories = (data: GameTrajectories) => {
    // Lógica para importar trayectorias (se ejecutará a través de useEffect en el hook)
    // Por ahora simplemente notificamos
  };

  const handleImportStats = (data: any) => {
    // Lógica para importar stats
  };

  return (
    <>
      <Court
        stats={stats}
        trajectories={trajectories}
        onAttack={addAttack}
        onToggleMode={toggleMode}
        onReset={() => {
          resetStats();
          resetTrajectories();
        }}
        onSpikeDraw={addTrajectory}
      />

      <Stats trajectories={trajectories.own} />

      <DataExportImport
        trajectories={trajectories}
        stats={stats}
        onImportTrajectories={handleImportTrajectories}
        onImportStats={handleImportStats}
        onReset={handleResetAll}
      />
    </>
  );
}
