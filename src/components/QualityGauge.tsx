import { useEffect, useState } from "react";
import styles from "./QualityGauge.module.css";

export interface QualityGaugeProps {
  /** 0–100. */
  value: number;
  /** Rendered pixel diameter (arc uses this minus stroke). */
  size?: number;
  label?: string;
}

const STROKE = 9;
/** Pause so the previous reading is visible before the arc sweeps again. */
const RESTART_DELAY = 140;
const DURATION = 900;

/**
 * Circular progress gauge. The arc empties and sweeps up to the new value
 * every time `value` changes (a single 0 → value sweep under
 * prefers-reduced-motion is skipped and the value is set directly).
 */
export function QualityGauge({ value, size = 96, label = "QUALITY" }: QualityGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - STROKE) / 2;
  const c = 2 * Math.PI * r;

  const [shown, setShown] = useState(0);

  useEffect(() => {
    const to = clamped;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(to);
      return;
    }

    let raf: number | null = null;

    /* Hold the previous reading for a beat, then sweep 0 → value. */
    const delay = window.setTimeout(() => {
      setShown(0);
      const start = performance.now();

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setShown(to * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, RESTART_DELAY);

    return () => {
      window.clearTimeout(delay);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [clamped]);

  return (
    <div
      className={styles.wrap}
      role="img"
      aria-label={`${label.charAt(0).toUpperCase() + label.slice(1)} ${Math.round(
        clamped
      )} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--blue)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={styles.arc}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value}>{Math.round(shown)}%</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
