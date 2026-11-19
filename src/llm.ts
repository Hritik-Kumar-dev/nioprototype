import { useEffect, useState } from "react";
import { Rating } from "./rating";
import type { Tier } from "./sim/workers";

async function errorOf(res: Response) {
  const body: unknown = await res.json().catch(() => null);
  const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : null;
  return message ?? `Request failed with HTTP ${res.status}.`;
}

function post(path: string, body: object, signal: AbortSignal) {
  return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
}

export type RatingState =
  | { status: "rating" }
  | { status: "rated"; rating: Rating }
  | { status: "failed"; message: string };

/** Asks the router model how hard `prompt` is. */
export function useRating(prompt: string) {
  const [state, setState] = useState<RatingState>({ status: "rating" });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "rating" });
    (async () => {
      const res = await post("/api/classify", { prompt }, ctrl.signal);
      if (!res.ok) return setState({ status: "failed", message: await errorOf(res) });
      const rating = Rating.parse(await res.json());
      setState(rating ? { status: "rated", rating } : { status: "failed", message: "The router returned a rating in an unexpected shape." });
    })().catch((e: unknown) => {
      if (!ctrl.signal.aborted) setState({ status: "failed", message: e instanceof Error ? e.message : String(e) });
    });
    return () => ctrl.abort();
  }, [prompt]);

  return state;
}

export type AnswerState =
  | { status: "streaming"; text: string }
  | { status: "done"; text: string }
  | { status: "failed"; text: string; message: string };

/** Streams the answer for `prompt` from the worker serving `tier`. */
export function useAnswer(prompt: string, tier: Tier) {
  const [state, setState] = useState<AnswerState>({ status: "streaming", text: "" });

  useEffect(() => {
    const ctrl = new AbortController();
    let text = "";
    setState({ status: "streaming", text });
    (async () => {
      const res = await post("/api/answer", { prompt, tier }, ctrl.signal);
      if (!res.ok || !res.body) return setState({ status: "failed", text, message: await errorOf(res) });
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += value;
        setState({ status: "streaming", text });
      }
      setState({ status: "done", text });
    })().catch((e: unknown) => {
      if (!ctrl.signal.aborted) setState({ status: "failed", text, message: e instanceof Error ? e.message : String(e) });
    });
    return () => ctrl.abort();
  }, [prompt, tier]);

  return state;
}
