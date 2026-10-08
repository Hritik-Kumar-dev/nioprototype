import type { ReactNode } from "react";
import styles from "./StatTable.module.css";

export type ToneKind = "bad" | "warn" | "ok";

/** Colours a value by state: red is danger, amber is recovering, green is healthy. */
export function Tone({ kind, children }: { kind: ToneKind; children: ReactNode }) {
  return <span className={styles[kind]}>{children}</span>;
}

export type StatRow = { label: string; without: ReactNode; with: ReactNode };

/** Two-column comparison. The "with NIO" column is the one in ink. */
export function StatTable({
  rows,
  show,
  note,
  heads = ["without NIO", "with NIO"],
}: {
  rows: readonly StatRow[];
  show: boolean;
  note?: ReactNode;
  heads?: readonly [string, string];
}) {
  return (
    <div className={styles.wrap} data-show={show}>
      <div className={`${styles.row} ${styles.head}`}>
        <span />
        <span>{heads[0]}</span>
        <span>{heads[1]}</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.label} className={styles.row} style={{ transitionDelay: `${i * 70}ms` }}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.without}>{row.without}</span>
          <span className={styles.with}>{row.with}</span>
        </div>
      ))}
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}
