import { useEffect, useRef, useState } from "react";
import styles from "./QualityGauge.module.css";

export interface QualityGaugeProps {
  /** 0–100. */
  value: number;
  /** Rendered pixel diameter (arc uses this minus stroke). */
  size?: number;
  label?: string;
}

const STROKE = 9;

/**
 * Circular progress gauge. Animates from its current value to the new value
 * whenever `value` changes (disabled under prefers-reduced-motion).
 */
export function QualityGauge({ value, size = 96, label = "QUALITY" }: QualityGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - STROKE) / 2;
  const c = 2 * Math.PI * r;

  const ref = useRef<SVGCircleElement | null>(null);
  const shownRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shownRef.current;
    const to = clamped;

    if (reduced || from === to) {
      shownRef.current = to;
      setShown(to);
      return;
    }

    const t0 = performance.now();
    const DURATION = 650;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const next = from + (to - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
          ref={ref}
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
