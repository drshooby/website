"use client";

// The piazza's controls, all real HTML over the canvas: the always-visible
// hint with its turn buttons (bottom left), The Collection (top right), and
// a keyboard route to every landmark ("Walk to …", hidden until focused).
// Q / ArrowLeft and E / ArrowRight turn the world; the parent decides
// whether a turn is allowed (never while an overlay is open).

import { useEffect, useRef } from "react";
import { WaypointMark } from "@/components/Scene/WaypointMark";
import styles from "./Controls.module.css";

export type ControlsProps = {
  onTurn(dir: 1 | -1): void;
  onOpenCollection(): void;
  landmarks: { title: string }[];
  onLandmark(i: number): void;
  // The tutorial's second step: a waypoint over the turn buttons.
  waypointOnTurn: boolean;
  onDismissWaypoint(): void;
};

const TURN_WAYPOINT = "turn the world, other paths appear";
const TURN_TETHER = 12;

const KEYS: Record<string, 1 | -1> = {
  q: -1,
  arrowleft: -1,
  e: 1,
  arrowright: 1,
};

// Typing somewhere (should a field ever exist) is not steering.
const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function Controls({
  onTurn,
  onOpenCollection,
  landmarks,
  onLandmark,
  waypointOnTurn,
  onDismissWaypoint,
}: ControlsProps) {
  const turn = useRef(onTurn);
  useEffect(() => {
    turn.current = onTurn;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEYS[e.key.toLowerCase()];
      if (!dir || e.repeat || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return;
      e.preventDefault();
      turn.current(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className={styles.collection} onClick={onOpenCollection}>
        The Collection
      </button>

      <nav className={styles.walk} aria-label="Landmarks">
        <ul>
          {landmarks.map((lm, i) => (
            <li key={lm.title}>
              <button type="button" onClick={() => onLandmark(i)}>
                Walk to {lm.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className={styles.hint} data-waypoint={waypointOnTurn || undefined}>
        click to walk · q / e or{" "}
        <span className={styles.turns}>
          <button type="button" className={styles.turn} aria-label="Turn the world left" onClick={() => onTurn(-1)}>
            ⟲
          </button>{" "}
          <button type="button" className={styles.turn} aria-label="Turn the world right" onClick={() => onTurn(1)}>
            ⟳
          </button>
          {waypointOnTurn && (
            <WaypointMark
              className={styles.waypoint}
              label={TURN_WAYPOINT}
              tether={TURN_TETHER}
              onDismiss={onDismissWaypoint}
            />
          )}
        </span>{" "}
        to turn
      </p>
    </>
  );
}
