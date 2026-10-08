/** Small seeded PRNG (mulberry32) so every simulation is reproducible. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + (max - min) * next(),
    /** Exponentially distributed value with the given mean. */
    exp: (mean: number) => -Math.log(1 - next()) * mean,
  };
}

export type Rng = ReturnType<typeof createRng>;

/** Stable 32-bit hash of a string, used to derive per-prompt jitter. */
export function hashString(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Weighted percentile (p in 0..1) over [value, weight] samples. */
export function weightedPercentile(samples: ReadonlyArray<readonly [number, number]>, p: number) {
  const live = samples.filter(([, w]) => w > 0).sort((x, y) => x[0] - y[0]);
  const total = live.reduce((sum, [, w]) => sum + w, 0);
  if (total === 0) return 0;
  let acc = 0;
  for (const [value, weight] of live) {
    acc += weight;
    if (acc / total >= p) return value;
  }
  return live[live.length - 1][0];
}
