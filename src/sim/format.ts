export function usd(value: number) {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function seconds(ms: number) {
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
}

export function secs(value: number) {
  return `${value.toFixed(value < 10 ? 1 : 0)}s`;
}

export function percent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function count(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

/** How much smaller `after` is than `before`, as a whole percent. */
export function reduction(before: number, after: number) {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}
