import { useEffect, useRef, useState } from "react";
import styles from "./TrendChart.module.css";

export interface TrendChartProps {
  data: number[];
  labels: string[];
  /** Four Y-axis tick values, ascending, first must be 0. */
  yTicks: [number, number, number, number];
  /** Maximum of the Y scale — identical across all charts on the page. */
  yMax: number;
  /** Whether to show the area fill under the line. Defaults to true. */
  showArea?: boolean;
  /** Opacity of the area fill, if shown. Defaults to 0.05 (5%). */
  areaOpacity?: number;
  /** Optional cap on the rendered width, so charts stay compact vertically. */
  maxWidth?: number;
  /** Render axis labels + gridlines. Set false for a compact sparkline. */
  showLabels?: boolean;
}

const VB_W = 420;
const VB_H = 130;

/**
 * Hand-written responsive SVG line chart. All charts on the page share the
 * same viewBox and Y scale (0–900) so the trend lines are directly
 * comparable. Draws in whenever the series changes.
 */
export function TrendChart({
  data,
  labels,
  yTicks,
  yMax,
  showArea = true,
  areaOpacity = 0.05,
  maxWidth,
  showLabels = true,
}: TrendChartProps) {
  const [measured, setMeasured] = useState(VB_W);
  const width = maxWidth ? Math.min(measured, maxWidth) : measured;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<SVGPolylineElement | null>(null);
  const started = useRef("");

  const pad = showLabels
    ? { top: 10, right: 12, bottom: 22, left: 30 }
    : { top: 8, right: 6, bottom: 8, left: 6 };

  /* Responsive width via ResizeObserver, rendered in real pixels. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setMeasured(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.round(width * (VB_H / VB_W));

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = (i: number) =>
    pad.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / yMax) * innerH;

  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  /* Faint area fill under the line. */
  const areaPath =
    data.length > 0
      ? `M ${x(0)},${y(0)} L ${data
          .map((v, i) => `${x(i)},${y(v)}`)
          .join(" L ")} L ${x(data.length - 1)},${y(0)} Z`
      : "";

  /* Chart draw-in, replayed whenever the series changes (e.g. a new query). */
  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const key = data.join(",");
    if (started.current === key) return;
    started.current = key;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
    line.getBoundingClientRect(); // force layout before transitioning
    line.style.transition = "stroke-dashoffset 900ms ease-out";
    line.style.strokeDashoffset = "0";
  }, [data]);

  const summary =
    `Response score trend over ${labels.join(", ")}: ` +
    data.map((v, i) => `${labels[i]} ${v}`).join(", ") +
    `. Scale 0 to ${yMax}.`;

  return (
    <div
      ref={containerRef}
      className={styles.wrap}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        className={styles.svg}
      >
        {/* Horizontal gridlines + Y tick labels */}
        {showLabels &&
          yTicks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--text-2)"
                strokeWidth="1"
                opacity="0.25"
              />
              <text
                x={pad.left - 6}
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
        {showArea && (
          <path
            d={areaPath}
            fill="var(--blue)"
            opacity={areaOpacity}
            className={styles.area}
          />
        )}

        {/* The trend line */}
        <polyline
          ref={lineRef}
          points={points}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={styles.line}
        />

        {/* Points */}
        {data.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={showLabels ? 3.2 : 2.4}
            className={styles.point}
          />
        ))}

        {/* X labels */}
        {showLabels &&
          labels.map((l, i) => (
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
