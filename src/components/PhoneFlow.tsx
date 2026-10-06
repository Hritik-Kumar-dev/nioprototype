import { PhoneFrame } from "./PhoneFrame";
import { ChatScreen } from "./ChatScreen";
import { FlowConnectors, FlowLabel } from "./FlowConnectors";
import { presets } from "../data/mock";
import type { PhoneMessage, QueryOutcome } from "../types";
import styles from "./PhoneFlow.module.css";

export interface PhoneFlowProps {
  outcome: QueryOutcome;
  /** Whether the user has submitted a query (drives the centre phone body). */
  sent: boolean;
  /** Called when the centre phone composer or a suggestion chip is used. */
  onSend: (text: string) => void;
}

/**
 * The central branching visual: all phones same width, positioned symmetrically
 * in a scaled 920 x 600 design space (see PhoneFlow.module.css). Connector and
 * label coordinates use the same design space so everything stays aligned and
 * the three phones never overlap at any viewport width.
 */
export function PhoneFlow({ outcome, sent, onSend }: PhoneFlowProps) {
  const { query, modelId, withNio, withoutNio } = outcome;

  const centerMessages: PhoneMessage[] = sent
    ? [{ id: "center-u", role: "user", text: [query] }]
    : [];

  const withNioMessages: PhoneMessage[] = [
    { id: "with-u", role: "user", text: [query] },
    { id: "with-a", role: "assistant", text: withNio.response },
  ];

  const withoutNioMessages: PhoneMessage[] = [
    { id: "without-u", role: "user", text: [query] },
    { id: "without-a", role: "assistant", text: withoutNio.response },
  ];

  return (
    <section className={styles.section} aria-labelledby="phone-flow-title">
      <h2 id="phone-flow-title" className={styles.visuallyHidden}>
        Execution path comparison
      </h2>

      <div className={styles.phonesWrapper}>
        <div className={styles.stage}>
          {/* LEFT phone — With NIO */}
          <PhoneFrame
            data-phone="left"
            label="With NIO execution path"
            className={styles.leftPhone}
          >
            <ChatScreen
              title="NIO Chat"
              model={modelId}
              messages={withNioMessages}
              showSources={true}
              sourceLabels={withNio.sources}
              variant="chat"
              label="With NIO conversation"
            />
          </PhoneFrame>

          {/* CENTER phone — Source query (the interactive one) */}
          <PhoneFrame
            data-phone="center"
            label="Original query input"
            className={styles.centerPhone}
          >
            <ChatScreen
              title="ChatGPT"
              model={modelId}
              messages={centerMessages}
              variant={sent ? "chat" : "empty"}
              label="Query input screen"
              onSend={onSend}
              suggestions={presets}
              suggestLabel={`Try a ${outcome.kindLabel.toLowerCase()}`}
              placeholder="Type your query…"
            />
          </PhoneFrame>

          {/* RIGHT phone — Without NIO */}
          <PhoneFrame
            data-phone="right"
            label="Without NIO execution path"
            className={styles.rightPhone}
          >
            <ChatScreen
              title="ChatGPT"
              model={modelId}
              messages={withoutNioMessages}
              showSources={false}
              sourceLabels={[]}
              variant="chat"
              label="Without NIO conversation"
            />
          </PhoneFrame>

          {/* Connectors + labels (design space: 900 x 605) */}
          <FlowConnectors
            viewBox="0 0 900 605"
            left={{
              xStart: 311,
              xEnd: 150,
              yTop: 62,
              yBottom: 118,
            }}
            right={{
              xStart: 589,
              xEnd: 750,
              yTop: 62,
              yBottom: 118,
            }}
          />

          <FlowLabel
            leftPct={16.6667}
            topPct={14.2149}
            topText="with"
            bottomText="NIO"
            className={styles.withLabel}
          />

          <FlowLabel
            leftPct={83.3333}
            topPct={14.2149}
            topText="without"
            bottomText="NIO"
            variant="neutral"
            className={styles.withoutLabel}
          />
        </div>
      </div>
    </section>
  );
}
