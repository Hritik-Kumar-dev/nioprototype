import { useCountUp } from "../hooks";

export function CountUp({
  value,
  format,
  active,
  ms,
}: {
  value: number;
  format: (n: number) => string;
  active: boolean;
  ms?: number;
}) {
  const current = useCountUp(value, active, ms);
  return <span>{format(active ? current : 0)}</span>;
}
