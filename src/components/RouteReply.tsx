import { useEffect, useMemo, useRef, useState } from "react";
import { usePhases } from "../hooks";
import { useAnswer, useRating } from "../llm";
import type { Rating } from "../rating";
import { routePrompt, type Routing } from "../sim/classify";
import { count, percent, reduction, seconds, usd } from "../sim/format";
import { sound } from "../sound";
import { TIER_LABEL, TIERS } from "../sim/workers";
import { CountUp } from "./CountUp";
import { StatTable } from "./StatTable";
import styles from "./RouteReply.module.css";

const ROW_Y = [26, 72, 118, 164] as const;
const RATER = { x: 196, y: 95 };
const WORKER_X = 372;
const WHEEL_ROW = 18;
const WHEEL_CYCLES = 3;

/** Times, in ms after mount, at which each stage starts. */
const STAGES = [500, 2400, 3900, 5200] as const;

/** Asks the router model for a tier, then shows the routing trace and the streamed answer. */
export function RouteReply({ prompt }: { prompt: string }) {
  const rating = useRating(prompt);

  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    sound.play("loading");
  }, []);

  if (rating.status === "rated") return <Routed prompt={prompt} rating={rating.rating} />;

  return (
    <div>
      <div className={styles.traceHead}>
        <span className={styles.headLabel}>routing</span>
        <span className={styles.status} data-live={rating.status === "rating"}>
          <i className={styles.pulse} aria-hidden="true" />
          {rating.status === "rating" ? "reading prompt" : "router unavailable"}
        </span>
      </div>
      {rating.status === "failed" && (
        <p className={styles.answer} role="alert">
          Could not rate this prompt, so nothing was sent to a worker. {rating.message}
        </p>
      )}
    </div>
  );
}

