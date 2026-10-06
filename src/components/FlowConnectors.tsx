import styles from "./FlowConnectors.module.css";

/**
 * Left and right connector SVGs with sharp 90° corners and arrowheads.
 * Takes explicit pixel coordinates so we can center perfectly.
 */
export function FlowConnectors({
  left,
  right,
}: {
  left: { xStart: number; xEnd: number; yTop: number; yBottom: number };
  right: { xStart: number; xEnd: number; yTop: number; yBottom: number };
}) {
  const arrowSize = 6;

  return (
    <svg
      className={styles.svg}
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
 */
export function FlowLabel({
  x,
  yTop,
  yBottom,
  topText,
  bottomText,
  className,
}: {
  x: number;
  yTop: number;
  yBottom: number;
  topText: string;
  bottomText: string;
  className?: string;
}) {
  const midY = (yTop + yBottom) / 2 - 2;
  return (
    <div
      className={`${styles.labelWrap} ${className ?? ""}`}
      style={{
        left: x,
        top: midY,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      <span className={styles.top}>{topText}</span>
      <span className={styles.bottom}>{bottomText}</span>
    </div>
  );
}