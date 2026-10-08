import { EXAMPLE_PROMPTS } from "../sim/classify";
import { TIERS, TIER_LABEL } from "../sim/workers";
import styles from "./Empty.module.css";

const WHEEL = ["cheap enough.", "fast enough.", "good enough."] as const;

export function Empty({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className={styles.empty}>
      <p className={styles.eyebrow}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M1.5 10.5v-9l9 9v-9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        NIO
        <span>orchestration for neural inference</span>
      </p>

      <h1 className={styles.hero}>
        <span className={styles.line}>Ask anything.</span>
        <span className={`${styles.line} ${styles.dim}`}>NIO picks the model</span>
        <span className={`${styles.line} ${styles.dim}`}>
          that is{" "}
          <span className={styles.window} aria-label="cheap, fast or good enough">
            <span className={styles.stack} aria-hidden="true">
              {[...WHEEL, WHEEL[0]].map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </span>
          </span>
        </span>
      </h1>

      <ul className={styles.list}>
        {TIERS.map((tier, i) => (
          <li key={tier} style={{ animationDelay: `${260 + i * 90}ms` }}>
            <button type="button" className={styles.row} onClick={() => onPick(EXAMPLE_PROMPTS[tier])} data-cuelume-select="">
              <span className={styles.tier}>{TIER_LABEL[tier].toLowerCase()}</span>
              <span className={styles.text}>{EXAMPLE_PROMPTS[tier]}</span>
              <span className={styles.arrow} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className={styles.tip}>
        Type <kbd>/</kbd> to run a test: traffic bursts, crashed pods, scheduler comparisons.
      </p>
    </div>
  );
}
