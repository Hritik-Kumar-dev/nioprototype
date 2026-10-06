import { LinkIcon } from "./icons";
import styles from "./SourceChip.module.css";

export interface SourceChipProps {
  label: string;
}

/** Tiny grounded-source pill ("Scheme Details", "Official Source"). */
export function SourceChip({ label }: SourceChipProps) {
  return (
    <span className={styles.chip}>
      <LinkIcon size={9} />
      {label}
    </span>
  );
}
