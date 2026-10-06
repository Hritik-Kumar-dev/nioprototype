import { useEffect, useRef, useState } from "react";
import styles from "./Typewriter.module.css";

export interface TypewriterProps {
  /** The text to reveal. Re-typing starts whenever this value changes. */
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  className?: string;
}

/**
 * Reveals `text` one character at a time whenever it changes.
 *
 * The full text is kept in the layout (invisibly) so table rows and metric
 * lists don't jump or reflow while the value is being typed. Honours
 * `prefers-reduced-motion` by swapping the text in immediately.
 */
export function Typewriter({ text, speed = 26, className }: TypewriterProps) {
  const [shown, setShown] = useState(text);
  const [typing, setTyping] = useState(false);
  const previous = useRef(text);

  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      setTyping(false);
      return;
    }

    setTyping(true);
    setShown("");

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setTyping(false);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <span
      className={`${styles.wrap} ${className ?? ""}`}
      data-typing={typing ? "true" : undefined}
    >
      {/* Reserves the final width so the row never reflows mid-typing. */}
      <span className={styles.ghost} aria-hidden="true">
        {text}
      </span>
      <span className={styles.live} aria-hidden="true">
        {shown}
      </span>
      {/* Single announcement for assistive tech, regardless of animation. */}
      <span className="srOnly">{text}</span>
    </span>
  );
}
