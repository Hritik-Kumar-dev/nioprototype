import styles from "./FlowConnectors.module.css";

/**
 * Left and right connector SVGs with sharp 90° corners and arrowheads.
 * Coordinates are expressed in the PhoneFlow design space and scaled by the
 * SVG viewBox so they stay aligned with the phones at every viewport width.
 */
export function FlowConnectors({
  left,
  right,
  viewBox = "0 0 920 600",
}: {
  left: { xStart: number; xEnd: number; yTop: number; yBottom: number };
  right: { xStart: number; xEnd: number; yTop: number; yBottom: number };
  viewBox?: string;
}) {
  const arrowSize = 6;

  return (
    <svg
      className={styles.svg}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Flow connectors from center phone to side phones"
    >
      <g stroke="var(--blue)" strokeWidth="1.7" fill="none" strokeLinecap="square" strokeLinejoin="miter">
        {/* LEFT connector: horizontal left, then 90° down */}
        <path
          d={`
            M ${left.xStart} ${left.yTop}
            H ${left.xEnd}
            V ${left.yBottom}
          `}
        />
        {/* Arrowhead at bottom of left vertical */}
        <path
          d={`
            M ${left.xEnd - arrowSize} ${left.yBottom - arrowSize}
            L ${left.xEnd} ${left.yBottom}
            L ${left.xEnd + arrowSize} ${left.yBottom - arrowSize}
          `}
          fill="var(--blue)"
        />

        {/* RIGHT connector: horizontal right, then 90° down */}
        <path
          d={`
            M ${right.xStart} ${right.yTop}
            H ${right.xEnd}
            V ${right.yBottom}
          `}
        />
        {/* Arrowhead at bottom of right vertical */}
        <path
          d={`
            M ${right.xEnd - arrowSize} ${right.yBottom - arrowSize}
            L ${right.xEnd} ${right.yBottom}
            L ${right.xEnd + arrowSize} ${right.yBottom - arrowSize}
          `}
          fill="var(--blue)"
        />
      </g>
    </svg>
  );
}

/**
 * Vertical "with NIO" / "without NIO" labels placed beside the vertical segments.
 * Positioned in percentages of the stage so they scale with the layout.
 */
export function FlowLabel({
  leftPct,
  topPct,
  topText,
  bottomText,
  variant = "blue",
  className,
}: {
  leftPct: number;
  topPct: number;
  topText: string;
  bottomText: string;
  /** "neutral" renders the label text in the default text colour. */
  variant?: "blue" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={`${styles.labelWrap} ${variant === "neutral" ? styles.neutral : ""} ${className ?? ""}`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      <span className={styles.top}>{topText}</span>
      <span className={styles.bottom}>{bottomText}</span>
    </div>
  );
}
