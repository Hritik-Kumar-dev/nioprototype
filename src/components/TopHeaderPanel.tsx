import { QualityGauge } from "./QualityGauge";
import { TrendChart } from "./TrendChart";
import { MetricList } from "./MetricList";
import { ModelDropdown } from "./ModelDropdown";
import { ChatIcon } from "./icons";
import { baseline, baselineMetrics, models, days, yTicks, yMax } from "../data/mock";
import styles from "./TopHeaderPanel.module.css";

export function TopHeaderPanel() {
  return (
    <header className={styles.panel} aria-labelledby="header-title">
      <h1 id="header-title" className={styles.visuallyHidden}>
        Chat GPT baseline metrics
      </h1>

      {/* LEFT — icon + title + spec list */}
      <div className={styles.left}>
        <div className={styles.iconTitle}>
          <span className={styles.icon} aria-hidden="true">
            <ChatIcon size={24} />
          </span>
          <h2 className={styles.title}>{baseline.name}</h2>
        </div>
        <MetricList rows={baselineMetrics} />
      </div>

      {/* Thin vertical divider */}
      <div className={styles.divider} aria-hidden="true" />

      {/* MIDDLE — Quality gauge */}
      <div className={styles.gaugeWrap}>
        <QualityGauge value={baseline.quality} size={100} label="QUALITY" />
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* RIGHT — Trend chart with model dropdown */}
      <div className={styles.right}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Response Score Trend</h3>
          <ModelDropdown
            models={models}
            value={baseline.model}
            onChange={() => {}}
          />
        </div>
        <TrendChart data={baseline.trend} labels={days} yTicks={yTicks} yMax={yMax} />
      </div>
    </header>
  );
}