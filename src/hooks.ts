import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Number of `times` (ms from mount) that have passed so far. */
export function usePhases(times: readonly number[]) {
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? times.length : 0));
  const timesRef = useRef(times);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ids = timesRef.current.map((t, i) => window.setTimeout(() => setPhase(i + 1), t));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, []);

  return phase;
}

/** Reveals `text` one character at a time once `active` is true. */
export function useTyped(text: string, active: boolean, charsPerSecond = 80) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setCount(text.length);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const next = Math.min(text.length, Math.max(0, Math.floor(((now - start) / 1000) * charsPerSecond)));
      setCount(next);
      if (next < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, text, charsPerSecond]);

  return { shown: text.slice(0, count), done: active && count >= text.length };
}

/** Eases from 0 to `target` over `ms` once `active` is true. */
export function useCountUp(target: number, active: boolean, ms = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setValue(target * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);

  return value;
}

/** Index 0..total-1 that advances linearly over `ms`, and whether it has finished. */
export function useElapsed(ms: number, total: number) {
  const [index, setIndex] = useState(() => (prefersReducedMotion() ? total - 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setIndex(Math.min(total - 1, Math.floor(t * total)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ms, total]);

  return index;
}
