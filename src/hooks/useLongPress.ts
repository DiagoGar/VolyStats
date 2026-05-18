import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

interface LongPressOptions {
  onLongPress: () => void;
  onClick: () => void;
  delay?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
}: LongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const start = (event: PointerEvent) => {
    event.preventDefault();
    longPressTriggered.current = false;

    timeoutRef.current = setTimeout(() => {
      onLongPress();
      longPressTriggered.current = true;
    }, delay);
  };

  const clearTimeoutOnly = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return {
    onPointerDown: start,
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
    },

    onPointerUp: (event: PointerEvent) => {
      event.preventDefault();
      clearTimeoutOnly();

      if (!longPressTriggered.current) {
        onClick();
      }
    },

    onPointerLeave: () => {
      clearTimeoutOnly();
      longPressTriggered.current = true;
    },
  };
}
