"use client";

// The entrance: title card, descent, settled. The inline MODE_SCRIPT has
// already put html[data-phase="title"] (and data-entrance full|short) on
// the page before first paint when there is to be one; this hook takes it
// from there. It walks data-phase forward, eases the camera's height offset
// (read by the Scene's rig in useFrame) from OFFSET to 0 during the descent,
// and lets any click or key skip straight to settled. The identity's own
// movement is CSS, keyed on data-phase.

import { useCallback, useEffect, useRef, useState } from "react";
import { saveMemory } from "@/lib/piazza/memory";
import type { Mode } from "@/lib/piazza/mode";

export type Phase = "title" | "descent" | "settled";

// World units of camera-target height at the title card: the camera looks
// at the sky above the piazza, along the same isometric direction.
const OFFSET = 14;
// The identity's CSS move uses the same durations (Identity.module.css).
const TIMING = {
  full: { hold: 1200, descent: 1800 },
  short: { hold: 0, descent: 900 },
} as const;
// The descent waits for the scene's first frame, but never longer than this
// past the hold: a slow chunk shouldn't keep the title card up. Worst case
// from mount: 1.2 + 2.5 + 1.8 = 5.5s, under the inline failsafe
// (ENTRANCE_FAILSAFE_MS).
const READY_WAIT_MS = 2500;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const root = () => document.documentElement.dataset;

// Keys that are not a visitor's "go": shortcuts and bare modifiers (the
// same filter the Controls use for turning).
const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "Fn"]);
const isShortcut = (e: KeyboardEvent) => e.altKey || e.ctrlKey || e.metaKey || MODIFIERS.has(e.key);

// A skip: the identity's move to the corner is quick, not the full descent.
const skip = () => {
  root().skipped = "";
};

function initialPhase(): Phase {
  if (typeof document === "undefined") return "settled";
  const p = root().phase;
  return p === "title" || p === "descent" ? p : "settled";
}

// mode is null until the client has decided it; the title card holds.
export function useEntrance(mode: Mode | null) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  // Synchronous mirrors for input arriving before React re-renders.
  const settled = useRef(phase === "settled");
  const offset = useRef(phase === "settled" ? 0 : OFFSET);
  // A press that skipped the entrance: its click must not also walk.
  const swallowClick = useRef(false);
  const ready = useRef(false);
  const onReady = useRef<(() => void) | null>(null);

  const finish = useCallback(() => {
    offset.current = 0;
    if (root().phase !== "settled") root().phase = "settled";
    if (settled.current) return;
    settled.current = true;
    setPhase("settled");
    saveMemory({ visited: true });
  }, []);

  const sceneReady = useCallback(() => {
    ready.current = true;
    onReady.current?.();
  }, []);

  useEffect(() => {
    if (mode === null) return;
    const active = mode === "play";
    if (settled.current) {
      // Reduced motion, painting/fallback, or a later visit to play mode:
      // nothing to play, but this still counts as having been here.
      if (active) saveMemory({ visited: true });
      return;
    }
    // The page isn't the playable piazza (any more): no entrance.
    if (!active) return finish();

    const timing = TIMING[root().entrance === "short" ? "short" : "full"];
    let raf = 0;
    let wait: ReturnType<typeof setTimeout> | undefined;

    const descend = () => {
      onReady.current = null;
      clearTimeout(wait);
      // The page's failsafe may have settled it already.
      if (root().phase === "settled") return finish();
      root().phase = "descent";
      setPhase("descent");
      const start = performance.now();
      const step = (now: number) => {
        if (settled.current) return;
        const t = Math.min(1, (now - start) / timing.descent);
        offset.current = OFFSET * (1 - easeInOut(t));
        if (t < 1) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
    };
    const hold = setTimeout(() => {
      if (ready.current) return descend();
      onReady.current = descend;
      wait = setTimeout(descend, READY_WAIT_MS);
    }, timing.hold);

    // Any press or key skips to settled, and does nothing else: the event
    // stops here (capture on window runs before the canvas and the keys).
    const onDown = (e: PointerEvent) => {
      if (settled.current) return;
      swallowClick.current = true;
      e.stopImmediatePropagation();
      skip();
      finish();
    };
    const release = () => {
      // The click (if any) is dispatched right after pointerup; a cancelled
      // press has none, so nothing is left to eat the next real click.
      if (swallowClick.current) setTimeout(() => (swallowClick.current = false), 0);
    };
    const onClick = (e: MouseEvent) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.stopImmediatePropagation();
    };
    const onKey = (e: KeyboardEvent) => {
      if (settled.current || isShortcut(e)) return;
      e.stopImmediatePropagation();
      // Tab still moves focus; Enter or Space mustn't press a button too.
      if (e.key !== "Tab") e.preventDefault();
      skip();
      finish();
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", release, true);
    window.addEventListener("pointercancel", release, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(hold);
      clearTimeout(wait);
      cancelAnimationFrame(raf);
      onReady.current = null;
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", release, true);
      window.removeEventListener("pointercancel", release, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [mode, finish]);

  return { phase, settled, offset, sceneReady };
}
