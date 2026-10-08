import { createRng, weightedPercentile } from "./rng";
import { costUsd, FRONTIER, workers, type Tier } from "./workers";

export type Scenario = "steady" | "burst" | "surge";

export const SCENARIOS: Record<Scenario, { label: string; blurb: string }> = {
  steady: { label: "Steady", blurb: "20 requests per second, all minute." },
  burst: { label: "5x burst", blurb: "Traffic jumps 5x for 20 seconds, then drops." },
  surge: { label: "Sustained surge", blurb: "Traffic climbs to 4x and stays there." },
};

export const DURATION_S = 60;
const BASE_RPS = 20;
const MIX: Record<Tier, number> = { easy: 0.55, medium: 0.3, hard: 0.15 };
/** Average tokens per request the direct path sends to the frontier model. */
const DIRECT_TOKENS = { input: 900, output: 520 };

function multiplier(scenario: Scenario, t: number) {
  if (scenario === "steady") return 1;
  if (scenario === "burst") {
    if (t < 14 || t >= 34) return 1;
    const ramp = Math.min(1, (t - 14) / 2, (34 - t) / 2);
    return 1 + 4 * Math.max(0.2, ramp);
  }
  return 1 + 3 * Math.min(1, Math.max(0, (t - 12) / 14));
}

type Pool = {
  tier: Tier;
  serviceS: number;
  capPerReplica: number;
  maxReplicas: number;
  replicas: number;
  /** Replicas still booting, with the second they become ready. */
  booting: number[];
  queue: number;
};

export type BurstSecond = {
  t: number;
  rps: number;
  without: { p95: number; queue: number; dropped: number };
  with: { p95: number; queue: number; dropped: number; replicas: number; downgraded: number };
};

export type BurstResult = {
  seconds: BurstSecond[];
  summary: {
    without: RunSummary;
    with: RunSummary;
  };
};

export type RunSummary = {
  p95: number;
  droppedPct: number;
  peakQueue: number;
  costUsd: number;
  peakReplicas: number;
};

const POD_BOOT_S = 6;
const TIMEOUT_S = 20;

function makePools(): Pool[] {
  return [
    { tier: "easy", serviceS: 0.4, capPerReplica: 45, maxReplicas: 6, replicas: 1, booting: [], queue: 0 },
    { tier: "medium", serviceS: 1, capPerReplica: 16, maxReplicas: 6, replicas: 1, booting: [], queue: 0 },
    { tier: "hard", serviceS: 2.4, capPerReplica: 9, maxReplicas: 6, replicas: 1, booting: [], queue: 0 },
  ];
}

