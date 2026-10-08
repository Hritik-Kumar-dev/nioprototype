import { hashString } from "./rng";
import { costUsd, FRONTIER, latencyMs, workers, type Tier, type Worker } from "./workers";

export type Signal = {
  id: string;
  label: string;
  detail: string;
  /** Points added to the difficulty score. Negative pulls it down. */
  weight: number;
};

export type Classification = {
  tier: Tier;
  /** 0..100 difficulty score. */
  score: number;
  /** 0..1, grows with distance from the nearest tier boundary. */
  confidence: number;
  signals: Signal[];
  inputTokens: number;
  outputTokens: number;
};

export const MEDIUM_FROM = 24;
export const HARD_FROM = 50;

const REASONING =
  /\b(analy[sz]e|compare|design|prove|optimi[sz]e|plan|strategy|trade-?offs?|evaluate|recommend|derive|architect|diagnose|forecast|root cause|step by step|migrate)\w*/gi;
const EXPLAIN = /\b(explain|how (does|do|can)|why|what are|summari[sz]e|describe|difference between|benefits?|pros and cons)\b/i;
const CODE = /```|\b(function|class|regex|sql|typescript|python|stack trace|segfault|refactor|api endpoint|kubernetes|dockerfile)\b/i;
const MATH = /\b(integral|derivative|probability|theorem|equation|matrix|eigen)\w*/i;
const SMALL_TALK = /^\s*(hi+|hello+|hey|yo|thanks|thank you|good (morning|evening))\b/i;
const ARITHMETIC = /^\s*(what\s+is\s+)?-?\d+(\.\d+)?\s*[+\-*/x×]\s*-?\d+(\.\d+)?\s*\??\s*$/i;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function tierOf(score: number): Tier {
  if (score >= HARD_FROM) return "hard";
  if (score >= MEDIUM_FROM) return "medium";
  return "easy";
}

const OUTPUT_RANGE: Record<Tier, readonly [number, number]> = {
  easy: [40, 140],
  medium: [260, 520],
  hard: [900, 1700],
};

export function classifyPrompt(prompt: string): Classification {
  const text = prompt.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const signals: Signal[] = [];

  const lengthPts = Math.round(clamp(words / 60, 0, 1) * 20);
  if (lengthPts > 0) {
    signals.push({ id: "length", label: "Prompt length", detail: `${words} words`, weight: lengthPts });
  }

  const reasoning = text.match(REASONING) ?? [];
  const unique = [...new Set(reasoning.map((w) => w.toLowerCase()))];
  if (unique.length > 0) {
    signals.push({
      id: "reasoning",
      label: "Reasoning verbs",
      detail: unique.slice(0, 3).join(", "),
      weight: Math.min(40, unique.length * 14),
    });
  }

  if (EXPLAIN.test(text)) {
    signals.push({ id: "explain", label: "Needs an explanation", detail: "open-ended question", weight: 26 });
  }

  if (CODE.test(text)) {
    signals.push({ id: "code", label: "Code or infrastructure", detail: "technical content", weight: 24 });
  }

  if (MATH.test(text)) {
    signals.push({ id: "math", label: "Formal math", detail: "symbolic reasoning", weight: 20 });
  }

  const parts = Math.max(0, (text.match(/\?/g)?.length ?? 0) - 1) + (text.match(/\b(and then|also|after that|as well as)\b|\band\b(?=.*\b(recommend|plan|compare|build|write))/gi)?.length ?? 0);
  if (parts > 0) {
    signals.push({ id: "multi", label: "Multiple asks", detail: `${parts + 1} parts`, weight: Math.min(16, parts * 8) });
  }

  if (SMALL_TALK.test(text) || ARITHMETIC.test(text) || words <= 2) {
    signals.push({
      id: "trivial",
      label: ARITHMETIC.test(text) ? "Simple arithmetic" : "Short and direct",
      detail: "answerable in one hop",
      weight: -20,
    });
  }

  const score = clamp(
    signals.reduce((sum, s) => sum + s.weight, 0),
    0,
    100,
  );
  const tier = tierOf(score);
  const boundaryGap = Math.min(
    ...[MEDIUM_FROM, HARD_FROM].map((edge) => Math.abs(score - edge)),
  );
  const confidence = clamp(0.58 + boundaryGap / 45, 0.58, 0.97);

  const [lo, hi] = OUTPUT_RANGE[tier];
  const jitter = (hashString(text) % 1000) / 1000;
  const inputTokens = Math.max(4, Math.round(words * 1.35));
  const outputTokens = Math.round(lo + (hi - lo) * jitter);

  return { tier, score, confidence, signals, inputTokens, outputTokens };
}

export type Candidate = {
  worker: Worker;
  /** 0..1, how well this worker fits the prompt for the price. */
  fit: number;
  costUsd: number;
  latencyMs: number;
  quality: number;
  chosen: boolean;
};

/** Share of tokens NIO keeps after trimming context and reusing cached prefixes. */
const INPUT_KEEP: Record<Tier, number> = { easy: 0.55, medium: 0.7, hard: 0.85 };
/** Routed workers answer more tightly than the frontier model's default verbosity. */
const OUTPUT_KEEP: Record<Tier, number> = { easy: 0.7, medium: 0.85, hard: 0.95 };
/** Quality below this is not good enough to answer the prompt. */
const QUALITY_FLOOR = 0.85;

export type Routing = {
  prompt: string;
  classification: Classification;
  candidates: Candidate[];
  chosen: Candidate;
  without: Outcome;
  with: Outcome;
};

export type Outcome = {
  worker: Worker;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  quality: number;
};

function outcomeFor(worker: Worker, tier: Tier, inputTokens: number, outputTokens: number): Outcome {
  return {
    worker,
    inputTokens,
    outputTokens,
    costUsd: costUsd(worker, inputTokens, outputTokens),
    latencyMs: latencyMs(worker, outputTokens),
    quality: worker.quality[tier],
  };
}

export function routePrompt(prompt: string): Routing {
  const classification = classifyPrompt(prompt);
  const { tier } = classification;
  const inTokens = Math.round(classification.inputTokens * INPUT_KEEP[tier]);
  const outTokens = Math.round(classification.outputTokens * OUTPUT_KEEP[tier]);

  const scored = workers.map((worker) => {
    const quality = worker.quality[tier];
    const cost = costUsd(worker, inTokens, outTokens);
    const latency = latencyMs(worker, outTokens);
    const qualified = quality >= QUALITY_FLOOR;
    // Qualified workers always outrank unqualified ones. Among them, cheaper and faster wins.
    const value = 1 / (1 + cost * 4000 + latency / 900);
    return { worker, quality, costUsd: cost, latencyMs: latency, fit: qualified ? 0.2 + 0.8 * value : 0.2 * value };
  });

  const best = scored.reduce((a, b) => (b.fit > a.fit ? b : a));
  const candidates = scored.map((c) => ({ ...c, chosen: c.worker.id === best.worker.id }));
  const chosen = candidates.find((c) => c.chosen) ?? candidates[0];

  return {
    prompt: prompt.trim(),
    classification,
    candidates,
    chosen,
    without: outcomeFor(FRONTIER, tier, classification.inputTokens, classification.outputTokens),
    with: outcomeFor(chosen.worker, tier, inTokens, outTokens),
  };
}

export const EXAMPLE_PROMPTS: Record<Tier, string> = {
  easy: "What is 18 * 24?",
  medium: "Explain the benefits of PMFBY crop insurance for small farmers",
  hard: "Analyze 5 years of crop-yield data, compare irrigation strategies and recommend a plan, then design the sensor rollout",
};
