import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/claude-count-tokens.json";
import { TokenCounter } from "../src/token-counter";

// Fixture: real /v1/messages/count_tokens results for claude-opus-5-5, copied
// from coder/ai-tokenizer. Each count includes a fixed per-message frame.
describe("Claude Opus 5.5 counter", async () => {
  const counter = await TokenCounter.load({ kind: "claude_v5" });
  if (counter.isErr()) throw counter.error;
  const { frame } = fixture.encodings.claude_v5;

  for (const c of fixture.cases) {
    test(c.name, () => {
      expect(counter.value(c.text)).toBe(c.input_tokens.claude_v5 - frame);
    });
  }
});
