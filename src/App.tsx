import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BurstReply } from "./components/BurstReply";
import { ClusterReply } from "./components/ClusterReply";
import { Composer } from "./components/Composer";
import { Empty } from "./components/Empty";
import { PolicyReply } from "./components/PolicyReply";
import { RouteReply } from "./components/RouteReply";
import { findCommand, type RunKind } from "./commands";
import { routePrompt, type Routing } from "./sim/classify";
import { startSound } from "./sound";
import styles from "./App.module.css";

type Theme = "light" | "dark";

function readTheme(): Theme {
  try {
    return localStorage.getItem("nio-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

type Message =
  | { id: number; kind: "user"; text: string }
  | { id: number; kind: "route"; routing: Routing }
  | { id: number; kind: "run"; run: RunKind };

function RunReply({ run }: { run: RunKind }) {
  switch (run) {
    case "burst":
      return <BurstReply scenario="burst" />;
    case "surge":
      return <BurstReply scenario="surge" />;
    case "crash":
    case "node":
    case "rollout":
      return <ClusterReply kind={run} />;
    case "policies":
      return <PolicyReply />;
  }
}

function Logo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" role="img" aria-label="NIO">
      <path d="M1.5 10.5v-9l9 9v-9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10.5" cy="1.5" r="1.8" fill="var(--ok)" />
    </svg>
  );
}

function Turn({ who, children }: { who: "you" | "NIO"; children: ReactNode }) {
  return (
    <article className={styles.turn} data-who={who}>
      <span className={styles.who}>{who === "NIO" ? <Logo size={13} /> : who}</span>
      <div className={styles.body}>{children}</div>
    </article>
  );
}

/** Keeps the thread pinned to the bottom while replies grow, unless the reader scrolled up. */
function useStickToBottom<T extends HTMLElement>() {
  const scroller = useRef<T>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    const inner = content.current;
    if (!el || !inner) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    const follow = () => {
      if (pinned.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(follow);
    ro.observe(inner);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  return { scroller, content, pin: () => (pinned.current = true) };
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const nextId = useRef(1);
  const { scroller, content, pin } = useStickToBottom<HTMLElement>();

  useEffect(() => {
    startSound();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nio-theme", theme);
    } catch {
      // Storage can be blocked. The theme still applies for this visit.
    }
  }, [theme]);

  const send = useCallback(
    (text: string) => {
      pin();
      const command = findCommand(text);
      const userId = nextId.current++;
      const replyId = nextId.current++;
      setMessages((m) => [
        ...m,
        { id: userId, kind: "user", text },
        command ? { id: replyId, kind: "run", run: command.id } : { id: replyId, kind: "route", routing: routePrompt(text) },
      ]);
    },
    [pin],
  );

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const clear = () => {
    setMessages([]);
  };

  return (
    <div className={styles.app}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <span className={styles.brand}>
            <Logo size={20} />
          </span>
          <div className={styles.actions}>
            {messages.length > 0 && (
              <button type="button" className={styles.link} onClick={clear} data-cuelume-close="">
                new chat
              </button>
            )}
            <button type="button" className={styles.link} onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} data-cuelume-toggle="">
              <span data-on={theme === "light"}>light</span>
              <span className={styles.sep}>/</span>
              <span data-on={theme === "dark"}>dark</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.thread} ref={scroller}>
        <div className={styles.column} ref={content}>
          {messages.length === 0 ? (
            <Empty onPick={send} />
          ) : (
            messages.map((m) =>
              m.kind === "user" ? (
                <Turn key={m.id} who="you">
                  <p className={styles.userText}>{m.text}</p>
                </Turn>
              ) : (
                <Turn key={m.id} who="NIO">
                  {m.kind === "route" ? <RouteReply routing={m.routing} /> : <RunReply run={m.run} />}
                </Turn>
              ),
            )
          )}
        </div>
      </main>

      <Composer onSend={send} />
    </div>
  );
}
