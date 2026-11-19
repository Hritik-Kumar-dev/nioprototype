import { describe, expect, it } from "vitest";
import { Rating } from "./rating";
import { routePrompt } from "./sim/classify";

describe("Rating.fromModelText", () => {
  it("reads a bare JSON verdict", () => {
    expect(Rating.fromModelText('{"tier":"hard","confidence":0.8}')).toEqual({ tier: "hard", confidence: 0.8 });
  });

  it("reads a verdict wrapped in a code fence and prose", () => {
    expect(Rating.fromModelText('Sure.\n```json\n{"tier":"easy","confidence":0.95}\n```')).toEqual({ tier: "easy", confidence: 0.95 });
  });

  it("rejects unknown tiers, out-of-range confidence and non-JSON", () => {
    expect(Rating.fromModelText('{"tier":"trivial","confidence":0.9}')).toBeNull();
    expect(Rating.fromModelText('{"tier":"easy","confidence":1.4}')).toBeNull();
    expect(Rating.fromModelText("easy")).toBeNull();
  });
});

describe("routePrompt with a router rating", () => {
  it("routes each tier to its own worker", () => {
    const prompt = "hello";
    expect(routePrompt(prompt, { tier: "easy", confidence: 0.9 }).chosen.worker.id).toBe("edge-8b");
    expect(routePrompt(prompt, { tier: "medium", confidence: 0.9 }).chosen.worker.id).toBe("mid-70b");
    expect(routePrompt(prompt, { tier: "hard", confidence: 0.9 }).chosen.worker.id).toBe("sonnet");
  });

  it("uses the router's confidence", () => {
    expect(routePrompt("hello", { tier: "medium", confidence: 0.73 }).classification.confidence).toBe(0.73);
  });
});
