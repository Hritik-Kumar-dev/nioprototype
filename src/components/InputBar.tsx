import { useState } from "react";
import type { FormEvent } from "react";
import { MicIcon, PlusIcon, GridIcon, SendIcon } from "./icons";
import styles from "./InputBar.module.css";

export interface InputBarProps {
  /**
   * Called with the trimmed message when the user submits. When omitted the
   * dock is decorative (the side phones) and the controls are inert.
   */
  onSend?: (text: string) => void;
  /** Placeholder shown in the text field. */
  placeholder?: string;
}

/**
 * Bottom input dock: capsule input with send button, then mic / + / Tools row.
 * Interactive on the centre phone, decorative elsewhere.
 */
export function InputBar({
  onSend,
  placeholder = "Type your query…",
}: InputBarProps) {
  const [value, setValue] = useState("");
  const interactive = Boolean(onSend);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || !onSend) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className={styles.dock}>
      <form className={styles.inputWrap} onSubmit={submit}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          aria-label={interactive ? "Type your query" : undefined}
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? undefined : -1}
          disabled={!interactive}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="submit"
          className={styles.send}
          aria-label="Send"
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? undefined : -1}
          disabled={!interactive}
        >
          <SendIcon size={13} />
        </button>
      </form>
      <div className={styles.actions} aria-hidden="true">
        <button type="button" className={styles.actionBtn} tabIndex={-1} disabled={!interactive}>
          <MicIcon size={14} />
        </button>
        <button type="button" className={styles.actionBtn} tabIndex={-1} disabled={!interactive}>
          <PlusIcon size={15} />
        </button>
        <button type="button" className={styles.toolsPill} tabIndex={-1} disabled={!interactive}>
          <GridIcon size={11} />
          <span className={styles.toolsLabel}>Tools</span>
        </button>
      </div>
    </div>
  );
}
