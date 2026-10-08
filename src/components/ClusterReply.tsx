import { useEffect, useRef, useState } from "react";
import {
  availability,
  crashNode,
  createCluster,
  killRandomPod,
  NODES,
  startRollout,
  tick,
  type Cluster,
  type Pod,
} from "../sim/cluster";
import { count, percent } from "../sim/format";
import { sound } from "../sound";
import { CountUp } from "./CountUp";
import { StatTable, Tone } from "./StatTable";
import styles from "./ClusterReply.module.css";

export type ClusterKind = "crash" | "node" | "rollout";
type Side = "without" | "with";
type PodView = "ready" | "down" | "draining" | "starting";

/** One simulated second. Slow enough to follow each request with your eyes. */
const TICK_MS = 1400;
const MAX_TICKS = 140;
const W = 640;
const PANEL_W = 300;
const PANEL_GAP = W - PANEL_W * 2;
const COL_W = 94;
const COL_GAP = (PANEL_W - COL_W * 3) / 2;
const POD_H = 38;
const POD_GAP = 6;
const LB = { cx: PANEL_W / 2, y: 58, w: 140, h: 26 };
const PODS_TOP = 130;
const PANEL_H = PODS_TOP + 3 * (POD_H + POD_GAP);

const TITLE: Record<ClusterKind, string> = {
  crash: "one worker pod crashes",
  node: "node-b goes offline, taking its pods with it",
  rollout: "rolling update, one pod at a time",
};

function begin(kind: ClusterKind): Cluster {
  const start = createCluster();
  if (kind === "crash") return killRandomPod(start, Math.random());
  if (kind === "node") return crashNode(start, 1);
  return startRollout(start);
}

function view(pod: Pod): PodView {
  if (pod.phase.tag === "ready") return "ready";
  if (pod.phase.tag === "down") return pod.phase.cause === "rollout" ? "draining" : "down";
  return "starting";
}

/** Where a pod sits inside a panel. */
function slot(pod: Pod, cluster: Cluster) {
  const row = cluster.pods.filter((p) => p.node === pod.node).findIndex((p) => p.id === pod.id);
  const x = pod.node * (COL_W + COL_GAP);
  const y = PODS_TOP + row * (POD_H + POD_GAP);
  return { x, y, cx: x + COL_W / 2 };
}

type Packet = { id: string; kind: "ok" | "fail" | "retry"; dx: number; dy: number; retryDx?: number; retryDy?: number };

/** One request per pod per tick, coloured by what happens to it. */
function packetsFor(side: Side, cluster: Cluster): Packet[] {
  const out: Packet[] = [];
  const healthy = cluster.pods.filter((p) => p.routable && p.phase.tag === "ready");
  cluster.pods.forEach((pod, i) => {
    const s = slot(pod, cluster);
    const dx = s.cx - LB.cx;
    const dy = s.y - (LB.y + LB.h);
    const ready = pod.phase.tag === "ready";
    const id = `${cluster.t}-${side}-${pod.id}`;
    if (side === "without") {
      out.push({ id, kind: ready ? "ok" : "fail", dx, dy });
      return;
    }
    if (!pod.routable) return;
    if (ready) {
      out.push({ id, kind: "ok", dx, dy });
      return;
    }
    const alt = healthy.length > 0 ? healthy[i % healthy.length] : undefined;
    if (!alt) return;
    const a = slot(alt, cluster);
    out.push({ id, kind: "retry", dx, dy, retryDx: a.cx - LB.cx, retryDy: a.y - (LB.y + LB.h) });
  });
  return out;
}

type Status = { tone: "bad" | "warn" | "ok"; title: string; sub: string };

function panelStatus(side: Side, cluster: Cluster): Status {
  const down = cluster.pods.filter((p) => p.phase.tag !== "ready").length;
  if (side === "without") {
    if (down === 0) return { tone: "ok", title: "all pods healthy", sub: "every request is answered" };
    return { tone: "bad", title: `${down} ${down === 1 ? "pod" : "pods"} down`, sub: "balancer still sends them traffic" };
  }
  if (cluster.pods.some((p) => p.routable && p.phase.tag !== "ready")) {
    return { tone: "warn", title: "failure detected", sub: "retrying those requests elsewhere" };
  }
  if (cluster.pods.some((p) => !p.routable)) {
    return { tone: "ok", title: "pod removed from rotation", sub: "all traffic on healthy pods" };
  }
  return { tone: "ok", title: "all pods healthy", sub: "every request is answered" };
}

