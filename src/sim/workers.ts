export type Tier = "easy" | "medium" | "hard";

export type Worker = {
  id: string;
  name: string;
  model: string;
  host: "self-hosted" | "provider";
  /** Difficulty this worker is the best value for. */
  tier: Tier;
  /** USD per million tokens. */
  inPerM: number;
  outPerM: number;
  /** Time to first token, and decode speed. */
  ttftMs: number;
  tokPerSec: number;
  /** 0..1 chance the answer is good enough, per difficulty. */
  quality: Record<Tier, number>;
};

export const TIERS = ["easy", "medium", "hard"] as const satisfies readonly Tier[];

export const workers = [
  {
    id: "edge-8b",
    name: "Edge pool",
    model: "Llama 3.1 8B",
    host: "self-hosted",
    tier: "easy",
    inPerM: 0.05,
    outPerM: 0.15,
    ttftMs: 220,
    tokPerSec: 160,
    quality: { easy: 0.96, medium: 0.7, hard: 0.35 },
  },
  {
    id: "mid-70b",
    name: "Core pool",
    model: "Llama 3.3 70B",
    host: "self-hosted",
    tier: "medium",
    inPerM: 0.4,
    outPerM: 0.5,
    ttftMs: 520,
    tokPerSec: 78,
    quality: { easy: 0.98, medium: 0.91, hard: 0.66 },
  },
  {
    id: "sonnet",
    name: "Reasoning API",
    model: "Claude Sonnet",
    host: "provider",
    tier: "hard",
    inPerM: 3,
    outPerM: 15,
    ttftMs: 780,
    tokPerSec: 84,
    quality: { easy: 0.99, medium: 0.96, hard: 0.87 },
  },
  {
    id: "frontier",
    name: "Frontier API",
    model: "GPT-5.6",
    host: "provider",
    tier: "hard",
    inPerM: 5,
    outPerM: 20,
    ttftMs: 1150,
    tokPerSec: 55,
    quality: { easy: 0.99, medium: 0.98, hard: 0.95 },
  },
] as const satisfies readonly Worker[];

export type WorkerId = (typeof workers)[number]["id"];

/** What a team does today: every prompt goes to the biggest model. */
export const FRONTIER: Worker = workers[3];

export function costUsd(worker: Worker, inputTokens: number, outputTokens: number) {
  return (inputTokens * worker.inPerM + outputTokens * worker.outPerM) / 1_000_000;
}

export function latencyMs(worker: Worker, outputTokens: number) {
  return worker.ttftMs + (outputTokens / worker.tokPerSec) * 1000;
}

export const TIER_LABEL: Record<Tier, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
