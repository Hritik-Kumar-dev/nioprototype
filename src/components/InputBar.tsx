import { MicIcon, PlusIcon, GridIcon, SendIcon } from "./icons";
import styles from "./InputBar.module.css";

/**
 * Bottom input dock: capsule input with send button, then mic / + / Tools row.
 * Shared by all three phones.
 */
export function InputBar() {
  return (
    <div className={styles.dock} aria-hidden="true">
      <div className={styles.inputWrap}>
        <input
          type="text"
          className={styles.input}
          placeholder="Type your query…"
          aria-label="Type your query"
        />
        <button type="button" className={styles.send} aria-label="Send">
          <SendIcon size={13} />
        </button>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} aria-label="Voice">
          <MicIcon size={14} />
        </button>
        <button type="button" className={styles.actionBtn} aria-label="Attach">
          <PlusIcon size={15} />
        </button>
        <button type="button" className={styles.toolsPill} aria-label="Tools">
          <GridIcon size={11} />
          <span className={styles.toolsLabel}>Tools</span>
        </button>
      </div>
    </div>
  );
}