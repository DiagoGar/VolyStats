interface Props {
  onReset: () => void;
}

export function ResetButton({ onReset }: Props) {
  return (
    <button onClick={onReset}>
      Reset
    </button>
  );
}
