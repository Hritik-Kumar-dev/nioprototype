import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { COMMANDS, type Command } from "../commands";
import { sound } from "../sound";
import styles from "./Composer.module.css";

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value.startsWith("/") && !value.includes(" ") ? value.toLowerCase() : null;
  const matches: Command[] = query === null ? [] : COMMANDS.filter((c) => c.trigger.startsWith(query));
  const menuOpen = matches.length > 0;

  const wasOpen = useRef(false);
  useEffect(() => {
    if (menuOpen && !wasOpen.current) sound.play("open");
    if (!menuOpen && wasOpen.current) sound.play("close");
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    setActive(0);
  };

  const pick = (command: Command) => {
    submit(command.trigger);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (menuOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setActive((i) => (i + dir + matches.length) % matches.length);
        sound.play("select", { direction: dir === 1 ? "forward" : "back" });
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        setValue(matches[active % matches.length].trigger);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setValue("");
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        pick(matches[active % matches.length]);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className={styles.dock}>
      <div className={styles.inner}>
        <div className={styles.anchor}>
        {menuOpen && (
          <ul className={styles.menu} role="listbox" aria-label="Test scenarios">
            {matches.map((c, i) => (
              <li key={c.id} role="option" aria-selected={i === active % matches.length}>
                <button
                  type="button"
                  className={styles.item}
                  data-active={i === active % matches.length}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c)}
                >
                  <span>{c.trigger}</span>
                  <span className={styles.hint}>{c.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.field}>
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask anything, or type / for tests"
            aria-label="Message"
            autoComplete="off"
            spellCheck={false}
            data-cuelume-type=""
          />
          <button
            type="button"
            className={styles.send}
            onClick={() => submit(value)}
            disabled={!canSend}
            aria-label="Send"
            data-cuelume-tap=""
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        </div>
        <p className={styles.foot}>simulated routing. no real models are called.</p>
      </div>
    </div>
  );
}
