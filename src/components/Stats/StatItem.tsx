interface Props {
  label: string;
  value: string | number;
}

export function StatItem({ label, value }: Props) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}
