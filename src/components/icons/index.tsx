import type { SVGProps } from "react";

/**
 * Small hand-written inline SVG icons. All inherit `currentColor`,
 * accept a `size` (default 16) and spread extra SVGProps.
 */

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number;
}

function base(props: IconProps) {
  const { size, ...rest } = props;
  return {
    width: size ?? 16,
    height: size ?? 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    ...rest,
  };
}

/** Outline chat bubble (header icon). */
export function ChatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/** Four-point sparkle / star. */
export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.9 5.7a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Small 2x2 grid ("Tools" pill icon). */
export function GridIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 11.2 19 5l-4.6 14.5-3.1-5.6-6.8-2.7z" />
      <path d="m11.3 13.9 3.4-3.6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

/** Check inside a circle (feature chips, ON state). */
export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.8 2.8L16.5 9" />
    </svg>
  );
}

/** Circle with a slash (feature chips, OFF state). */
export function MinusCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

/** Round user / NIO avatar icon. */
export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7.5 3v5.2c0 4.6-3.2 8.3-7.5 9.8-4.3-1.5-7.5-5.2-7.5-9.8V6L12 3z" />
      <path d="m9 12 2.2 2.2L15.5 9.7" />
    </svg>
  );
}

/** Database — RAG chip. */
export function DatabaseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6.5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V5.5" />
      <path d="M4.5 12v6.5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V12" />
    </svg>
  );
}

/** Wrench — Tools chip. */
export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.7 6.3a4.6 4.6 0 0 0-6 6L3.5 17.5a2.1 2.1 0 0 0 3 3l5.2-5.2a4.6 4.6 0 0 0 6-6L14.6 12l-2.6-2.6 2.7-3.1z" />
    </svg>
  );
}

/** Lightning bolt — Cache chip. */
export function CacheIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 2.5 4.5 13.5H11L9.8 21.5 18.5 10.5H12L13 2.5z" />
    </svg>
  );
}

/** Link — grounded-source chips. */
export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 14a4.4 4.4 0 0 0 6.6.4l2.6-2.6a4.4 4.4 0 0 0-6.2-6.2l-1.5 1.5" />
      <path d="M14 10a4.4 4.4 0 0 0-6.6-.4l-2.6 2.6a4.4 4.4 0 0 0 6.2 6.2l1.5-1.5" />
    </svg>
  );
}

/* ---- Status bar glyphs (phone) ------------------------------------ */

export function SignalIcon(props: IconProps) {
  return (
    <svg {...base(props)} stroke="none" fill="currentColor">
      <rect x="3" y="14" width="3" height="6" rx="0.8" />
      <rect x="8" y="11" width="3" height="9" rx="0.8" />
      <rect x="13" y="8" width="3" height="12" rx="0.8" />
      <rect x="18" y="5" width="3" height="15" rx="0.8" />
    </svg>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5a12.5 12.5 0 0 1 16 0" />
      <path d="M7 13a8.5 8.5 0 0 1 10 0" />
      <path d="M10 16.4a4.2 4.2 0 0 1 4 0" />
      <circle cx="12" cy="19.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BatteryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="8" width="16" height="8" rx="2.2" />
      <rect x="4.5" y="10" width="9" height="4" rx="1" fill="currentColor" stroke="none" />
      <path d="M21 10.8v2.4" strokeWidth="2.4" />
    </svg>
  );
}
