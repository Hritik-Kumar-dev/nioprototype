export type Deployment = "edge" | "core" | "reasoning";

export const DEPLOYMENTS: Record<Deployment, { label: string; model: string }> = {
  edge: { label: "edge-8b", model: "Llama 3.1 8B" },
  core: { label: "mid-70b", model: "Llama 3.3 70B" },
  reasoning: { label: "reasoning", model: "Claude Sonnet" },
};

export type Phase =
  | { tag: "ready" }
  /** Not serving. `cause` decides whether NIO knew about it in advance. */
  | { tag: "down"; since: number; cause: "crash" | "rollout" }
  | { tag: "starting"; readyAt: number };

export type Pod = {
  id: string;
  deployment: Deployment;
  node: number;
  phase: Phase;
  /** Whether the NIO registry still sends traffic here. */
  routable: boolean;
};

export type EventTone = "info" | "warn" | "bad" | "good";
export type ClusterEvent = { t: number; tone: EventTone; text: string };

export type Cluster = {
  t: number;
  pods: Pod[];
  events: ClusterEvent[];
  /** Pods waiting for their turn in a rolling update. */
  rollout: string[];
  incidentStart: number | null;
  recoverySeconds: number | null;
  without: { failed: number; sent: number };
  with: { failed: number; retried: number; sent: number };
};

export const NODES = ["node-a", "node-b", "node-c"] as const;
export const REQUESTS_PER_TICK = 12;
export const MISSED_BEATS = 3;
const RESTART_TICKS = 5;
const ROLLOUT_TICKS = 3;

const LAYOUT: ReadonlyArray<readonly [Deployment, number]> = [
  ["edge", 0],
  ["edge", 1],
  ["edge", 2],
  ["core", 0],
  ["core", 1],
  ["reasoning", 1],
  ["reasoning", 2],
];

export function createCluster(): Cluster {
  const counts: Record<Deployment, number> = { edge: 0, core: 0, reasoning: 0 };
  const pods = LAYOUT.map(([deployment, node]) => {
    counts[deployment] += 1;
    return {
      id: `${DEPLOYMENTS[deployment].label}-${counts[deployment]}`,
      deployment,
      node,
      phase: { tag: "ready" } as Phase,
      routable: true,
    };
  });
  return {
    t: 0,
    pods,
    events: [{ t: 0, tone: "info", text: "7 workers ready. All registered with NIO." }],
    rollout: [],
    incidentStart: null,
    recoverySeconds: null,
    without: { failed: 0, sent: 0 },
    with: { failed: 0, retried: 0, sent: 0 },
  };
}

function log(c: Cluster, tone: EventTone, text: string): ClusterEvent[] {
  return [{ t: c.t, tone, text }, ...c.events].slice(0, 40);
}

function mapPod(c: Cluster, id: string, fn: (p: Pod) => Pod): Pod[] {
  return c.pods.map((p) => (p.id === id ? fn(p) : p));
}

export function killPod(c: Cluster, id: string): Cluster {
  const pod = c.pods.find((p) => p.id === id);
  if (!pod || pod.phase.tag !== "ready") return c;
  return {
    ...c,
    pods: mapPod(c, id, (p) => ({ ...p, phase: { tag: "down", since: c.t, cause: "crash" } })),
    events: log(c, "bad", `${id} crashed on ${NODES[pod.node]}.`),
    incidentStart: c.incidentStart ?? c.t,
    recoverySeconds: null,
  };
}

export function killRandomPod(c: Cluster, pick: number): Cluster {
  const ready = c.pods.filter((p) => p.phase.tag === "ready");
  if (ready.length === 0) return c;
  return killPod(c, ready[Math.floor(pick * ready.length) % ready.length].id);
}

export function crashNode(c: Cluster, node: number): Cluster {
  const hit = c.pods.filter((p) => p.node === node && p.phase.tag === "ready");
  if (hit.length === 0) return c;
  return {
    ...c,
    pods: c.pods.map((p) =>
      p.node === node && p.phase.tag === "ready"
        ? { ...p, phase: { tag: "down", since: c.t, cause: "crash" } as Phase }
        : p,
    ),
    events: log(c, "bad", `${NODES[node]} went offline. ${hit.length} pods lost.`),
    incidentStart: c.incidentStart ?? c.t,
    recoverySeconds: null,
  };
}