export function ClusterReply({ kind }: { kind: ClusterKind }) {
  const [cluster, setCluster] = useState(() => begin(kind));
  const finished = cluster.recoverySeconds !== null || cluster.t >= MAX_TICKS;
  const cued = useRef(false);

  useEffect(() => {
    if (cued.current) return;
    cued.current = true;
    sound.play(kind === "crash" ? "error" : kind === "node" ? "warning" : "loading", { emphasis: "strong" });
  }, [kind]);

  useEffect(() => {
    if (finished) return;
    const id = window.setTimeout(() => setCluster(tick), TICK_MS);
    return () => window.clearTimeout(id);
  }, [cluster, finished]);

  const recovered = cluster.recoverySeconds !== null;
  useEffect(() => {
    if (!recovered) return;
    sound.play("success", { emphasis: "strong" });
  }, [recovered]);

  const avail = availability(cluster);
  const latest = cluster.events[0];
  const failed = Math.round(cluster.without.failed);

  return (
    <div>
      <p className={styles.title}>{TITLE[kind]}</p>

      <div className={styles.legend} aria-hidden="true">
        <span><i data-k="ok" />request answered</span>
        <span><i data-k="fail" />request failed</span>
        <span><i data-k="retry" />retried on another pod</span>
      </div>

      <div className={styles.scroll}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${PANEL_H}`}
          role="img"
          aria-label={`Cluster of ${cluster.pods.length} pods. Without NIO ${failed} requests have failed. With NIO ${Math.round(cluster.with.failed)} have failed.`}
        >
          <defs>
            <pattern id="hatch-bad" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className={styles.hatchBad} />
            </pattern>
            <pattern id="hatch-warn" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className={styles.hatchWarn} />
            </pattern>
          </defs>
          {(["without", "with"] as const).map((side, idx) => (
            <Panel key={side} side={side} cluster={cluster} offset={idx * (PANEL_W + PANEL_GAP)} />
          ))}
          <line x1={W / 2} x2={W / 2} y1="0" y2={PANEL_H} className={styles.divider} />
        </svg>
      </div>

      <p className={styles.log} data-tone={latest.tone} key={`${latest.t}-${latest.text}`}>
        <i aria-hidden="true" />
        <span>{String(latest.t).padStart(3, "0")}s</span>
        {latest.text}
      </p>

      <StatTable
        show
        rows={[
          {
            label: "failed requests",
            without: <Tone kind={failed > 0 ? "bad" : "ok"}><CountUp active value={failed} format={count} ms={500} /></Tone>,
            with: <Tone kind="ok"><CountUp active value={Math.round(cluster.with.failed)} format={count} ms={500} /></Tone>,
          },
          {
            label: "retried and answered",
            without: "0",
            with: <Tone kind="warn"><CountUp active value={Math.round(cluster.with.retried)} format={count} ms={500} /></Tone>,
          },
          {
            label: "pods answering",
            without: <Tone kind={avail.without < 100 ? "bad" : "ok"}>{percent(avail.without)}</Tone>,
            with: <Tone kind="ok">{percent(avail.with)}</Tone>,
          },
          {
            label: "time to recover",
            without: "waits on the pod",
            with: recovered ? <Tone kind="ok">{cluster.recoverySeconds}s, nothing lost</Tone> : <Tone kind="warn">recovering</Tone>,
          },
        ]}
        note="Without NIO a static balancer keeps sending traffic to every pod, healthy or not."
      />
    </div>
  );
}

function Panel({ side, cluster, offset }: { side: Side; cluster: Cluster; offset: number }) {
  const status = panelStatus(side, cluster);
  const packets = packetsFor(side, cluster);
  const nio = side === "with";

  return (
    <g transform={`translate(${offset} 0)`}>
      <text x="0" y="10" className={styles.cap}>
        {nio ? "with NIO" : "without NIO"}
      </text>
      <g className={styles.status} data-tone={status.tone} key={status.title + status.sub}>
        <circle cx="4" cy="27" r="3" />
        <text x="14" y="30.5" className={styles.statusTitle}>
          {status.title}
        </text>
        <text x="14" y="45" className={styles.statusSub}>
          {status.sub}
        </text>
      </g>

      {/* balancer */}
      <rect x={LB.cx - LB.w / 2} y={LB.y} width={LB.w} height={LB.h} className={styles.lb} data-nio={nio} />
      <text x={LB.cx} y={LB.y + 17} textAnchor="middle" className={styles.lbText} data-nio={nio}>
        {nio ? "NIO gateway" : "static balancer"}
      </text>

      {/* routes */}
      {cluster.pods.map((pod) => {
        const s = slot(pod, cluster);
        const cut = nio && !pod.routable;
        return (
          <line key={pod.id} x1={LB.cx} y1={LB.y + LB.h} x2={s.cx} y2={s.y} className={styles.route} data-cut={cut} data-bad={!nio && pod.phase.tag !== "ready"} />
        );
      })}

      {/* pods */}
      {NODES.map((name, n) => (
        <text key={name} x={n * (COL_W + COL_GAP)} y={PODS_TOP - 8} className={styles.cap}>
          {name}
        </text>
      ))}
      {cluster.pods.map((pod) => {
        const s = slot(pod, cluster);
        const v = view(pod);
        return (
          <g key={pod.id} transform={`translate(${s.x} ${s.y})`} data-view={v} className={styles.pod}>
            <rect width={COL_W} height={POD_H} className={styles.podBox} />
            {v === "down" && <rect width={COL_W} height={POD_H} fill="url(#hatch-bad)" />}
            {v === "draining" && <rect width={COL_W} height={POD_H} fill="url(#hatch-warn)" />}
            <circle cx={COL_W - 10} cy="11" r="3" className={styles.podDot} />
            <text x="8" y="15" className={styles.podName}>
              {pod.id}
            </text>
            <text x="8" y="29" className={styles.podState}>
              {v === "starting" ? "restarting" : v}
            </text>
          </g>
        );
      })}

      {/* requests in flight, one per pod per tick */}
      {packets.map((p) => (
        <g key={p.id} transform={`translate(${LB.cx} ${LB.y + LB.h})`}>
          <circle
            r="3.2"
            className={styles.packet}
            data-kind={p.kind}
            style={{ ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px` }}
          />
          {p.kind === "fail" && (
            <text x={p.dx} y={p.dy - 4} textAnchor="middle" className={styles.cross}>
              ×
            </text>
          )}
          {p.kind === "retry" && (
            <circle
              r="3.2"
              className={styles.packet}
              data-kind="ok"
              data-late="true"
              style={{ ["--dx" as string]: `${p.retryDx}px`, ["--dy" as string]: `${p.retryDy}px` }}
            />
          )}
        </g>
      ))}
    </g>
  );
}
