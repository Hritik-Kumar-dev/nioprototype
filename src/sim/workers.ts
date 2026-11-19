export type Tier = "easy" | "medium" | "hard";

/** Whether the weights are downloadable or the model is only sold behind an API. */
export type Access = "closed" | "open-weights";

export type Worker = {
  id: string;
  model: string;
  vendor: string;
  access: Access;
  /** Difficulty this worker is the best value for. */
  tier: Tier;
  /** USD per million tokens, from the OpenRouter catalogue. */
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
    id: "opus-5.5",
    model: "Claude Opus 5.5",
    vendor: "Anthropic",
    access: "closed",
    tier: "hard",
    inPerM: 4,
    outPerM: 20,
    ttftMs: 780,
    tokPerSec: 85,
    quality: { easy: 0.99, medium: 0.98, hard: 0.96 },
  },
  {
    id: "sol-6.1",
    model: "GPT-6.1 Sol",
    vendor: "OpenAI",
    access: "closed",
    tier: "hard",
    inPerM: 2,
    outPerM: 10,
    ttftMs: 640,
    tokPerSec: 105,
    quality: { easy: 0.98, medium: 0.97, hard: 0.89 },
  },
  {
    id: "luna-6",
    model: "GPT-6 Luna",
    vendor: "OpenAI",
    access: "closed",
    tier: "medium",
    inPerM: 0.1,
    outPerM: 0.5,
    ttftMs: 240,
    tokPerSec: 210,
    quality: { easy: 0.8, medium: 0.93, hard: 0.78 },
  },
  {
    id: "kimi-k3.1",
    model: "Kimi K3.1 Pro",
    vendor: "Moonshot AI",
    access: "open-weights",
    tier: "medium",
    inPerM: 0.253,
    outPerM: 8.8,
    ttftMs: 520,
    tokPerSec: 92,
    quality: { easy: 0.95, medium: 0.92, hard: 0.86 },
  },
  {
    id: "deepseek-v4.1",
    model: "DeepSeek V4.1",
    vendor: "DeepSeek",
    access: "open-weights",
    tier: "easy",
    inPerM: 0.3,
    outPerM: 1.2,
    ttftMs: 300,
    tokPerSec: 150,
    quality: { easy: 0.97, medium: 0.91, hard: 0.8 },
  },
  {
    id: "glm-5.3",
    model: "GLM-5.3",
    vendor: "Z.ai",
    access: "open-weights",
    tier: "easy",
    inPerM: 0.0699,
    outPerM: 1.4,
    ttftMs: 270,
    tokPerSec: 170,
    quality: { easy: 0.96, medium: 0.84, hard: 0.72 },
  },
] as const satisfies readonly Worker[];

export type WorkerId = (typeof workers)[number]["id"];

/** What a team does today: every prompt goes to the biggest model. */
export const FRONTIER: Worker = workers[0];

/** Lowest quality that still counts as a good answer, per difficulty. */
export const QUALITY_FLOOR: Record<Tier, number> = { easy: 0.85, medium: 0.85, hard: 0.88 };

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

export const ACCESS_LABEL: Record<Access, string> = {
  closed: "closed",
  "open-weights": "open weights",
};
