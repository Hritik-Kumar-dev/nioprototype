import { useEffect, useMemo, useRef, useState } from "react";
import { percent, secs } from "../sim/format";
import { POLICIES, runAllPolicies, SLA_SECONDS, WORKER_SPEEDS } from "../sim/policies";
import { sound } from "../sound";
import { StatTable } from "./StatTable";
import styles from "./PolicyReply.module.css";

const LABEL_W = 132;
const BAR_X = LABEL_W + 10;
const BAR_MAX = 340;
const ROW_H = 38;
const STAGGER_MS = 320;

export function PolicyReply() {
  const results = useMemo(() => [...runAllPolicies("burst", 42)].sort((a, b) => a.p95 - b.p95), []);
  const [shown, setShown] = useState(false);
  const cued = useRef(false);

  useEffect(() => {
    if (cued.current) return;
    cued.current = true;
    sound.play("loading");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setShown(true);
      sound.play("success", { emphasis: "strong" });
    }, 500);
    return () => window.clearTimeout(id);
  }, []);

  const worst = Math.max(...results.map((r) => r.p95));
  const best = results[0];
  const rr = results.find((r) => r.id === "round-robin") ?? results[results.length - 1];
  const bestUrgent = results.reduce((a, b) => (b.urgentP95 < a.urgentP95 ? b : a));
  const bestGood = results.reduce((a, b) => (b.goodputPct > a.goodputPct ? b : a));

  return (
    <div>
      <p className={styles.title}>
        p95 latency · 900 requests · {WORKER_SPEEDS.length} workers · bursty traffic
      </p>
      <svg className={styles.svg} viewBox={`0 0 640 ${results.length * ROW_H}`} role="img" aria-label="P95 latency per scheduling policy, lowest first">
        {results.map((r, i) => {
          const y = i * ROW_H + ROW_H / 2;
          const w = Math.max(3, Math.sqrt(r.p95 / worst) * BAR_MAX);
          const isNio = r.id === "learned";
          const rank = i === 0 ? "best" : i === results.length - 1 ? "worst" : "mid";
          return (
            <g key={r.id}>
              <text x="0" y={y + 4} className={styles.name} data-nio={isNio}>
                {POLICIES[r.id].label}
              </text>
              <rect
                x={BAR_X}
                y={y - 4}
                height="8"
                width={shown ? w : 0}
                className={styles.bar}
                data-nio={isNio}
                data-rank={rank}
                style={{ transitionDelay: `${i * STAGGER_MS}ms` }}
              />
              <text
                x={BAR_X + w + 10}
                y={y + 4}
                className={styles.value}
                data-nio={isNio}
                data-rank={rank}
                style={{ opacity: shown ? 1 : 0, transitionDelay: `${i * STAGGER_MS + 900}ms` }}
              >
                {secs(r.p95)}
              </text>
              <text x="640" y={y + 4} textAnchor="end" className={styles.good} style={{ opacity: shown ? 1 : 0, transitionDelay: `${i * STAGGER_MS + 900}ms` }}>
                {percent(r.goodputPct)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.legend}>
        <span>bars use a square-root scale</span>
        <span>right column: answered in under {SLA_SECONDS}s</span>
      </p>

      <StatTable
        show={shown}
        heads={["round robin", "best policy"]}
        rows={[
          { label: "p95 latency", without: secs(rr.p95), with: `${secs(best.p95)} ${POLICIES[best.id].label.toLowerCase()}` },
          { label: "urgent p95", without: secs(rr.urgentP95), with: `${secs(bestUrgent.urgentP95)} ${POLICIES[bestUrgent.id].label.toLowerCase()}` },
          { label: `answered in ${SLA_SECONDS}s`, without: percent(rr.goodputPct), with: `${percent(bestGood.goodputPct)} ${POLICIES[bestGood.id].label.toLowerCase()}` },
        ]}
        note="No single policy wins every row. NIO keeps all five and defaults to the learned one."
      />
    </div>
  );
}
