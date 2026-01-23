export type Zone = 1 | 2 | 3 | 4 | 6;

export type Mode = "cantidad" | "porcentaje";

export interface MatchStats {
  zones: Record<Zone, number>;
  total: number;
  mode: Mode;
}

export interface SpikeTrajectory {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export type SpikeTrajectoriesByZone = {
  [zone: number]: SpikeTrajectory[];
};

