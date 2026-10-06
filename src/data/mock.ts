/**
 * ⚠️ PLACEHOLDER DATA — NOT REAL BENCHMARKS ⚠️
 *
 * Every number in this file is illustrative demo output for a product mockup.
 * The query → response mapping is a deterministic lookup (NOT a language
 * model): it recognises a few example prompts and otherwise falls back to a
 * canned reply per task size. Before publishing or presenting this dashboard,
 * replace each field with real evaluation results from your NIO orchestration
 * harness (response timings, scores, token counts and per-day trend series).
 */

import type {
  FeatureSet,
  ModelOption,
  PathId,
  PathOutcome,
  PathStats,
  QueryOutcome,
  QueryPreset,
  TaskKind,
} from "../types";

/** X-axis labels shared by all trend charts (Mon…Sun). */
export const days: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Shared Y-axis config for every chart so comparisons stay honest. */
export const yTicks: [number, number, number, number] = [0, 300, 600, 900];
export const yMax = 900;

/** The query loaded on first paint. */
export const DEFAULT_QUERY = "What are the benefits of PMFBY for small farmers?";

/** Feature chips: NIO orchestrates, the direct path does not. */
export const withNioFeatures: FeatureSet = {
  rag: true,
  tools: true,
  guardrails: true,
  cache: true,
};
export const withoutNioFeatures: FeatureSet = {
  rag: false,
  tools: false,
  guardrails: false,
  cache: false,
};

/* ------------------------------------------------------------------ */
/*  Models                                                             */
/* ------------------------------------------------------------------ */

/** Models selectable from the dashboard header. */
export const models: ModelOption[] = [
  {
    id: "sonnet 4.5",
    label: "sonnet 4.5",
    description: "Balanced default",
    costFactor: 1,
    qualityDelta: 0,
    scoreFactor: 1,
  },
  {
    id: "GPT-5.6",
    label: "GPT-5.6",
    description: "Highest reasoning",
    costFactor: 1.35,
    qualityDelta: 2,
    scoreFactor: 1.08,
  },
  {
    id: "GPT-4.1",
    label: "GPT-4.1",
    description: "Fastest & cheapest",
    costFactor: 0.72,
    qualityDelta: -4,
    scoreFactor: 0.9,
  },
];

export const modelIds: string[] = models.map((m) => m.id);

export function getModel(id: string): ModelOption {
  return models.find((m) => m.id === id) ?? models[0];
}

/* ------------------------------------------------------------------ */
/*  Per-task-kind metrics (placeholder values)                         */
/* ------------------------------------------------------------------ */

interface KindMetrics {
  label: string;
  baseline: PathStats;
  withNio: PathStats;
  withoutNio: PathStats;
}

const KIND_METRICS: Record<TaskKind, KindMetrics> = {
  simple: {
    label: "Simple task",
    baseline: { quality: 88, score: 402100, tokens: 1480, latencyMs: 1500, trend: [120, 90, 110, 80, 70, 90, 80] },
    withNio: { quality: 96, score: 786400, tokens: 340, latencyMs: 620, trend: [180, 140, 165, 125, 115, 135, 120] },
    withoutNio: { quality: 90, score: 438200, tokens: 1520, latencyMs: 1450, trend: [110, 80, 100, 70, 60, 80, 70] },
  },
  moderate: {
    label: "Moderate task",
    baseline: { quality: 80, score: 455542, tokens: 6200, latencyMs: 1800, trend: [850, 150, 70, 70, 110, 230, 230] },
    withNio: { quality: 92, score: 682410, tokens: 2450, latencyMs: 1100, trend: [830, 310, 250, 180, 310, 520, 600] },
    withoutNio: { quality: 76, score: 435542, tokens: 6900, latencyMs: 1800, trend: [830, 340, 190, 140, 170, 340, 310] },
  },
  heavy: {
    label: "Heavy task",
    baseline: { quality: 74, score: 512300, tokens: 15600, latencyMs: 4300, trend: [300, 420, 380, 500, 460, 540, 600] },
    withNio: { quality: 93, score: 824600, tokens: 5600, latencyMs: 2600, trend: [320, 470, 440, 560, 520, 640, 730] },
    withoutNio: { quality: 61, score: 498100, tokens: 16200, latencyMs: 5200, trend: [280, 360, 300, 410, 380, 430, 470] },
  },
};

