import type { Zone } from "@/types/stats";
import { useLongPress } from "@/hooks/useLongPress";
import type { Player } from "@/types/volley-model";
import "./court.css";

interface Props {
  zone: Zone;
  value?: string | number;
  onClick: (zone: Zone) => void;
  onLongPress?: (zone: Zone) => void;
  disabled?: boolean;
  player?: Player | null;
}

export function ZoneButton({
  zone,
  value,
  onClick,
  onLongPress,
  disabled,
  player,
}: Props) {
  const handlers = useLongPress({
    onClick: () => !disabled && onClick(zone),
    onLongPress: () => {
      if (!disabled && onLongPress) {
        onLongPress(zone);
      }
    },
    delay: 500,
  });

  return (
    <div
      className={`zone ${disabled ? "disabled" : ""}`}
      {...handlers}
    >
      <div className="zone-label">Zona {zone}</div>
      {player && (
        <div className="player-name">{player.name}</div>
      )}
      {value !== undefined && (
        <div className="zone-value">{value}</div>
      )}
    </div>
  );
}
