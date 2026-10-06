import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { ChatScreen } from "./ChatScreen";
import { FlowConnectors, FlowLabel } from "./FlowConnectors";
import { baseline, withNio, withoutNio, query } from "../data/mock";
import type { PhoneMessage } from "../types";
import styles from "./PhoneFlow.module.css";

/** Build conversation arrays from mock data. */
function buildCenterMessages(): PhoneMessage[] {
  return [];
}

function buildWithNioMessages(): PhoneMessage[] {
  return [
    { id: "u1", role: "user", text: [query] },
    { id: "a1", role: "assistant", text: withNio.response },
  ];
}

function buildWithoutNioMessages(): PhoneMessage[] {
  return [
    { id: "u1", role: "user", text: [query] },
    { id: "a1", role: "assistant", text: withoutNio.response },
  ];
}

/**
 * The central branching visual: center phone (higher) → left/right phones (lower).
 * Connectors and labels are positioned in CSS for responsive symmetry.
 */
export function PhoneFlow() {
  const [layout, setLayout] = useState({
    center: { x: 0, y: 0, w: 0, h: 0 },
    left: { x: 0, y: 0, w: 0, h: 0 },
    right: { x: 0, y: 0, w: 0, h: 0 },
  });
  const flowRef = useRef<HTMLDivElement | null>(null);

  /* Measure phone positions once rendered to draw connectors precisely. */
  useEffect(() => {
    const root = flowRef.current;
    if (!root) return;

    const measure = () => {
      const centerEl = root.querySelector('[data-phone="center"]') as HTMLElement;
      const leftEl = root.querySelector('[data-phone="left"]') as HTMLElement;
      const rightEl = root.querySelector('[data-phone="right"]') as HTMLElement;
      if (!centerEl || !leftEl || !rightEl) return;

      setLayout({
        center: {
          x: centerEl.offsetLeft + centerEl.offsetWidth,
          y: centerEl.offsetTop + centerEl.offsetHeight * 0.38,
          w: centerEl.offsetWidth,
          h: centerEl.offsetHeight,
        },
        left: {
          x: leftEl.offsetLeft + leftEl.offsetWidth,
          y: leftEl.offsetTop,
          w: leftEl.offsetWidth,
          h: leftEl.offsetHeight,
        },
        right: {
          x: rightEl.offsetLeft,
          y: rightEl.offsetTop,
          w: rightEl.offsetWidth,
          h: rightEl.offsetHeight,
        },
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const { center: c, left: l } = layout;

  /* Connector coordinates: horizontal from center edge to mid-gap, then vertical down to phone top. */
  const gap = Math.max(24, (c.x - l.x - l.w) / 2);
  const yTop = c.y;
  const yBottom = l.y - 8;

  return (
    <section
      ref={flowRef}
      className={styles.section}
      aria-labelledby="phone-flow-title"
    >
      <h2 id="phone-flow-title" className={styles.visuallyHidden}>
        Execution path comparison
      </h2>

      <div className={styles.phonesWrapper}>
        {/* LEFT phone — With NIO */}
        <PhoneFrame
          data-phone="left"
          label="With NIO execution path"
          className={styles.leftPhone}
        >
          <ChatScreen
            title="NIO Chat"
            model={withNio.model}
            messages={buildWithNioMessages()}
            showSources={true}
            sourceLabels={withNio.sources}
            variant="chat"
            label="With NIO conversation"
          />
        </PhoneFrame>

        {/* CENTER phone — Source query */}
        <PhoneFrame
          data-phone="center"
          label="Original query input"
          className={styles.centerPhone}
        >
          <ChatScreen
            title="ChatGPT"
            model={baseline.model}
            messages={buildCenterMessages()}
            variant="empty"
            label="Query input screen"
          />
        </PhoneFrame>

        {/* RIGHT phone — Without NIO */}
        <PhoneFrame
          data-phone="right"
          label="Without NIO execution path"
          className={styles.rightPhone}
        >
          <ChatScreen
            title="ChatGPT"
            model={withoutNio.model}
            messages={buildWithoutNioMessages()}
            showSources={false}
            sourceLabels={[]}
            variant="chat"
            label="Without NIO conversation"
          />
        </PhoneFrame>

        {/* Connectors + labels — only render when layout is measured */}
        {c.w > 0 && (
          <>
            <FlowConnectors
              left={{
                xStart: c.x - c.w,
                xEnd: c.x - c.w - gap,
                yTop,
                yBottom,
              }}
              right={{
                xStart: c.x,
                xEnd: c.x + gap,
                yTop,
                yBottom,
              }}
            />

            <FlowLabel
              x={c.x - c.w - gap}
              yTop={yTop}
              yBottom={yBottom}
              topText="with"
              bottomText="NIO"
              className={styles.withLabel}
            />

            <FlowLabel
              x={c.x + gap}
              yTop={yTop}
              yBottom={yBottom}
              topText="without"
              bottomText="NIO"
              className={`${styles.withoutLabel} ${styles.without}`}
            />
          </>
        )}
      </div>
    </section>
  );
}