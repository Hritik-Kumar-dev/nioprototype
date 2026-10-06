/**
 * ⚠️ PLACEHOLDER DATA — NOT REAL BENCHMARKS ⚠️
 *
 * Every number in this file is illustrative demo output for a product mockup.
 * Before publishing or presenting this dashboard, replace each field with real
 * evaluation results from your NIO orchestration harness (response timings,
 * scores, quality measurements and per-day trend series). Do not present these
 * values as measured performance.
 */

import type { PathMetrics, MetricRow } from "../types";

/** The single user query that flows through both execution paths. */
export const query =
  "What are the benefits of PMFBY for small farmers?";

/** Models available in the header / phone model dropdowns. */
export const models: string[] = ["sonnet 4.5", "GPT-5.6", "GPT-4.1"];

/** X-axis labels shared by all trend charts (Mon…Sun). */
export const days: string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/**
 * Top header panel (baseline Chat GPT view).
 * Placeholder values — swap with real evaluation output.
 */
export const baseline = {
  name: "Chat GPT",
  model: "sonnet 4.5",
  responseTime: "1.2s",
  score: 455542,
  nio: "—",
  /** 0–100. */
  quality: 80,
  trend: [850, 150, 70, 70, 110, 230, 230],
};

/**
 * "With NIO" execution path.
 * Placeholder values — swap with real evaluation output.
 */
export const withNio: PathMetrics = {
  model: "sonnet 4.5",
  responseTime: "1.1s",
  score: 682410,
  nioStatus: "Enabled",
  quality: 92,
  features: { rag: true, tools: true, guardrails: true, cache: true },
  trend: [830, 310, 250, 180, 310, 520, 600],
  response: [
    "PMFBY (Pradhan Mantri Fasal Bima Yojana) helps small farmers by providing financial protection against crop loss due to natural calamities, pests and diseases.",
    "It ensures faster claim settlement, reduces income risk and promotes farmers' confidence in agriculture.",
  ],
  sources: ["Scheme Details", "Official Source"],
};

/**
 * "Without NIO" execution path (direct to LLM).
 * Placeholder values — swap with real evaluation output.
 */
export const withoutNio: PathMetrics = {
  model: "sonnet 4.5",
  responseTime: "1.8s",
  score: 435542,
  nioStatus: "Disabled",
  quality: 76,
  features: { rag: false, tools: false, guardrails: false, cache: false },
  trend: [830, 340, 190, 140, 170, 340, 310],
  response: [
    "PMFBY provides financial support to farmers in case of crop loss due to natural calamities, pests or diseases. It helps with risk coverage and income stability.",
  ],
  sources: [],
};

/** Spec rows for the top header panel. */
export const baselineMetrics: MetricRow[] = [
  { label: "Model", value: baseline.model },
  { label: "Response time", value: baseline.responseTime },
  { label: "Score", value: String(baseline.score) },
  { label: "NIO", value: baseline.nio },
];

/** Shared Y-axis config for every chart so comparisons stay honest. */
export const yTicks: [number, number, number, number] = [0, 300, 600, 900];
export const yMax = 900;