export function startRollout(c: Cluster): Cluster {
  if (c.rollout.length > 0) return c;
  return {
    ...c,
    rollout: c.pods.filter((p) => p.phase.tag === "ready").map((p) => p.id),
    events: log(c, "info", "Rolling update started. Replacing pods one at a time."),
    incidentStart: c.incidentStart ?? c.t,
    recoverySeconds: null,
  };
}

function everyoneReady(c: Cluster) {
  return c.pods.every((p) => p.phase.tag === "ready" && p.routable);
}

/** Advance the cluster by one second of simulated time. */
export function tick(c: Cluster): Cluster {
  const next: Cluster = { ...c, t: c.t + 1 };
  let events = next.events;
  const push = (tone: EventTone, text: string) => {
    events = [{ t: next.t, tone, text }, ...events].slice(0, 40);
  };

  // Rolling update: take down the next pod once nothing else is restarting.
  let rollout = next.rollout;
  const busy = next.pods.some((p) => p.phase.tag !== "ready");
  let pods = next.pods;
  if (rollout.length > 0 && !busy) {
    const [id, ...rest] = rollout;
    rollout = rest;
    pods = pods.map((p) =>
      p.id === id
        ? { ...p, phase: { tag: "down", since: next.t, cause: "rollout" } as Phase, routable: false }
        : p,
    );
    push("info", `${id} drained for update. NIO stopped sending it traffic.`);
  }

  pods = pods.map((p) => {
    const phase = p.phase;
    if (phase.tag === "down") {
      const wait = phase.cause === "rollout" ? ROLLOUT_TICKS : MISSED_BEATS;
      if (next.t - phase.since >= wait) {
        if (phase.cause === "crash") {
          push("warn", `${p.id} missed ${MISSED_BEATS} heartbeats. Removed from registry, in-flight requests retried.`);
        } else {
          push("info", `${p.id} replaced. Waiting for readiness probe.`);
        }
        return {
          ...p,
          routable: false,
          phase: { tag: "starting", readyAt: next.t + RESTART_TICKS } as Phase,
        };
      }
    }
    if (phase.tag === "starting" && next.t >= phase.readyAt) {
      push("good", `${p.id} passed readiness probe. Back in rotation.`);
      return { ...p, routable: true, phase: { tag: "ready" } as Phase };
    }
    return p;
  });

  // Traffic for this second. Without NIO a static balancer keeps hitting every pod.
  const share = REQUESTS_PER_TICK / pods.length;
  const downCount = pods.filter((p) => p.phase.tag !== "ready").length;
  const without = {
    sent: next.without.sent + REQUESTS_PER_TICK,
    failed: next.without.failed + share * downCount,
  };

  // NIO sends to registered pods only, and retries anything that hit a pod it had not yet marked.
  const routable = pods.filter((p) => p.routable);
  const hitSilentFailure = routable.filter((p) => p.phase.tag !== "ready").length;
  const routeShare = routable.length > 0 ? REQUESTS_PER_TICK / routable.length : 0;
  const withNio = {
    sent: next.with.sent + REQUESTS_PER_TICK,
    retried: next.with.retried + routeShare * hitSilentFailure,
    failed: next.with.failed + (routable.length === 0 ? REQUESTS_PER_TICK : 0),
  };

  const result: Cluster = { ...next, pods, rollout, events, without, with: withNio };
  if (result.incidentStart !== null && result.recoverySeconds === null && rollout.length === 0 && everyoneReady(result)) {
    const seconds = result.t - result.incidentStart;
    return {
      ...result,
      recoverySeconds: seconds,
      incidentStart: null,
      events: [{ t: result.t, tone: "good" as const, text: `Cluster fully healthy again after ${seconds}s.` }, ...result.events].slice(0, 40),
    };
  }
  return result;
}

export function availability(c: Cluster) {
  const ready = c.pods.filter((p) => p.phase.tag === "ready").length;
  return { without: (ready / c.pods.length) * 100, with: c.pods.some((p) => p.routable && p.phase.tag === "ready") ? 100 : 0 };
}
