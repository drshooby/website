"use client";

// The tutorial's waypoint as plain DOM, shared by the in-world marker over
// Radiant (Waypoint.tsx) and the one by the turn buttons (Controls): a gold
// outlined diamond with a filled core, its label above in mono, a dashed
// tether hanging below toward what it points at, and a small "×" that
// dismisses the tutorial. The element is a zero-size anchor at the
// diamond's center; it bobs ±4px unless the visitor prefers reduced motion.
// No three.js here, so the Controls can use it without pulling in the scene.

import type { CSSProperties, SyntheticEvent } from "react";
import styles from "./Waypoint.module.css";

type WaypointMarkProps = {
  label: string;
  // Pixels of dashed tether below the diamond.
  tether: number;
  onDismiss(): void;
  // When set, the label and diamond are a control (the in-world marker).
  onGo?(): void;
  className?: string;
};

// Presses on the marker are the marker's: inside the canvas wrapper they
// would otherwise bubble on to the scene's own pointer handling.
const stop = (e: SyntheticEvent) => e.stopPropagation();

function Diamond() {
  return (
    <svg className={styles.diamond} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M10 1.5 18.5 10 10 18.5 1.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6 14 10 10 14 6 10Z" fill="currentColor" />
    </svg>
  );
}

export function WaypointMark({ label, tether, onDismiss, onGo, className }: WaypointMarkProps) {
  return (
    // Spans throughout: the Controls' copy lives inside the hint's <p>.
    <span
      className={`${styles.mark} ${className ?? ""}`}
      style={{ "--tether": `${Math.max(0, Math.round(tether))}px` } as CSSProperties}
      onPointerDown={stop}
      onPointerUp={stop}
      onPointerMove={stop}
      onClick={stop}
    >
      <span className={styles.label}>
        {onGo ? (
          <button type="button" className={styles.go} onClick={onGo}>
            {label}
          </button>
        ) : (
          <span>{label}</span>
        )}
        <button type="button" className={styles.dismiss} aria-label="Dismiss the guide" onClick={onDismiss}>
          ×
        </button>
      </span>
      {onGo ? (
        // A bigger pointer target; the label's button is the keyboard route.
        <span className={styles.hit} onClick={onGo}>
          <Diamond />
        </span>
      ) : (
        <Diamond />
      )}
      <span className={styles.tether} aria-hidden="true" />
    </span>
  );
}
