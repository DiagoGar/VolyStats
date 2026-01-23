import type { Zone } from "@/types/stats";
import { useLongPress } from "@/hooks/useLongPress";
import "./court.css";

interface Props {
  zone: Zone;
  value?: string | number;
  onClick: (zone: Zone) => void;
  onLongPress?: (zone: Zone) => void;
  disabled?: boolean;
}

export function ZoneButton({
  zone,
  value,
  onClick,
  onLongPress,
  disabled,
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
      {value !== undefined && (
        <div className="zone-value">{value}</div>
      )}
    </div>
  );
}
