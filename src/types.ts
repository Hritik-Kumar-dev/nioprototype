/**
 * Shared types for the NIO orchestration comparison dashboard.
 *
 * NOTE: All numbers produced by src/data/mock.ts are PLACEHOLDER demo data.
 */

/** One metric row rendered by <MetricList rows={...} />. */
export interface MetricRow {
  /** Left-hand label, e.g. "Response time". */
  label: string;
  /** Right-hand value, e.g. "1.2s". Rendered verbatim. */
  value: string;
  /** Optional emphasis, e.g. tokens saved by NIO. */
  tone?: "default" | "good";
}

export interface PhoneMessage {
  id: string;
  role: "user" | "assistant";
  /** One or more paragraphs of the bubble text. */
  text: string[];
}

/** Feature toggles shown as chips (RAG / Tools / Guardrails / Cache). */
export interface FeatureSet {
  rag: boolean;
  tools: boolean;
  guardrails: boolean;
  cache: boolean;
}

/** Complexity bucket the deterministic demo asks each execution path to solve. */
export type TaskKind = "simple" | "moderate" | "heavy";

/** Numeric stats for one execution path. */
export interface PathStats {
  /** 0–100. */
  quality: number;
  score: number;
  /** Tokens consumed by the request. */
  tokens: number;
  latencyMs: number;
  /** Daily response-score values, same length and scale as every other trend. */
  trend: number[];
}

/** Numeric stats plus the rendered content for one execution path. */
export interface PathOutcome extends PathStats {
  /** Assistant reply paragraphs. */
  response: string[];
  /** Grounded-source pill labels (empty when orchestration is off). */
  sources: string[];
}

/** Everything the UI needs after a query has been resolved against a model. */
export interface QueryOutcome {
  /** The user query exactly as typed. */
  query: string;
  kind: TaskKind;
  /** Human-readable task label, e.g. "Heavy task". */
  kindLabel: string;
  /** Model that produced this outcome. */
  modelId: string;
  /** Direct ChatGPT baseline. */
  baseline: PathOutcome;
  /** With NIO orchestration. */
  withNio: PathOutcome;
  /** Without NIO (straight to the LLM). */
  withoutNio: PathOutcome;
}

/** A selectable model and how it shifts the demo numbers. */
export interface ModelOption {
  id: string;
  label: string;
  description: string;
  /** Multiplier applied to tokens + latency. */
  costFactor: number;
  /** Points added to the 0–100 quality score. */
  qualityDelta: number;
  /** Multiplier applied to the response score. */
  scoreFactor: number;
}

/** A clickable example prompt shown inside the centre phone. */
export interface QueryPreset {
  id: string;
  /** Short chip label. */
  chip: string;
  /** Full prompt inserted into the chat input. */
  prompt: string;
  kind: TaskKind;
}

export interface TrendChartProps {
  data: number[];
  labels: string[];
  yTicks: [number, number, number, number];
  yMax: number;
}
