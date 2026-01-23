import { StatItem } from "./StatItem";
import { calculatePercentage } from "@/utils/calculations";
import type { MatchStats, Zone } from "@/types/stats";

interface Props {
  stats: MatchStats;
}

export function StatsPanel({ stats }: Props) {
  const getValue = (zone: Zone) => {
    if (stats.mode === "cantidad") {
      return stats.zones[zone];
    }
    return `${calculatePercentage(stats.zones[zone], stats.total)}%`;
  };

  return (
    <section>
      <h2>Estadísticas</h2>

      <StatItem label="Total ataques" value={stats.total} />

      <StatItem label="Zona 1" value={getValue(1)} />
      <StatItem label="Zona 2" value={getValue(2)} />
      <StatItem label="Zona 3" value={getValue(3)} />
      <StatItem label="Zona 4" value={getValue(4)} />
      <StatItem label="Zona 6" value={getValue(6)} />
    </section>
  );
}
