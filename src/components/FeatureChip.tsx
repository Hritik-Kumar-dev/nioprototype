import type { ReactNode } from "react";
import { CheckCircleIcon, MinusCircleIcon } from "./icons";
import styles from "./FeatureChip.module.css";

export interface FeatureChipProps {
  name: ReactNode;
  enabled: boolean;
}

/** RAG / Tools / Guardrails / Cache status chip. */
export function FeatureChip({ name, enabled }: FeatureChipProps) {
  return (
    <div
      className={`${styles.chip} ${enabled ? styles.on : styles.off}`}
      aria-label={`${name}: ${enabled ? "on" : "off"}`}
    >
      <div className={styles.iconContainer}>
        <span className={styles.icon} aria-hidden="true">
          {enabled ? <CheckCircleIcon size={13} /> : <MinusCircleIcon size={13} />}
        </span>
        <span className={styles.name}>{name}</span>
      </div>
      <span className={styles.status}>{enabled ? "ON" : "OFF"}</span>
    </div>
  );
}