export function runBurst(scenario: Scenario, seed = 7): BurstResult {
  const rng = createRng(seed);
  const directCap = 24;
  const directService = 3.2;
  let directQueue = 0;

  const pools = makePools();
  const seconds: BurstSecond[] = [];
  const withSamples: Array<[number, number]> = [];
  const withoutSamples: Array<[number, number]> = [];

  let withoutServed = 0;
  let withoutDropped = 0;
  let withoutPeakQ = 0;
  let withDropped = 0;
  let withPeakQ = 0;
  let peakReplicas = 1;
  let withCost = 0;

  const tierWorker = {
    easy: workers[0],
    medium: workers[1],
    hard: workers[2],
  } as const;
  const directCost = costUsd(FRONTIER, DIRECT_TOKENS.input, DIRECT_TOKENS.output);
  const tierCost = {
    easy: costUsd(tierWorker.easy, DIRECT_TOKENS.input * 0.55, DIRECT_TOKENS.output * 0.7),
    medium: costUsd(tierWorker.medium, DIRECT_TOKENS.input * 0.7, DIRECT_TOKENS.output * 0.85),
    hard: costUsd(tierWorker.hard, DIRECT_TOKENS.input * 0.85, DIRECT_TOKENS.output * 0.95),
  };

  for (let t = 0; t < DURATION_S; t++) {
    const rps = Math.round(BASE_RPS * multiplier(scenario, t) * rng.range(0.94, 1.06));

    // Direct path: one frontier pool, fixed size, no overflow plan.
    directQueue += rps;
    const served = Math.min(directQueue, directCap);
    directQueue -= served;
    const maxQ = directCap * TIMEOUT_S;
    const dropped = Math.max(0, directQueue - maxQ);
    directQueue -= dropped;
    withoutServed += served;
    withoutDropped += dropped;
    withoutPeakQ = Math.max(withoutPeakQ, directQueue);
    const directLatency = directService + directQueue / directCap;
    withoutSamples.push([directLatency, served]);

    // NIO path: tiered pools, autoscaling, and graceful downgrade on overflow.
    const demand: Record<Tier, number> = {
      easy: rps * MIX.easy,
      medium: rps * MIX.medium,
      hard: rps * MIX.hard,
    };
    let downgraded = 0;
    let droppedNow = 0;
    const order: Tier[] = ["hard", "medium", "easy"];
    let carry = 0;
    let secondP95Parts: Array<[number, number]> = [];

    for (const tier of order) {
      const pool = pools.find((p) => p.tier === tier);
      if (!pool) continue;

      pool.booting = pool.booting.filter((readyAt) => {
        if (readyAt <= t) {
          pool.replicas = Math.min(pool.maxReplicas, pool.replicas + 1);
          return false;
        }
        return true;
      });

      const cap = pool.replicas * pool.capPerReplica;
      pool.queue += demand[tier] + carry;
      carry = 0;

      // Overflow beyond three seconds of queue is moved one tier down.
      const overflowLimit = cap * 3;
      if (pool.queue > overflowLimit && tier !== "easy") {
        carry = pool.queue - overflowLimit;
        pool.queue = overflowLimit;
        downgraded += carry;
      }

      const poolServed = Math.min(pool.queue, cap);
      pool.queue -= poolServed;
      const poolDropped = Math.max(0, pool.queue - cap * TIMEOUT_S);
      pool.queue -= poolDropped;
      droppedNow += poolDropped;
      withCost += poolServed * tierCost[tier];

      // Autoscaler: aim for 65% utilisation, one replica per decision.
      const incoming = demand[tier] + pool.queue / 4;
      const desired = Math.min(pool.maxReplicas, Math.max(1, Math.ceil(incoming / (pool.capPerReplica * 0.65))));
      if (desired > pool.replicas + pool.booting.length) pool.booting.push(t + POD_BOOT_S);
      if (desired < pool.replicas && pool.queue < 1 && scenario !== "surge") pool.replicas -= 1;

      const lat = pool.serviceS + pool.queue / cap;
      secondP95Parts.push([lat, poolServed]);
      withSamples.push([lat, poolServed]);
    }

    withDropped += droppedNow;
    const totalQ = pools.reduce((s, p) => s + p.queue, 0);
    withPeakQ = Math.max(withPeakQ, totalQ);
    const replicas = pools.reduce((s, p) => s + p.replicas, 0);
    peakReplicas = Math.max(peakReplicas, replicas);

    seconds.push({
      t,
      rps,
      without: { p95: directLatency, queue: directQueue, dropped },
      with: {
        p95: weightedPercentile(secondP95Parts, 0.95),
        queue: totalQ,
        dropped: droppedNow,
        replicas,
        downgraded,
      },
    });
    secondP95Parts = [];
  }

  const total = (s: BurstSecond[]) => s.reduce((sum, x) => sum + x.rps, 0);
  const offered = total(seconds);

  return {
    seconds,
    summary: {
      without: {
        p95: weightedPercentile(withoutSamples, 0.95),
        droppedPct: (withoutDropped / offered) * 100,
        peakQueue: withoutPeakQ,
        costUsd: withoutServed * directCost,
        peakReplicas: 2,
      },
      with: {
        p95: weightedPercentile(withSamples, 0.95),
        droppedPct: (withDropped / offered) * 100,
        peakQueue: withPeakQ,
        costUsd: withCost,
        peakReplicas,
      },
    },
  };
}
