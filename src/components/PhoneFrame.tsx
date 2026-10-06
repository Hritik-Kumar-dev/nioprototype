import type { ReactNode } from "react";
import {
  BatteryIcon,
  SignalIcon,
  WifiIcon,
} from "./icons";
import styles from "./PhoneFrame.module.css";

export interface PhoneFrameProps {
  /** Screen content (status bar is rendered by the frame itself). */
  children: ReactNode;
  /** Accessible name, e.g. "With NIO phone preview". */
  label: string;
  className?: string;
}

/**
 * Reusable dark metallic phone frame: body, side buttons, dynamic island,
 * status bar. Identical for all three phones (fair-comparison feel).
 */
export function PhoneFrame({ children, label, className }: PhoneFrameProps) {
  return (
    <div className={`${styles.frame} ${className ?? ""}`} role="group" aria-label={label}>
      {/* Side buttons */}
      <span className={`${styles.sideBtn} ${styles.btnMute}`} aria-hidden="true" />
      <span className={`${styles.sideBtn} ${styles.btnVolUp}`} aria-hidden="true" />
      <span className={`${styles.sideBtn} ${styles.btnVolDown}`} aria-hidden="true" />
      <span className={`${styles.sideBtn} ${styles.btnPower}`} aria-hidden="true" />

      <div className={styles.screen}>
        {/* Status bar */}
        <div className={styles.statusBar} aria-hidden="true">
          <span className={styles.time}>9:41</span>
          {/* Dynamic island sits between time and icons */}
          <span className={styles.island} />
          <span className={styles.statusIcons}>
            <SignalIcon size={11} />
            <WifiIcon size={11} />
            <BatteryIcon size={13} />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
