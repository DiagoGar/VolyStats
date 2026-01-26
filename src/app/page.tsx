"use client";

import { Court } from "@/components/Court/Court";
import { StatsPanel } from "@/components/Stats/StatsPanel";
import { Stats } from "@/components/Stats/Stats";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories } from "@/hooks/useGameTrajectories";

export default function Page() {
  const { stats, addAttack, toggleMode, resetGame } = useGameStats();
  const { trajectories, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();

  return (
    <>
      <Court
        stats={stats}
        trajectories={trajectories}
        onAttack={addAttack}
        onToggleMode={toggleMode}
        onReset={() => {
          resetGame();
          resetTrajectories();
        }}
        onSpikeDraw={addTrajectory}
      />

      {/* <StatsPanel stats={stats} /> */}
      {/* <Stats trajectories={trajectories.own} /> */}
    </>
  );
}
