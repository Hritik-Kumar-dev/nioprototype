import type { PhoneMessage, QueryPreset } from "../types";
import { ChatBubble } from "./ChatBubble";
import { InputBar } from "./InputBar";
import { SparkleIcon, UserIcon } from "./icons";
import { SourceChip } from "./SourceChip";
import styles from "./ChatScreen.module.css";

export interface ChatScreenProps {
  /** Header title, e.g. "ChatGPT" or "NIO Chat". */
  title: string;
  /** Model pill text, e.g. "sonnet 4.5". */
  model: string;
  /** Conversation bubbles. Empty state when omitted/empty. */
  messages?: PhoneMessage[];
  /** Render grounded-source pills under the last assistant bubble. */
  showSources?: boolean;
  sourceLabels?: string[];
  /** "empty" shows the ready-when-you-are state; "chat" shows messages. */
  variant: "empty" | "chat";
  /** Accessible name for the screen region. */
  label: string;
  /** When set, the input dock becomes a working chat composer. */
  onSend?: (text: string) => void;
  /** Example prompts offered as chips above the input dock. */
  suggestions?: QueryPreset[];
  /** Small caption above the suggestion chips. */
  suggestLabel?: string;
  /** Placeholder for the input dock. */
  placeholder?: string;
}

/**
 * Phone screen content: header, conversation (or empty state), suggestion
 * chips, input bar. Shared by all three phones so their chrome is identical.
 */
export function ChatScreen({
  title,
  model,
  messages = [],
  showSources = false,
  sourceLabels = [],
  variant,
  label,
  onSend,
  suggestions,
  suggestLabel = "Try a task",
  placeholder,
}: ChatScreenProps) {
  const showEmpty = variant === "empty" || messages.length === 0;

  return (
    <div className={styles.screen} role="region" aria-label={label}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true">
          <UserIcon size={13} />
        </span>
        <span className={styles.headerTitle}>{title}</span>
        <span className={styles.modelPill}>
          {model}
          <svg
            width="7"
            height="7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {showEmpty ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <SparkleIcon size={22} />
            </span>
            <p className={styles.emptyText}>Ready when you are.</p>
          </div>
        ) : (
          <div className={styles.chat}>
            {messages.map((m, i) => (
              <ChatBubble
                key={m.id}
                message={m}
                showAvatar={m.role === "assistant"}
              >
                {showSources &&
                  m.role === "assistant" &&
                  i === messages.length - 1 &&
                  sourceLabels.length > 0 && (
                    <span className={styles.sourcesRow}>
                      {sourceLabels.map((s) => (
                        <SourceChip key={s} label={s} />
                      ))}
                    </span>
                  )}
              </ChatBubble>
            ))}
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className={styles.suggest}>
            <span className={styles.suggestLabel}>{suggestLabel}</span>
            <div className={styles.suggestChips}>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.suggestChip}
                  onClick={() => onSend?.(p.prompt)}
                >
                  <span
                    className={styles.kindDot}
                    data-kind={p.kind}
                    aria-hidden="true"
                  />
                  {p.chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input dock */}
      <InputBar onSend={onSend} placeholder={placeholder} />
    </div>
  );
}
