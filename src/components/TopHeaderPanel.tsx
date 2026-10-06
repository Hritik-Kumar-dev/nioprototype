import { QualityGauge } from "./QualityGauge";
import { TrendChart } from "./TrendChart";
import { MetricList } from "./MetricList";
import { ModelDropdown } from "./ModelDropdown";
import { ChatIcon } from "./icons";
import { days, modelIds, pathRows, yTicks, yMax } from "../data/mock";
import type { QueryOutcome } from "../types";
import styles from "./TopHeaderPanel.module.css";

export interface TopHeaderPanelProps {
  outcome: QueryOutcome;
  modelId: string;
  onModelChange: (id: string) => void;
}

/** Direct ChatGPT baseline metrics for the current query. */
export function TopHeaderPanel({ outcome, modelId, onModelChange }: TopHeaderPanelProps) {
  const rows = [
    ...pathRows(outcome.baseline, modelId),
    { label: "NIO", value: "—" },
  ];

  return (
    <header className={styles.panel} aria-labelledby="header-title">
      <h1 id="header-title" className={styles.visuallyHidden}>
        Chat GPT baseline metrics
      </h1>

      {/* LEFT — spec list with chat icon */}
      <div className={styles.left}>
        <div className={styles.iconAndList}>
          <span className={styles.icon} aria-hidden="true">
            <ChatIcon size={26} />
          </span>
          <MetricList rows={rows} />
        </div>
      </div>

      {/* Thin vertical divider */}
      <div className={styles.divider} aria-hidden="true" />

      {/* MIDDLE — Quality gauge */}
      <div className={styles.gaugeWrap}>
        <QualityGauge value={outcome.baseline.quality} size={88} label="QUALITY" />
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* RIGHT — Trend chart with model dropdown */}
      <div className={styles.right}>
        <div className={styles.chartHeader}>
          <div className={styles.chartHeading}>
            <h3 className={styles.chartTitle}>Response Score Trend</h3>
            <span className={styles.kindPill}>{outcome.kindLabel}</span>
          </div>
          <ModelDropdown
            models={modelIds}
            value={modelId}
            onChange={onModelChange}
          />
        </div>
        <TrendChart
          data={outcome.baseline.trend}
          labels={days}
          yTicks={yTicks}
          yMax={yMax}
          showArea={false}
          maxWidth={340}
        />
      </div>
    </header>
  );
}
