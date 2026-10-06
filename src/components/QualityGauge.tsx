import { useEffect, useRef, useState } from "react";
import styles from "./QualityGauge.module.css";

export interface QualityGaugeProps {
  /** 0–100. */
  value: number;
  /** Rendered pixel diameter (arc uses this minus stroke). */
  size?: number;
  label?: string;
}

const STROKE = 8;

/**
 * Circular progress gauge. Animates 0 → value once on first appearance
 * (disabled under prefers-reduced-motion).
 */
export function QualityGauge({ value, size = 96, label = "QUALITY" }: QualityGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - STROKE) / 2;
  const c = 2 * Math.PI * r;

  const ref = useRef<SVGCircleElement | null>(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;

    if (reduced || !el) {
      setShown(clamped);
      return;
    }

    // Respect page-load fade: start once the gauge is actually visible.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();

        const t0 = performance.now();
        const DURATION = 800;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / DURATION);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setShown(clamped * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [clamped]);

  return (
    <div
      className={styles.wrap}
      role="img"
      aria-label={`${label.charAt(0).toUpperCase() + label.slice(1)} ${Math.round(clamped)} percent`}
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
