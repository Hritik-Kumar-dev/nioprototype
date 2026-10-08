import { createRng, weightedPercentile, type Rng } from "./rng";

export type PolicyId = "round-robin" | "shortest-queue" | "least-loaded" | "priority" | "learned";
export type Traffic = "balanced" | "burst" | "heavy-tail";

export const POLICIES: Record<PolicyId, { label: string; blurb: string }> = {
  "round-robin": { label: "Round robin", blurb: "Takes turns. Ignores everything else." },
  "shortest-queue": { label: "Shortest queue", blurb: "Picks the worker with the fewest waiting jobs." },
  "least-loaded": { label: "Least loaded", blurb: "Picks the worker with the least pending work." },
  priority: { label: "Priority aware", blurb: "Keeps fast workers free for urgent requests." },
  learned: { label: "NIO learned", blurb: "Predicts finish time per worker from past traces." },
};

export const TRAFFIC: Record<Traffic, string> = {
  balanced: "Balanced",
  burst: "Bursty",
  "heavy-tail": "Heavy tail",
};

/** Relative speed of each worker. One of them is slow on purpose. */
const SPEEDS = [1, 1, 1.6, 2.4, 0.55] as const;
const SLA_S = 6;
const REQUESTS = 900;

type Job = { at: number; work: number; urgent: boolean; predicted: number };

function makeJobs(traffic: Traffic, rng: Rng): Job[] {
  const jobs: Job[] = [];
  let at = 0;
  for (let i = 0; i < REQUESTS; i++) {
    const inBurst = traffic === "burst" && i % 300 >= 100 && i % 300 < 200;
    const gap = rng.exp(inBurst ? 0.1 : traffic === "burst" ? 0.3 : traffic === "heavy-tail" ? 0.4 : 0.22);
    at += gap;
    const heavy = traffic === "heavy-tail" && rng.next() < 0.08;
    const work = heavy ? rng.range(5, 11) : rng.range(0.4, 1.9);
    jobs.push({ at, work, urgent: rng.next() < 0.15, predicted: work * rng.range(0.88, 1.12) });
  }
  return jobs;
}

type WorkerState = { speed: number; freeAt: number; pending: Array<{ end: number; work: number }> };

type Chooser = (workers: WorkerState[], job: Job, turn: number) => number;

function argmin(workers: WorkerState[], score: (w: WorkerState, i: number) => number) {
  let best = 0;
  let bestScore = Infinity;
  workers.forEach((w, i) => {
    const s = score(w, i);
    if (s < bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}

const active = (w: WorkerState, now: number) => w.pending.filter((p) => p.end > now);
const eta = (w: WorkerState, job: Job, size: number) => Math.max(job.at, w.freeAt) + size / w.speed;

const choosers: Record<PolicyId, Chooser> = {
  "round-robin": (ws, _job, turn) => turn % ws.length,
  "shortest-queue": (ws, job) => argmin(ws, (w) => active(w, job.at).length),
  "least-loaded": (ws, job) =>
    argmin(ws, (w) => active(w, job.at).reduce((sum, p) => sum + p.work, 0)),
  priority: (ws, job) => {
    const fastest = ws.reduce((best, w, i) => (w.speed > ws[best].speed ? i : best), 0);
    if (job.urgent) return argmin(ws, (w) => eta(w, job, job.work));
    return argmin(ws, (w, i) =>
      i === fastest && w.freeAt > job.at ? Infinity : active(w, job.at).length * 10 + (1 / w.speed),
    );
  },
  learned: (ws, job) => {
    const fastest = ws.reduce((best, w, i) => (w.speed > ws[best].speed ? i : best), 0);
    return argmin(ws, (w, i) => eta(w, job, job.predicted) + (!job.urgent && i === fastest ? 0.1 : 0));
  },
};

export type PolicyResult = {
  id: PolicyId;
  mean: number;
  p95: number;
  p99: number;
  urgentP95: number;
  goodputPct: number;
  throughput: number;
};

export function runPolicy(id: PolicyId, traffic: Traffic, seed: number): PolicyResult {
  const jobs = makeJobs(traffic, createRng(seed));
  const ws: WorkerState[] = SPEEDS.map((speed) => ({ speed, freeAt: 0, pending: [] }));
  const choose = choosers[id];
  const latencies: Array<[number, number]> = [];
  const urgent: Array<[number, number]> = [];
  let lastEnd = 0;

  jobs.forEach((job, turn) => {
    const idx = choose(ws, job, turn);
    const w = ws[idx];
    const start = Math.max(job.at, w.freeAt);
    const duration = job.work / w.speed;
    const end = start + duration;
    w.freeAt = end;
    w.pending.push({ end, work: job.work });
    if (w.pending.length > 64) w.pending = w.pending.filter((p) => p.end > job.at);
    const latency = end - job.at;
    latencies.push([latency, 1]);
    if (job.urgent) urgent.push([latency, 1]);
    lastEnd = Math.max(lastEnd, end);
  });

  const mean = latencies.reduce((s, [l]) => s + l, 0) / latencies.length;
  const good = latencies.filter(([l]) => l <= SLA_S).length;

  return {
    id,
    mean,
    p95: weightedPercentile(latencies, 0.95),
    p99: weightedPercentile(latencies, 0.99),
    urgentP95: weightedPercentile(urgent, 0.95),
    goodputPct: (good / latencies.length) * 100,
    throughput: latencies.length / lastEnd,
  };
}

export const POLICY_ORDER = Object.keys(POLICIES) as PolicyId[];
export const SLA_SECONDS = SLA_S;
export const WORKER_SPEEDS = SPEEDS;

export function runAllPolicies(traffic: Traffic, seed: number) {
  return POLICY_ORDER.map((id) => runPolicy(id, traffic, seed));
}