/* ------------------------------------------------------------------ */
/*  Deterministic prompt → answer mapping                              */
/* ------------------------------------------------------------------ */

interface PathContent {
  response: string[];
  sources: string[];
}

interface ContentGroup {
  baseline: PathContent;
  withNio: PathContent;
  withoutNio: PathContent;
}

interface TaskPreset {
  id: string;
  chip: string;
  prompt: string;
  kind: TaskKind;
  match: RegExp;
  content: (query: string) => ContentGroup;
}

/** Percentage of tokens NIO saves on a task kind, vs. the direct path. */
export function savingsFor(kind: TaskKind): number {
  const { withNio, withoutNio } = KIND_METRICS[kind];
  return Math.round(
    ((withoutNio.tokens - withNio.tokens) / withoutNio.tokens) * 100
  );
}

/** Very small helpers so the templates below stay readable. */
function excerpt(query: string, max = 64): string {
  const trimmed = query.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function tryArithmetic(query: string) {
  const m = query
    .replace(/\s+/g, "")
    .match(/^(?:whatis|calculate|compute)?(-?\d+(?:\.\d+)?)([+\-*/x×])(-?\d+(?:\.\d+)?)$/i);
  if (!m) return null;

  const a = Number(m[1]);
  const b = Number(m[3]);
  const op = m[2];
  let value: number;
  if (op === "+") value = a + b;
  else if (op === "-") value = a - b;
  else if (op === "*" || op === "x" || op === "×") value = a * b;
  else if (b === 0) return null;
  else value = a / b;

  return { expression: `${a} ${op} ${b}`, value: Math.round(value * 1e6) / 1e6 };
}

function mathContent(query: string): ContentGroup {
  const parsed = tryArithmetic(query);
  const answer = parsed
    ? `${parsed.expression} = ${parsed.value}`
    : `Here is the result of "${excerpt(query)}".`;

  return {
    baseline: { response: [answer], sources: [] },
    withNio: {
      response: [
        answer,
        `Computed with the built-in calculator tool, so no large-model round-trip was needed — about ${savingsFor(
          "simple"
        )}% fewer tokens than the direct prompt.`,
      ],
      sources: [],
    },
    withoutNio: {
      response: [
        answer,
        "The model solved this directly, with no tools: every token was billed through the full model pass.",
      ],
      sources: [],
    },
  };
}

const TASK_PRESETS: TaskPreset[] = [
  {
    id: "hello",
    chip: "Hello",
    prompt: "Hello",
    kind: "simple",
    match: /^(hi+|hello+|hey|yo|hola|good (morning|afternoon|evening))\b/i,
    content: () => ({
      baseline: { response: ["Hello! How can I help you today?"], sources: [] },
      withNio: {
        response: [
          "Hello! 👋 I'm NIO — an orchestration layer that routes each request to the right model, tools and grounded sources.",
          "Ask me a greeting, a calculation, a summary or a multi-step analysis. This one was answered in a single low-cost hop.",
        ],
        sources: [],
      },
      withoutNio: {
        response: ["Hello! How can I help you today?"],
        sources: [],
      },
    }),
  },
  {
    id: "math",
    chip: "1 + 2",
    prompt: "1 + 2",
    kind: "simple",
    match: /^\s*(what\s+is\s+|calculate\s+|compute\s+)?-?\d+(\.\d+)?\s*([+\-*/x×])\s*-?\d+(\.\d+)?\s*\??\s*$/i,
    content: mathContent,
  },
  {
    id: "pmfby",
    chip: "PMFBY benefits",
    prompt: DEFAULT_QUERY,
    kind: "moderate",
    match: /pmfby|fasal bima|crop insurance|small farmers?/i,
    content: () => ({
      baseline: {
        response: [
          "PMFBY provides financial support to farmers when crops are lost to natural calamities, pests or diseases, and aims to stabilise farm income.",
        ],
        sources: [],
      },
      withNio: {
        response: [
          "PMFBY (Pradhan Mantri Fasal Bima Yojana) protects small farmers against crop loss from natural calamities, pests and diseases.",
          "It settles claims faster through a common service centre, cuts premium burden to a capped share of the sum insured, and reduces income risk so farmers can invest in better inputs.",
        ],
        sources: ["Scheme Details", "Official Source"],
      },
      withoutNio: {
        response: [
          "PMFBY provides financial support to farmers in case of crop loss due to natural calamities, pests or diseases. It helps with risk coverage and income stability, though this answer draws on the model's own memory rather than a cited source.",
        ],
        sources: [],
      },
    }),
  },
  {
    id: "heavy",
    chip: "Crop-yield analysis",
    prompt:
      "Analyze 5 years of crop-yield data and recommend an irrigation strategy",
    kind: "heavy",
    match: /analy[sz]e|research|forecast|optimi[sz]e|multi-?step|root cause|regression|roadmap|strategy|dataset|audit|benchmark/i,
    content: () => ({
      baseline: {
        response: [
          "A direct model pass can sketch an irrigation plan, but without data access or verification it cannot check the numbers against your yield records.",
        ],
        sources: [],
      },
      withNio: {
        response: [
          "I decomposed this into 4 sub-tasks and ran them with the right tool for each: (1) loaded and cleaned the 5-year yield records, (2) ran the trend and regression tools, (3) retrieved irrigation guidance from grounded sources, (4) cross-checked the result with a second model.",
          "Findings: yields in the irrigated cohort rose ~11% year over year, while the two lowest-yield districts trailed by 18%.",
          "Recommendation: move 30% of the water budget to those two districts, add soil-moisture sensors at 12 pilot sites, and re-forecast monthly.",
        ],
        sources: ["Agri Dataset v3", "Irrigation Handbook", "Regression Report"],
      },
      withoutNio: {
        response: [
          "A single model pass on a task this size typically returns a plausible-sounding plan with no data access, no tool use and no verification. Multi-step accuracy and citation quality fall sharply, and the answer is much more expensive in tokens because everything is generated in one long context.",
        ],
        sources: [],
      },
    }),
  },
];

/** Example prompts surfaced as chips inside the centre phone. */
export const presets: QueryPreset[] = TASK_PRESETS.map((p) => ({
  id: p.id,
  chip: p.chip,
  prompt: p.prompt,
  kind: p.kind,
}));

function classify(query: string): TaskKind {
  if (/analy[sz]e|research|forecast|optimi[sz]e|multi-?step|root cause|regression|roadmap|strategy|dataset|audit|benchmark/i.test(query)) {
    return "heavy";
  }
  if (/^(hi+|hello+|hey|yo|thanks|thank you)\b/i.test(query.trim()) || query.trim().length <= 12) {
    return "simple";
  }
  return "moderate";
}

function genericContent(query: string, kind: TaskKind): ContentGroup {
  const short = excerpt(query);

  if (kind === "simple") {
    return {
      baseline: { response: [`ChatGPT answered "${short}" directly.`], sources: [] },
      withNio: {
        response: [
          `"${short}" — resolved without orchestration overhead.`,
          "NIO classified this as a simple task and answered it in one fast, low-token hop instead of a full model pass.",
        ],
        sources: [],
      },
      withoutNio: {
        response: [
          `A direct answer to "${short}" from the model's own knowledge, with no retrieval, tools or caching.`,
        ],
        sources: [],
      },
    };
  }

  if (kind === "heavy") {
    return {
      baseline: { response: [`ChatGPT answered "${short}" in a single pass.`], sources: [] },
      withNio: {
        response: [
          `I split "${short}" into 4 sub-tasks and ran them in parallel, picking the right tool for each one.`,
          "1. Retrieved and cleaned the relevant data. 2. Ran the analysis tools. 3. Cross-checked the result with a second model. 4. Assembled a cited answer.",
          "Every step was verified against the guardrails before the answer was returned.",
        ],
        sources: ["Dataset", "Analysis Report", "Reference"],
      },
      withoutNio: {
        response: [
          `"${short}" — answered in one pass from the model's own knowledge, with no decomposition, tools or verification. Multi-step accuracy and citation quality drop sharply on tasks like this.`,
        ],
        sources: [],
      },
    };
  }

  return {
    baseline: { response: [`ChatGPT answered "${short}" directly.`], sources: [] },
    withNio: {
      response: [
        `I retrieved grounded context for "${short}", ranked and de-duplicated it, then composed a cited answer.`,
        "Key points: the top sources agreed on the main facts, and the guardrails rejected two low-quality passages before they reached the answer.",
      ],
      sources: ["Reference 1", "Reference 2"],
    },
    withoutNio: {
      response: [
        `"${short}" — answered from the model's own knowledge, with no retrieval step. Claims are therefore uncited and can drift on niche topics.`,
      ],
      sources: [],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Resolution                                                         */
/* ------------------------------------------------------------------ */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function buildPath(
  stats: PathStats,
  content: PathContent,
  model: ModelOption
): PathOutcome {
  return {
    quality: clamp(Math.round(stats.quality + model.qualityDelta), 0, 100),
    score: Math.round(stats.score * model.scoreFactor),
    tokens: Math.round(stats.tokens * model.costFactor),
    latencyMs: Math.round(stats.latencyMs * model.costFactor),
    trend: stats.trend,
    response: content.response,
    sources: content.sources,
  };
}

/**
 * Resolve a typed prompt into the three execution-path outcomes.
 * Deterministic: the same prompt + model always produce the same result.
 */
export function resolveQuery(rawInput: string, modelId: string): QueryOutcome {
  const query = rawInput.trim();
  const model = getModel(modelId);

  const preset = query ? TASK_PRESETS.find((p) => p.match.test(query)) : undefined;
  const kind = preset ? preset.kind : classify(query || "hello");
  const metrics = KIND_METRICS[kind];
  const content = preset ? preset.content(query) : genericContent(query || "Hello", kind);

  return {
    query: query || "Hello",
    kind,
    kindLabel: metrics.label,
    modelId: model.id,
    baseline: buildPath(metrics.baseline, content.baseline, model),
    withNio: buildPath(metrics.withNio, content.withNio, model),
    withoutNio: buildPath(metrics.withoutNio, content.withoutNio, model),
  };
}

/* ------------------------------------------------------------------ */
/*  Formatting + derived comparison numbers                            */
/* ------------------------------------------------------------------ */

export function formatLatency(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function tokenSavingsPct(withTokens: number, withoutTokens: number): number {
  if (withoutTokens <= 0) return 0;
  return Math.round(((withoutTokens - withTokens) / withoutTokens) * 100);
}

/** Headline numbers that show NIO's advantage for the current query. */
export function nioAdvantage(outcome: QueryOutcome): {
  tokenSavingsPct: number;
  qualityDelta: number;
  scoreDeltaPct: number;
} {
  return {
    tokenSavingsPct: tokenSavingsPct(outcome.withNio.tokens, outcome.withoutNio.tokens),
    qualityDelta: outcome.withNio.quality - outcome.withoutNio.quality,
    scoreDeltaPct: Math.round(
      ((outcome.withNio.score - outcome.withoutNio.score) /
        Math.max(1, outcome.withoutNio.score)) *
        100
    ),
  };
}

/** Metric rows for a path's spec list. */
export function pathRows(path: PathOutcome, modelId: string) {
  return [
    { label: "Model", value: modelId },
    { label: "Response time", value: formatLatency(path.latencyMs) },
    { label: "Tokens", value: formatCount(path.tokens) },
    { label: "Score", value: formatCount(path.score) },
  ];
}

/** Which paths are "with NIO" vs "without NIO" — used for feature chips. */
export const featuresFor: Record<PathId, FeatureSet | null> = {
  baseline: null,
  withNio: withNioFeatures,
  withoutNio: withoutNioFeatures,
};
