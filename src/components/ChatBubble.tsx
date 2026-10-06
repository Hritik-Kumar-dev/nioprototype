import type { ReactNode } from "react";
import type { PhoneMessage } from "../types";
import { UserIcon } from "./icons";
import styles from "./ChatBubble.module.css";

export interface ChatBubbleProps {
  message: PhoneMessage;
  /** Render a small round blue avatar beside assistant bubbles. */
  showAvatar?: boolean;
  /** Extra content (e.g. source pills) rendered inside the bubble. */
  children?: ReactNode;
}

export function ChatBubble({ message, showAvatar = false, children }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const bubble = (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
      {message.text.map((para, i) => (
        <p key={i} className={styles.para}>
          {para}
        </p>
      ))}
      {children}
    </div>
  );

  if (isUser) {
    return <div className={styles.userRow}>{bubble}</div>;
  }

  return (
    <div className={styles.assistantRow}>
      {showAvatar && (
        <span className={styles.avatar} aria-hidden="true">
          <UserIcon size={11} />
        </span>
      )}
      {bubble}
    </div>
  );
}
