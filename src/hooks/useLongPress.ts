import { useRef } from "react";

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

  const start = () => {
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

    onPointerUp: () => {
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
