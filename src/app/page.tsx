"use client";

import { Court } from "@/components/Court/Court";
import { StatsPanel } from "@/components/Stats/StatsPanel";
import { useMatchStats } from "@/hooks/useMatchStats";
import { useSpikeTrajectories } from "@/hooks/useSpikeTrajectories";

export default function Page() {
  const { stats, addAttack, toggleMode, resetMatch } = useMatchStats();

  const { trajectories, addTrajectory, resetTrajectories } =
    useSpikeTrajectories();

  return (
    <>
      <Court
        stats={stats}
        onAttack={addAttack}
        onToggleMode={toggleMode}
        onReset={() => {
          resetMatch();
          resetTrajectories();
        }}
        onSpikeDraw={addTrajectory}
        spikeTrajectories={trajectories}
      />

      <StatsPanel stats={stats} />
    </>
  );
}
