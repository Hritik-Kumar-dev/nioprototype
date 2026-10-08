import { describe, expect, it } from "vitest";
import { runBurst } from "./burst";
import { classifyPrompt, EXAMPLE_PROMPTS, routePrompt } from "./classify";
import { crashNode, createCluster, killPod, startRollout, tick, type Cluster } from "./cluster";
import { runAllPolicies, runPolicy } from "./policies";

describe("classifyPrompt", () => {
  it("rates each example prompt at its own tier", () => {
    expect(classifyPrompt(EXAMPLE_PROMPTS.easy).tier).toBe("easy");
    expect(classifyPrompt(EXAMPLE_PROMPTS.medium).tier).toBe("medium");
    expect(classifyPrompt(EXAMPLE_PROMPTS.hard).tier).toBe("hard");
  });

  it("treats a greeting as easy", () => {
    expect(classifyPrompt("Hello").tier).toBe("easy");
  });
});

describe("routePrompt", () => {
  it("sends easy prompts to the cheapest pool and hard prompts to an API model", () => {
    expect(routePrompt(EXAMPLE_PROMPTS.easy).chosen.worker.id).toBe("edge-8b");
    expect(routePrompt(EXAMPLE_PROMPTS.hard).chosen.worker.host).toBe("provider");
  });

  it("costs less than the frontier model for every example", () => {
    for (const prompt of Object.values(EXAMPLE_PROMPTS)) {
      const r = routePrompt(prompt);
      expect(r.with.costUsd).toBeLessThan(r.without.costUsd);
    }
  });

  it("only picks workers that clear the quality floor", () => {
    for (const prompt of Object.values(EXAMPLE_PROMPTS)) {
      expect(routePrompt(prompt).chosen.quality).toBeGreaterThanOrEqual(0.85);
    }
  });
});

describe("runBurst", () => {
  it("is deterministic for a given seed", () => {
    expect(runBurst("burst", 3)).toEqual(runBurst("burst", 3));
  });

  it("keeps NIO latency and drops below the direct path during a burst", () => {
    const { summary } = runBurst("burst");
    expect(summary.with.p95).toBeLessThan(summary.without.p95);
    expect(summary.with.droppedPct).toBeLessThan(summary.without.droppedPct);
    expect(summary.with.costUsd).toBeLessThan(summary.without.costUsd);
  });

  it("scales replicas up under load", () => {
    expect(runBurst("surge").summary.with.peakReplicas).toBeGreaterThan(3);
  });
});

describe("scheduling policies", () => {
  it("has the learned policy beat round robin on p95 in every traffic shape", () => {
    for (const traffic of ["balanced", "burst", "heavy-tail"] as const) {
      const rr = runPolicy("round-robin", traffic, 42);
      const learned = runPolicy("learned", traffic, 42);
      expect(learned.p95).toBeLessThan(rr.p95);
    }
  });

  it("returns one result per policy", () => {
    expect(runAllPolicies("balanced", 1)).toHaveLength(5);
  });
});

function run(c: Cluster, ticks: number) {
  let state = c;
  for (let i = 0; i < ticks; i++) state = tick(state);
  return state;
}

describe("cluster failure handling", () => {
  it("recovers a crashed pod without losing NIO requests", () => {
    const start = createCluster();
    const crashed = killPod(start, start.pods[0].id);
    const end = run(crashed, 20);
    expect(end.pods.every((p) => p.phase.tag === "ready")).toBe(true);
    expect(end.recoverySeconds).not.toBeNull();
    expect(end.with.failed).toBe(0);
    expect(end.without.failed).toBeGreaterThan(0);
  });

  it("survives a whole node going offline", () => {
    const end = run(crashNode(createCluster(), 1), 25);
    expect(end.with.failed).toBe(0);
    expect(end.pods.every((p) => p.routable)).toBe(true);
  });

  it("rolls every pod with zero NIO failures and zero NIO retries", () => {
    const end = run(startRollout(createCluster()), 80);
    expect(end.rollout).toHaveLength(0);
    expect(end.with.failed).toBe(0);
    expect(end.with.retried).toBe(0);
    expect(end.without.failed).toBeGreaterThan(0);
  });
});
