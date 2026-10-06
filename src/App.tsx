import { useEffect, useMemo, useRef, useState } from "react";
import { TopHeaderPanel } from "./components/TopHeaderPanel";
import { PhoneFlow } from "./components/PhoneFlow";
import { ComparisonCards } from "./components/ComparisonCards";
import { DEFAULT_QUERY, models, resolveQuery } from "./data/mock";
import styles from "./App.module.css";

/** Width of the design canvas the dashboard is laid out for. */
const DESIGN_WIDTH = 1200;
/** Below this viewport width we fall back to normal responsive scrolling. */
const MIN_FIT_WIDTH = 1024;

/**
 * Scales a fixed-width dashboard down so the whole thing is visible at once.
 * On narrow viewports the dashboard falls back to the normal responsive,
 * scrollable layout instead of shrinking to an unreadable size.
 */
function useFitToViewport() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const last = useRef({ scale: 1, fit: false });
  const [state, setState] = useState({ scale: 1, fit: false });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      const canFit = availW >= MIN_FIT_WIDTH;
      const naturalH = inner.scrollHeight;
      const scale =
        canFit && naturalH > 0
          ? Math.min(availW / DESIGN_WIDTH, availH / naturalH, 1)
          : 1;

      if (scale !== last.current.scale || canFit !== last.current.fit) {
        last.current = { scale, fit: canFit };
        setState({ scale, fit: canFit });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { outerRef, innerRef, ...state };
}

function App() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [sent, setSent] = useState(false);
  const [modelId, setModelId] = useState(models[0].id);

  const outcome = useMemo(() => resolveQuery(query, modelId), [query, modelId]);
  const { outerRef, innerRef, scale, fit } = useFitToViewport();

  const handleSend = (text: string) => {
    setQuery(text);
    setSent(true);
  };

  return (
    <div className={`${styles.page} ${fit ? "" : styles.pageScroll}`}>
      <div ref={outerRef} className={styles.fitOuter}>
        <div
          ref={innerRef}
          className={`${styles.inner} ${fit ? styles.fitted : ""}`}
          style={fit ? { width: DESIGN_WIDTH, transform: `scale(${scale})` } : undefined}
        >
          <main className={styles.main}>
            <TopHeaderPanel
              outcome={outcome}
              modelId={modelId}
              onModelChange={setModelId}
            />
            <PhoneFlow outcome={outcome} sent={sent} onSend={handleSend} />
            <ComparisonCards outcome={outcome} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
