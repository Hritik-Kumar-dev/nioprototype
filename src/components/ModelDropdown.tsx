import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "./icons";
import styles from "./ModelDropdown.module.css";

export interface ModelDropdownProps {
  models: string[];
  value: string;
  onChange: (model: string) => void;
}

/**
 * Working select-style dropdown: opens/closes on click, Escape and outside
 * click; arrow-key navigable, aria-expanded/haspopup + listbox semantics.
 */
export function ModelDropdown({ models, value, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, models.indexOf(value))
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  /* Close on outside click + Escape. */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (model: string) => {
    onChange(model);
    setOpen(false);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % models.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + models.length) % models.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(models[activeIndex]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.button}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
      >
        <span className={styles.buttonLabel}>{value}</span>
        <ChevronDownIcon size={12} className={open ? styles.chevronOpen : undefined} />
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Model"
          className={styles.menu}
        >
          {models.map((model, i) => (
            <li key={model}>
              <button
                type="button"
                role="option"
                aria-selected={model === value}
                className={`${styles.option} ${i === activeIndex ? styles.active : ""} ${
                  model === value ? styles.selected : ""
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(model)}
              >
                {model}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
