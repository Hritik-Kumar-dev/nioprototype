import type { IncomingMessage, ServerResponse } from "node:http";
import { OpenRouter } from "@openrouter/sdk";
import type { Plugin } from "vite";
import { Rating } from "../src/rating";
import { TIERS, type Tier } from "../src/sim/workers";

/**
 * Every tier is answered by this one model. The UI still labels each tier with
 * its own worker name, because the demo is about routing, not about the model.
 */
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

const RATER_PROMPT = `You are the router for an LLM gateway. Rate how hard the user's prompt is to answer well.
- easy: greetings, small talk, single facts, simple arithmetic, yes/no, short lookups.
- medium: explanations, summaries, comparisons of a few items, short code or writing tasks.
- hard: multi-step reasoning, analysis, planning, design, proofs, long or multi-part tasks, non-trivial code.
Reply with only a JSON object, no prose: {"tier":"easy"|"medium"|"hard","confidence":<number 0..1>}`;

const ANSWER_PROMPT: Record<Tier, string> = {
  easy: "You are a fast, small assistant. Answer in one or two short sentences. No preamble, no markdown.",
  medium: "You are a capable assistant. Answer clearly in one short paragraph, under 120 words. Plain text, no markdown headings.",
  hard: "You are a careful reasoning assistant. Work through the problem and give a structured, complete answer in plain text, under 300 words. Number the steps when there are several.",
};

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendError(res: ServerResponse, status: number, message: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: message }));
}

function describe(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function stringField(body: unknown, key: string) {
  if (typeof body !== "object" || body === null || !(key in body)) return null;
  const value: unknown = Reflect.get(body, key);
  return typeof value === "string" && value.trim() ? value : null;
}

async function classify(client: OpenRouter, res: ServerResponse, body: unknown) {
  const prompt = stringField(body, "prompt");
  if (!prompt) return sendError(res, 400, "Request body needs a non-empty `prompt` string.");

  const result = await client.chat.send({
    chatRequest: {
      model: MODEL,
      messages: [
        { role: "system", content: RATER_PROMPT },
        { role: "user", content: prompt },
      ],
    },
  });
  const content = result.choices[0]?.message.content;
  const text = typeof content === "string" ? content : "";
  const rating = Rating.fromModelText(text);
  if (!rating) {
    return sendError(res, 502, `Router model returned no valid rating. Got: ${text.slice(0, 200) || "(empty)"}`);
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(rating));
}

async function answer(client: OpenRouter, res: ServerResponse, body: unknown) {
  const prompt = stringField(body, "prompt");
  const tier = stringField(body, "tier");
  if (!prompt) return sendError(res, 400, "Request body needs a non-empty `prompt` string.");
  const known = TIERS.find((t) => t === tier);
  if (!known) return sendError(res, 400, `\`tier\` must be one of ${TIERS.join(", ")}. Got: ${tier ?? "(missing)"}.`);

  const stream = await client.chat.send({
    chatRequest: {
      model: MODEL,
      messages: [
        { role: "system", content: ANSWER_PROMPT[known] },
        { role: "user", content: prompt },
      ],
      stream: true,
    },
  });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(content);
  }
  res.end();
}

/**
 * Dev-server endpoints that call OpenRouter, so the API key never reaches the browser.
 * - POST /api/classify `{ prompt }` -> `{ tier, confidence }`
 * - POST /api/answer `{ prompt, tier }` -> streamed plain text
 */
export function openRouterApi(apiKey: string | undefined): Plugin {
  return {
    name: "nio-openrouter",
    configureServer(server) {
      const client = apiKey ? new OpenRouter({ apiKey }) : null;
      server.middlewares.use(async (req, res, next) => {
        const handler =
          req.method !== "POST" ? undefined : req.url === "/api/classify" ? classify : req.url === "/api/answer" ? answer : undefined;
        if (!handler) return next();
        if (!client) return sendError(res, 500, "OPENROUTER_API_KEY is not set. Add it to .env and restart the dev server.");

        let body: unknown;
        try {
          body = await readJson(req);
        } catch {
          return sendError(res, 400, "Request body is not valid JSON.");
        }

        try {
          await handler(client, res, body);
        } catch (e) {
          const message = `OpenRouter request to ${MODEL} failed: ${describe(e)}`;
          if (res.headersSent) {
            res.end(`\n\n[${message}]`);
          } else {
            sendError(res, 502, message);
          }
        }
      });
    },
  };
}
