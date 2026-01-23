import type { Mode } from "@/types/stats";

interface Props {
  mode: Mode;
  onToggle: () => void;
}

export function ModeToggle({ mode, onToggle }: Props) {
  return (
    <button onClick={onToggle}>
      Modo: {mode}
    </button>
  );
}
