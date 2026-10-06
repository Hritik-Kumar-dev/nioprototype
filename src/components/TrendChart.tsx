import { useEffect, useRef, useState } from "react";
import styles from "./TrendChart.module.css";

export interface TrendChartProps {
  data: number[];
  labels: string[];
  /** Four Y-axis tick values, ascending, first must be 0. */
  yTicks: [number, number, number, number];
  /** Maximum of the Y scale — identical across all charts on the page. */
  yMax: number;
}

const PAD = { top: 10, right: 12, bottom: 24, left: 30 };
const VB_W = 420;
const VB_H = 170;

/**
 * Hand-written responsive SVG line chart. All charts on the page share the
 * same viewBox, padding and Y scale (0–900) so the three trend lines are
 * directly comparable. Draws in once on first appearance.
 */
export function TrendChart({ data, labels, yTicks, yMax }: TrendChartProps) {
  const [width, setWidth] = useState(VB_W);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<SVGPolylineElement | null>(null);
  const started = useRef(false);

  /* Responsive width via ResizeObserver, rendered in real pixels. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.round(width * (VB_H / VB_W));

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  /* Faint area fill under the line. */
  const areaPath =
    data.length > 0
      ? `M ${x(0)},${y(0)} L ${data
          .map((v, i) => `${x(i)},${y(v)}`)
          .join(" L ")} L ${x(data.length - 1)},${y(0)} Z`
      : "";

  /* Chart draw-in, once. */
  useEffect(() => {
    const line = lineRef.current;
    if (!line || started.current) return;
    started.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
    line.getBoundingClientRect(); // force layout before transitioning
    line.style.transition = "stroke-dashoffset 900ms ease-out";
    line.style.strokeDashoffset = "0";
  }, [data]);

  const summary = `Response score trend over ${labels.join(", ")}: ` +
    data.map((v, i) => `${labels[i]} ${v}`).join(", ") +
    `. Scale 0 to ${yMax}.`;

  return (
    <div ref={containerRef} className={styles.wrap}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        className={styles.svg}
      >
        {/* Horizontal gridlines + Y tick labels */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border-soft)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className={styles.tickLabel}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Extremely faint area fill */}
        <path d={areaPath} fill="var(--cyan)" className={styles.area} />

        {/* The trend line */}
        <polyline
          ref={lineRef}
          points={points}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={styles.line}
        />

        {/* Points */}
        {data.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3.2" className={styles.point} />
        ))}

        {/* X labels */}
        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            className={styles.tickLabel}
          >
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}
