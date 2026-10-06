/**
 * Shared types for the NIO orchestration comparison dashboard.
 *
 * NOTE: All data currently in src/data/mock.ts is PLACEHOLDER demo data.
 */

/** One metric row rendered by <MetricList rows={...} />. */
export interface MetricRow {
  /** Left-hand label, e.g. "Response time". */
  label: string;
  /** Right-hand value, e.g. "1.2s". Rendered verbatim. */
  value: string;
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

/**
 * An execution-path variant (With NIO / Without NIO).
 * All numeric fields are placeholders to be replaced with real evaluation output.
 */
export interface PathMetrics {
  model: string;
  responseTime: string;
  score: number;
  nioStatus: "Enabled" | "Disabled";
  /** 0–100. */
  quality: number;
  features: FeatureSet;
  /** Daily response-score values, same length and scale as every other trend. */
  trend: number[];
  /** Assistant reply paragraphs. */
  response: string[];
  /** Grounded-source pill labels (empty when orchestration is off). */
  sources: string[];
}

export interface TrendChartProps {
  data: number[];
  labels: string[];
  yTicks: [number, number, number, number];
  yMax: number;
}
