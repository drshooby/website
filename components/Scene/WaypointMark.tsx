"use client";

// The tutorial's waypoint as plain DOM, shared by the in-world marker over
// Radiant (Waypoint.tsx) and the one by the turn buttons (Controls): a
// glowing gold outlined diamond with a filled core, its label on a small
// dark ink plate (so it never melts into the painting), a dashed tether
// hanging below toward what it points at, and a small "×" on the plate that
// dismisses the tutorial. The element is a zero-size anchor at the
// diamond's center; the diamond bobs ±4px unless the visitor prefers
// reduced motion.
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
  // Where the plate sits: above the diamond, or beside it on the right
  // (in the world, where the space above Radiant is the arcade and tower).
  side?: "above" | "right";
  className?: string;
};

// Presses on the marker are the marker's: inside the canvas wrapper they
// would otherwise bubble on to the scene's own pointer handling.
const stop = (e: SyntheticEvent) => e.stopPropagation();

function Diamond() {
  return (
    <svg className={styles.diamond} viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <path d="M22 2.5 41.5 22 22 41.5 2.5 22Z" fill="rgba(43, 33, 27, 0.35)" stroke="currentColor" strokeWidth="2.6" />
      <path d="M22 11.5 32.5 22 22 32.5 11.5 22Z" fill="currentColor" />
    </svg>
  );
}

export function WaypointMark({ label, tether, onDismiss, onGo, side = "above", className }: WaypointMarkProps) {
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
      <span className={styles.label} data-side={side}>
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
      <span className={styles.bob}>
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
    </span>
  );
}
