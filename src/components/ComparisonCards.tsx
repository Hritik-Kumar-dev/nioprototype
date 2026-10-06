import { QualityGauge } from "./QualityGauge";
import { TrendChart } from "./TrendChart";
import { MetricList } from "./MetricList";
import { FeatureChip } from "./FeatureChip";
import {
  days,
  formatCount,
  nioAdvantage,
  pathRows,
  withNioFeatures,
  withoutNioFeatures,
  yTicks,
  yMax,
} from "../data/mock";
import type { FeatureSet, MetricRow, PathOutcome, QueryOutcome } from "../types";
import styles from "./ComparisonCards.module.css";

/* Build metric rows from a path outcome. */
function toRows(path: PathOutcome, modelId: string, nioStatus: string): MetricRow[] {
  return [...pathRows(path, modelId), { label: "NIO", value: nioStatus }];
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

/** Single compact comparison card (NIO / Without NIO). */
function Card({
  title,
  subtitle,
  dotColor,
  dotStyle,
  quality,
  rows,
  features,
  trend,
  tokenBadge,
}: {
  title: string;
  subtitle: string;
  dotColor: string;
  dotStyle: "ring" | "solid";
  quality: number;
  rows: MetricRow[];
  features: Array<{ name: string; enabled: boolean }>;
  trend: number[];
  tokenBadge: string;
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
        <span className={styles.badge}>{tokenBadge}</span>
      </div>

      {/* Metrics + sparkline + gauge, side by side */}
      <div className={styles.cardBody}>
        <div className={styles.metrics}>
          <MetricList rows={rows} />
        </div>
        <div className={styles.spark}>
          <h4 className={styles.sparkTitle}>Score trend</h4>
          <TrendChart
            data={trend}
            labels={days}
            yTicks={yTicks}
            yMax={yMax}
            showArea={true}
            areaOpacity={0.08}
            maxWidth={196}
            showLabels={false}
          />
        </div>
        <div className={styles.gauge}>
          <QualityGauge value={quality} size={88} label="QUALITY" />
        </div>
      </div>

      {/* Feature chips */}
      <div className={styles.chips} role="list" aria-label="Feature toggles">
        {features.map((f) => (
          <FeatureChip key={f.name} name={f.name} enabled={f.enabled} />
        ))}
      </div>
    </article>
  );
}

/** Side-by-side comparison cards with a headline showing NIO's advantage. */
export function ComparisonCards({ outcome }: { outcome: QueryOutcome }) {
  const adv = nioAdvantage(outcome);
  const { modelId, withNio, withoutNio } = outcome;

  return (
    <section className={styles.section} aria-labelledby="comparison-title">
      <h2 id="comparison-title" className={styles.visuallyHidden}>
        Execution path comparison
      </h2>

      <p className={styles.summary}>
        <span className={styles.summaryDot} aria-hidden="true" />
        For this {outcome.kindLabel.toLowerCase()}, NIO scores{" "}
        <strong>+{adv.scoreDeltaPct}%</strong> higher, adds{" "}
        <strong>+{adv.qualityDelta}</strong> quality points and uses{" "}
        <strong>{adv.tokenSavingsPct}% fewer tokens</strong> than the direct path.
      </p>

      <div className={styles.grid}>
        <Card
          title="NIO"
          subtitle="(Orchestrator)"
          dotColor="var(--green)"
          dotStyle="ring"
          quality={withNio.quality}
          rows={toRows(withNio, modelId, "Enabled")}
          features={toFeatures(withNioFeatures)}
          trend={withNio.trend}
          tokenBadge={`${formatCount(withNio.tokens)} tokens`}
        />
        <Card
          title="Without NIO"
          subtitle="(Direct to LLM)"
          dotColor="var(--text-muted)"
          dotStyle="solid"
          quality={withoutNio.quality}
          rows={toRows(withoutNio, modelId, "Disabled")}
          features={toFeatures(withoutNioFeatures)}
          trend={withoutNio.trend}
          tokenBadge={`${formatCount(withoutNio.tokens)} tokens`}
        />
      </div>
    </section>
  );
}
