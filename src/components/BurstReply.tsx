import { useEffect, useId, useMemo, useRef, useState } from "react";
import { prefersReducedMotion, useElapsed } from "../hooks";
import { DURATION_S, runBurst, type Scenario } from "../sim/burst";
import { count, percent, secs, usd } from "../sim/format";
import { sound } from "../sound";
import { CountUp } from "./CountUp";
import { StatTable, Tone } from "./StatTable";
import styles from "./BurstReply.module.css";

const PLAY_MS = 11000;
const W = 640;
const L = 38;
const R = 636;
const LAYER = {
  traffic: { top: 20, bottom: 66 },
  latency: { top: 104, bottom: 206 },
  workers: { top: 238, bottom: 272 },
} as const;
const AXIS_Y = 290;

const BAND: Record<Scenario, { from: number; to: number; label: string } | null> = {
  steady: null,
  burst: { from: 14, to: 34, label: "traffic jumps 5x" },
  surge: { from: 12, to: DURATION_S - 1, label: "traffic keeps climbing" },
};

function niceMax(value: number) {
  const mag = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  for (const step of [1, 1.5, 2, 3, 5, 10]) if (value <= step * mag) return step * mag;
  return 10 * mag;
}

export function BurstReply({ scenario }: { scenario: Scenario }) {
  const result = useMemo(() => runBurst(scenario), [scenario]);
  const clipId = useId();
  const [done, setDone] = useState(false);
  const cued = useRef(false);
  const now = useElapsed(PLAY_MS, DURATION_S);

  useEffect(() => {
    if (cued.current) return;
    cued.current = true;
    sound.play("loading");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(
      () => {
        setDone(true);
        sound.play("success", { emphasis: "strong" });
        sound.play("count", { duration: 900 });
      },
      prefersReducedMotion() ? 0 : PLAY_MS,
    );
    return () => window.clearTimeout(id);
  }, []);

  const secsData = result.seconds;
  const rps = secsData.map((s) => s.rps);
  const without = secsData.map((s) => s.without.p95);
  const withNio = secsData.map((s) => s.with.p95);
  const workers = secsData.map((s) => s.with.replicas);
  const dropped = secsData.map((s) => s.without.dropped > 0);

  const x = (i: number) => L + (i / (DURATION_S - 1)) * (R - L);
  const rpsMax = niceMax(Math.max(...rps));
  const latMax = niceMax(Math.max(...without));
  const yRps = (v: number) => LAYER.traffic.bottom - (v / rpsMax) * (LAYER.traffic.bottom - LAYER.traffic.top);
  const yLat = (v: number) => LAYER.latency.bottom - (v / latMax) * (LAYER.latency.bottom - LAYER.latency.top);
  const line = (values: number[], y: (v: number) => number) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = (values: number[], y: (v: number) => number, floor: number) =>
    `${line(values, y)} L${x(values.length - 1)} ${floor} L${x(0)} ${floor} Z`;

  const band = BAND[scenario];
  const peakIdx = without.findIndex((v) => v >= Math.max(...without) * 0.97);
  const workerPeak = Math.max(...workers);
  const workerPeakIdx = workers.findIndex((v) => v === workerPeak);
  const at = (i: number) => `${(i / (DURATION_S - 1)) * PLAY_MS}ms`;
  const s = result.summary;
  const cur = secsData[now];
  const calm = rps[0];
  const surging = cur.rps > calm * 1.8;
  const firstDrop = dropped.findIndex(Boolean);

  return (
    <div>
      <p className={styles.title}>{scenario === "surge" ? "traffic climbs and stays high" : "traffic jumps 5x for 20 seconds"}</p>

      <div className={styles.live} aria-hidden="true">
        <div>
          <span>time</span>
          <b>{cur.t}s</b>
        </div>
        <div>
          <span>incoming</span>
          <b data-tone={surging ? "bad" : undefined}>{count(cur.rps)} req/s</b>
        </div>
        <div>
          <span>without NIO waits</span>
          <b data-tone={cur.without.p95 > 6 ? "bad" : "ok"}>{secs(cur.without.p95)}</b>
        </div>
        <div>
          <span>with NIO waits</span>
          <b data-tone="ok">{secs(cur.with.p95)}</b>
        </div>
      </div>

      <div className={styles.scroll}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} 296`}
          role="img"
          aria-label={`During a ${scenario} test, waits without NIO reach ${secs(s.without.p95)} and ${percent(s.without.droppedPct)} of requests drop. With NIO, waits stay near ${secs(s.with.p95)}.`}
          style={{ ["--dur" as string]: `${PLAY_MS}ms`, ["--sweep" as string]: `${R - L}px` }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect className={styles.reveal} x="0" y="0" width={W} height="300" />
            </clipPath>
          </defs>

          <text x={L} y="12" className={styles.cap}>
            incoming traffic, requests per second
          </text>
          <text x={L} y="96" className={styles.cap}>
            how long a request waits, seconds
          </text>
          <text x={L} y="230" className={styles.cap}>
            workers NIO is running
          </text>
          {band && (
            <rect x={x(band.from)} y={LAYER.traffic.top - 6} width={x(band.to) - x(band.from)} height={LAYER.workers.bottom - LAYER.traffic.top + 8} className={styles.band} />
          )}
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={L} x2={R} y1={yLat(f * latMax)} y2={yLat(f * latMax)} className={styles.grid} />
              <text x={L - 8} y={yLat(f * latMax) + 3} textAnchor="end" className={styles.tick}>
                {f * latMax}
              </text>
            </g>
          ))}
          <text x={L - 8} y={yRps(rpsMax) + 3} textAnchor="end" className={styles.tick}>
            {rpsMax}
          </text>
          <text x={L - 8} y={yRps(0) + 3} textAnchor="end" className={styles.tick}>
            0
          </text>

          <g clipPath={`url(#${clipId})`}>
            <path d={area(rps, yRps, LAYER.traffic.bottom)} className={styles.trafficArea} />
            <path d={line(rps, yRps)} className={styles.trafficLine} />

            <path d={area(without, yLat, LAYER.latency.bottom)} className={styles.badArea} />
            <path d={line(without, yLat)} className={styles.badLine} />
            <path d={line(withNio, yLat)} className={styles.okLine} />
            {dropped.map((d, i) =>
              d ? <rect key={i} x={x(i) - 3} y={LAYER.latency.bottom - 5} width="6" height="5" className={styles.drop} /> : null,
            )}

            {workers.map((n, i) => {
              const h = Math.max(2, (n / workerPeak) * (LAYER.workers.bottom - LAYER.workers.top));
              return <rect key={i} x={x(i) - 2.2} y={LAYER.workers.bottom - h} width="4.4" height={h} className={styles.bar} data-scaled={n > workers[0]} />;
            })}
          </g>

          <line x1={L} x2={L} y1={LAYER.traffic.top - 6} y2={LAYER.workers.bottom} className={styles.scan} />

          {band && (
            <g className={styles.note} style={{ ["--at" as string]: at(band.from) }}>
              <text x={x(band.from) + 6} y={LAYER.traffic.top + 10} className={styles.noteBad}>
                {band.label}
              </text>
            </g>
          )}
          <g className={styles.note} style={{ ["--at" as string]: at(peakIdx) }}>
            <line x1={x(peakIdx)} x2={x(peakIdx)} y1={yLat(without[peakIdx])} y2={yLat(without[peakIdx]) - 10} className={styles.leaderBad} />
            <text x={x(peakIdx) + 4} y={yLat(without[peakIdx]) - 16} className={styles.noteBad}>
              requests pile up. waits reach {secs(Math.max(...without))}
            </text>
          </g>
          {firstDrop >= 0 && (
            <g className={styles.note} style={{ ["--at" as string]: at(firstDrop + 2) }}>
              <text x={x(firstDrop) + 4} y={LAYER.latency.bottom - 44} className={styles.noteBad}>
                {percent(s.without.droppedPct)} of requests dropped
              </text>
            </g>
          )}
          <g className={styles.note} style={{ ["--at" as string]: at(Math.min(DURATION_S - 1, peakIdx + 8)) }}>
            <text x={x(Math.min(DURATION_S - 1, peakIdx + 8))} y={yLat(withNio[peakIdx]) - 14} className={styles.noteOk}>
              NIO adds workers. waits stay near {secs(s.with.p95)}
            </text>
          </g>
          <g className={styles.note} style={{ ["--at" as string]: at(workerPeakIdx) }}>
            <text x={x(workerPeakIdx) + 6} y={LAYER.workers.top - 4} className={styles.noteOk}>
              {workers[0]} to {workerPeak} workers
            </text>
          </g>

          <text x={L} y={AXIS_Y} className={styles.tick}>
            0s
          </text>
          <text x={R} y={AXIS_Y} textAnchor="end" className={styles.tick}>
            {DURATION_S}s
          </text>
        </svg>
      </div>

      <StatTable
        show={done}
        rows={[
          {
            label: "p95 wait",
            without: <Tone kind="bad"><CountUp active={done} value={s.without.p95} format={secs} /></Tone>,
            with: <Tone kind="ok"><CountUp active={done} value={s.with.p95} format={secs} /></Tone>,
          },
          {
            label: "requests dropped",
            without: <Tone kind="bad"><CountUp active={done} value={s.without.droppedPct} format={(n) => percent(n, 1)} /></Tone>,
            with: <Tone kind="ok"><CountUp active={done} value={s.with.droppedPct} format={(n) => percent(n, 1)} /></Tone>,
          },
          {
            label: "peak queue",
            without: <CountUp active={done} value={s.without.peakQueue} format={count} />,
            with: <CountUp active={done} value={s.with.peakQueue} format={count} />,
          },
          {
            label: "cost, one minute",
            without: <CountUp active={done} value={s.without.costUsd} format={usd} />,
            with: <Tone kind="ok"><CountUp active={done} value={s.with.costUsd} format={usd} /></Tone>,
          },
          { label: "peak workers", without: String(s.without.peakReplicas), with: String(s.with.peakReplicas) },
        ]}
        note="Same traffic for both. One fixed pool and one big model, against tiered pools that scale out and send overflow to cheaper workers."
      />
    </div>
  );
}
