"use client";

import { Court } from "@/components/Court/Court";
import { StatsPanel } from "@/components/Stats/StatsPanel";
import { Stats } from "@/components/Stats/Stats";
import { useGameStats } from "@/hooks/useGameStats";
import { useGameTrajectories } from "@/hooks/useGameTrajectories";

export default function Page() {
  const { trajectories, addTrajectory, resetGame: resetTrajectories } = useGameTrajectories();
  const { stats, addAttack, toggleMode, resetGame: resetStats } = useGameStats(trajectories.own, trajectories.opponent);

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

      {/* <StatsPanel stats={stats} /> */}
      <Stats trajectories={trajectories.own} />
    </>
  );
}
