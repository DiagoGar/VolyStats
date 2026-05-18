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
  onPlayerClick?: (zone: Zone, player: Player) => void;
}

export function ZoneButton({
  zone,
  value,
  onClick,
  onLongPress,
  disabled,
  player,
  onPlayerClick,
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
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="zone-label">Zona {zone}</div>
      {player && (
        <button
          type="button"
          className="player-name player-name-btn"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onPlayerClick?.(zone, player);
          }}
        >
          {player.name?.trim()
            ? player.name
            : typeof player.number === "number" && player.number > 0
              ? `#${player.number}`
              : "Sin asignar"}
        </button>
      )}
      {value !== undefined && (
        <div className="zone-value">{value}</div>
      )}
    </div>
  );
}
