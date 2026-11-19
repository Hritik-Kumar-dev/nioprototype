import { TIERS, type Tier } from "./sim/workers";

/** The router model's verdict on how hard a prompt is. */
export type Rating = { tier: Tier; confidence: number };

function isTier(value: unknown): value is Tier {
  return TIERS.some((t) => t === value);
}

export const Rating = {
  /** Accepts `{ tier, confidence }` with tier in TIERS and confidence in 0..1. */
  parse(value: unknown): Rating | null {
    if (typeof value !== "object" || value === null) return null;
    const tier = "tier" in value ? value.tier : undefined;
    const confidence = "confidence" in value ? value.confidence : undefined;
    if (!isTier(tier)) return null;
    if (typeof confidence !== "number" || !(confidence >= 0 && confidence <= 1)) return null;
    return { tier, confidence };
  },

  /** Pulls the first JSON object out of model text, which may wrap it in prose or a code fence. */
  fromModelText(text: string): Rating | null {
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    try {
      return Rating.parse(JSON.parse(match[0]));
    } catch {
      return null;
    }
  },
} as const;