function Routed({ prompt, rating }: { prompt: string; rating: Rating }) {
  const routing = useMemo(() => routePrompt(prompt, rating), [prompt, rating]);
  const phase = usePhases(STAGES);
  const [open, setOpen] = useState(true);
  const { classification: c, chosen } = routing;

  const answer = useAnswer(prompt, c.tier);
  const rated = phase >= 1;
  const fanned = phase >= 2;
  const picked = phase >= 3;
  const answering = phase >= 4;
  const finished = answering && answer.status === "done";

  useEffect(() => {
    if (picked) sound.play("select");
  }, [picked]);

  useEffect(() => {
    if (finished) sound.play("ready", { emphasis: "strong" });
  }, [finished]);

  const landing = TIERS.indexOf(c.tier);
  const wheelWords = Array.from({ length: WHEEL_CYCLES * TIERS.length + TIERS.length }, (_, i) => TIERS[i % TIERS.length]);
  const wheelShift = -(WHEEL_CYCLES * TIERS.length + landing) * WHEEL_ROW;

  return (
    <div>
      <button
        type="button"
        className={styles.traceHead}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        {...(open ? { "data-cuelume-close": "" } : { "data-cuelume-open": "" })}
      >
        <span className={styles.headLabel}>routing</span>
        <span className={styles.status} data-live={!picked}>
          <i className={styles.pulse} aria-hidden="true" />
          {picked ? `rated ${c.tier} · ${chosen.worker.model}` : rated ? (fanned ? "matching workers" : "rating difficulty") : "reading prompt"}
        </span>
        <svg className={styles.chevron} data-open={open} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={styles.collapse} data-open={open}>
        <div className={styles.inner}>
          <svg className={styles.svg} viewBox="0 0 640 190" role="img" aria-label={`Prompt rated ${c.tier}, routed to ${chosen.worker.model}`}>
            <defs>
              <clipPath id={`wheel-${routing.prompt.length}-${c.score}`}>
                <rect x={RATER.x - 60} y={RATER.y + 14} width="120" height={WHEEL_ROW} />
              </clipPath>
            </defs>

            {/* prompt -> rater */}
            <text x="0" y={RATER.y + 28} className={styles.cap}>
              prompt
            </text>
            <circle cx="6" cy={RATER.y} r="3.5" className={styles.dotInk} />
            <path d={`M10 ${RATER.y} H ${RATER.x - 5}`} pathLength={1} className={styles.line} data-on={rated} />

            {/* rater */}
            <circle cx={RATER.x} cy={RATER.y} r="3.5" className={styles.dotInk} data-on={rated} style={{ opacity: rated ? 1 : 0 }} />
            <text x={RATER.x} y={RATER.y - 14} textAnchor="middle" className={styles.cap} style={{ opacity: rated ? 1 : 0 }}>
              rate
            </text>
            <g clipPath={`url(#wheel-${routing.prompt.length}-${c.score})`}>
              <g
                className={styles.wheel}
                style={{ transform: rated ? `translateY(${wheelShift}px)` : "translateY(0)", opacity: rated ? 1 : 0 }}
              >
                {wheelWords.map((tier, i) => (
                  <text
                    key={i}
                    x={RATER.x}
                    y={RATER.y + 14 + 13 + i * WHEEL_ROW}
                    textAnchor="middle"
                    className={styles.wheelWord}
                  >
                    {TIER_LABEL[tier].toLowerCase()}
                  </text>
                ))}
              </g>
            </g>
            <text x={RATER.x} y={RATER.y + 50} textAnchor="middle" className={styles.cap} style={{ opacity: fanned ? 1 : 0 }}>
              {percent(c.confidence * 100)} sure
            </text>

            {/* workers */}
            {routing.candidates.map((cand, i) => {
              const y = ROW_Y[i];
              const isChosen = cand.chosen;
              const weak = cand.quality < 0.85;
              const d = `M${RATER.x + 5} ${RATER.y} C ${RATER.x + 90} ${RATER.y}, ${WORKER_X - 90} ${y}, ${WORKER_X - 6} ${y}`;
              return (
                <g key={cand.worker.id}>
                  <path d={d} pathLength={1} className={styles.line} data-on={fanned} data-dash={weak} data-weak={weak} data-dim={picked && !isChosen} />
                  {isChosen && <path d={d} pathLength={1} className={styles.lineInk} data-on={picked} />}
                  <circle
                    cx={WORKER_X}
                    cy={y}
                    r="3.5"
                    className={isChosen && picked ? styles.dotOk : styles.dotHollow}
                    style={{ opacity: fanned ? 1 : 0 }}
                  />
                  <text
                    x={WORKER_X + 14}
                    y={y + 4}
                    className={styles.worker}
                    data-state={!fanned ? "off" : picked ? (isChosen ? "chosen" : "dim") : "idle"}
                  >
                    {cand.worker.model}
                  </text>
                  <text
                    x="640"
                    y={y + 4}
                    textAnchor="end"
                    className={styles.meta}
                    data-weak={weak}
                    style={{ opacity: fanned ? (picked && !isChosen ? 0.5 : 1) : 0 }}
                  >
                    {weak ? "below quality bar" : `${usd(cand.costUsd)} · ${seconds(cand.latencyMs)}`}
                  </text>
                </g>
              );
            })}
          </svg>

          <p className={styles.caption} style={{ opacity: picked ? 1 : 0 }}>
            rated {c.tier} · routed to {chosen.worker.model} ({chosen.worker.host})
          </p>
        </div>
      </div>

      <p className={styles.answer} style={{ opacity: answering ? 1 : 0 }}>
        {answering && answer.text}
        {answering && answer.status === "streaming" && <span className={styles.caret} />}
      </p>
      {answering && answer.status === "failed" && (
        <p className={styles.answer} role="alert">
          {chosen.worker.model} stopped before finishing. {answer.message}
        </p>
      )}

      <Stats routing={routing} show={finished} />
    </div>
  );
}

function Stats({ routing, show }: { routing: Routing; show: boolean }) {
  const w = routing.without;
  const n = routing.with;
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    if (!show || counted) return;
    setCounted(true);
    sound.play("count", { duration: 900 });
  }, [show, counted]);

  const cost = reduction(w.costUsd, n.costUsd);
  const speed = reduction(w.latencyMs, n.latencyMs);

  return (
    <StatTable
      show={show}
      rows={[
        { label: "model", without: w.worker.model, with: n.worker.model },
        {
          label: "tokens in",
          without: <CountUp active={show} value={w.inputTokens} format={count} />,
          with: <CountUp active={show} value={n.inputTokens} format={count} />,
        },
        {
          label: "tokens out",
          without: <CountUp active={show} value={w.outputTokens} format={count} />,
          with: <CountUp active={show} value={n.outputTokens} format={count} />,
        },
        {
          label: "cost",
          without: <CountUp active={show} value={w.costUsd} format={usd} />,
          with: <CountUp active={show} value={n.costUsd} format={usd} />,
        },
        {
          label: "latency",
          without: <CountUp active={show} value={w.latencyMs} format={seconds} />,
          with: <CountUp active={show} value={n.latencyMs} format={seconds} />,
        },
      ]}
      note={`${cost}% cheaper, ${speed}% faster. Quality ${percent(w.quality * 100)} to ${percent(n.quality * 100)}.`}
    />
  );
}
