import { QualityGauge } from "./QualityGauge";
import { TrendChart } from "./TrendChart";
import { MetricList } from "./MetricList";
import { FeatureChip } from "./FeatureChip";
import { withNio, withoutNio, days, yTicks, yMax } from "../data/mock";
import type { MetricRow, FeatureSet } from "../types";
import styles from "./ComparisonCards.module.css";

/* Build metric rows from PathMetrics. */
function toRows(path: typeof withNio): MetricRow[] {
  return [
    { label: "Model", value: path.model },
    { label: "Response time", value: path.responseTime },
    { label: "Score", value: String(path.score) },
    { label: "NIO", value: path.nioStatus },
  ];
}

/* Feature array from FeatureSet for FeatureChip mapping. */
function toFeatures(features: FeatureSet): Array<{ name: string; enabled: boolean }> {
  return [
    { name: "RAG", enabled: features.rag },
    { name: "Tools", enabled: features.tools },
    { name: "Guardrails", enabled: features.guardrails },
    { name: "Cache", enabled: features.cache },
  ];
}

/**
 * Single comparison card (NIO / Without NIO).
 */
function Card({
  title,
  subtitle,
  dotColor,
  dotStyle,
  quality,
  rows,
  features,
  trend,
}: {
  title: string;
  subtitle: string;
  dotColor: string;
  dotStyle: "ring" | "solid";
  quality: number;
  rows: MetricRow[];
  features: Array<{ name: string; enabled: boolean }>;
  trend: number[];
}) {
  return (
    <article className={styles.card} aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <span
          className={`${styles.dot} ${dotStyle}`}
          style={{ background: dotColor, borderColor: dotColor }}
          aria-hidden="true"
        />
        <div className={styles.titles}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardSubtitle}>{subtitle}</p>
        </div>
      </div>

      {/* Metrics + gauge row */}
      <div className={styles.metricsRow}>
        <div className={styles.metricsLeft}>
          <MetricList rows={rows} />
        </div>
        <div className={styles.metricsGauge} aria-hidden="true">
          <QualityGauge value={quality} size={90} label="QUALITY" />
        </div>
      </div>

      {/* Feature chips */}
      <div className={styles.chips} role="list" aria-label="Feature toggles">
        {features.map((f) => (
          <FeatureChip key={f.name} name={f.name} enabled={f.enabled} />
        ))}
      </div>

      {/* Inner trend chart */}
      <div className={styles.innerChart}>
        <h4 className={styles.innerChartTitle}>Response Score Trend</h4>
        <TrendChart data={trend} labels={days} yTicks={yTicks} yMax={yMax} />
      </div>
    </article>
  );
}

/** Side-by-side comparison cards. */
export function ComparisonCards() {
  return (
    <section className={styles.section} aria-labelledby="comparison-title">
      <h2 id="comparison-title" className={styles.visuallyHidden}>
        Execution path comparison
      </h2>

      <div className={styles.grid}>
        <Card
          title="NIO"
          subtitle="Orchestrator"
          dotColor="var(--green)"
          dotStyle="ring"
          quality={withNio.quality}
          rows={toRows(withNio)}
          features={toFeatures(withNio.features)}
          trend={withNio.trend}
        />
        <Card
          title="Without NIO"
          subtitle="Direct to LLM"
          dotColor="var(--text-muted)"
          dotStyle="solid"
          quality={withoutNio.quality}
          rows={toRows(withoutNio)}
          features={toFeatures(withoutNio.features)}
          trend={withoutNio.trend}
        />
      </div>
    </section>
  );
}