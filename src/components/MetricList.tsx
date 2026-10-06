import type { MetricRow } from "../types";
import styles from "./MetricList.module.css";

export interface MetricListProps {
  rows: MetricRow[];
}

/**
 * Aligned label/value spec list (NOT a table). The colon column is kept
 * consistent by giving labels a fixed min-width and the colon its own span.
 */
export function MetricList({ rows }: MetricListProps) {
  return (
    <ul className={styles.list}>
      {rows.map((row) => (
        <li key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.colon} aria-hidden="true">
            :
          </span>
          <span className={styles.value}>{row.value}</span>
        </li>
      ))}
    </ul>
  );
}
