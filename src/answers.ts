import type { Tier } from "./sim/workers";

const ARITHMETIC = /^\s*(?:what\s+is\s+)?(-?\d+(?:\.\d+)?)\s*([+\-*/x×])\s*(-?\d+(?:\.\d+)?)\s*\??\s*$/i;
const GREETING = /^\s*(hi+|hello+|hey|yo)\b/i;
const CROP_INSURANCE = /pmfby|fasal bima|crop insurance/i;

function arithmetic(prompt: string) {
  const m = prompt.match(ARITHMETIC);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  const op = m[2];
  const value = op === "+" ? a + b : op === "-" ? a - b : op === "/" ? (b === 0 ? NaN : a / b) : a * b;
  if (Number.isNaN(value)) return null;
  return `${a} ${op === "x" ? "×" : op} ${b} = ${Math.round(value * 1e6) / 1e6}`;
}

/** Canned replies. The point of the demo is the routing, not the text. */
export function answerFor(prompt: string, tier: Tier): string {
  const sum = arithmetic(prompt);
  if (sum) return sum;
  if (GREETING.test(prompt)) return "Hi. What are we working on?";
  if (tier === "easy") return "Yes. That one is quick, so I kept the answer short.";
  if (tier === "medium") {
    if (CROP_INSURANCE.test(prompt)) {
      return "PMFBY insures small farmers against crop loss from weather, pests and disease. Farmers pay at most 2% of the insured amount for kharif food crops and 1.5% for rabi. The government covers the rest of the premium.";
    }
    return "Here is the short version. First the core idea, then what it means in practice. A mid-size model wrote this, which is enough for a question like yours.";
  }
  return "I split this into three steps. First clean and compare the data. Then test each option against your constraints. Last, rank them and write a recommendation with the assumptions stated. A larger model took it, since a smaller one tends to drop steps.";
}
