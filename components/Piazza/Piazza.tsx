"use client";

// The piazza's client shell. It owns the Game, the page mode (kept live in
// html[data-mode] as the window or pointer changes), the entrance
// (html[data-phase]), the first-visit waypoint tutorial, the remembered
// tower, and the coarse UI state: which plaque is open, whether the
// Collection is open, the hovered landmark and the passing message.
// Everything per frame (walking, turning) lives in the Game and is read by
// the Scene; React only hears about events.
//
// Per mode: play mounts the interactive scene over the whole viewport;
// painting mounts the same scene as a living, untouchable painting in
// #stage; fallback mounts nothing (#stage shows the static image). A mode
// change at runtime closes any overlay and remounts the scene; a scene
// failure (SceneBoundary) drops to fallback for the rest of the visit.
//
// Dev only: ?capture=scene|relic|train renders the stills committed in
// public/ (piazza.webp, still-relic.webp, still-eks.webp; scripts/stills.sh
// regenerates them): no UI, no entrance, no tutorial. Ignored in
// production builds.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Atmosphere, Backdrop } from "@/components/Backdrop";
import { Collection } from "@/components/Collection";
import { Controls } from "@/components/Controls";
import { Overlay } from "@/components/Overlay";
import { Plaque } from "@/components/Plaque";
import { Game, type GameEvent } from "@/lib/piazza/game";
import { loadMemory, saveMemory } from "@/lib/piazza/memory";
import { PAINTING_QUERY, pickMode, type Mode } from "@/lib/piazza/mode";
import { nextStep, type TutorialEvent, type TutorialStep } from "@/lib/piazza/tutorial";
import { World } from "@/lib/piazza/world";
import { entryForLandmark } from "@/text/collection";
import styles from "./Piazza.module.css";
import { SceneBoundary } from "./SceneBoundary";
import { useEntrance } from "./useEntrance";

const Scene = dynamic(() => import("@/components/Scene").then((m) => m.Scene), { ssr: false });

const MESSAGE_MS = 3000;

type Capture = "scene" | "relic" | "train";
function readCapture(): Capture | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  const c = new URLSearchParams(window.location.search).get("capture");
  return c === "scene" || c === "relic" || c === "train" ? c : null;
}
// The stills' framing: Relic's column up close at r0; the train held
// partway across and the horizon enlarged around it.
const RELIC_FOCUS = { at: { x: 10.5, y: 8.5, z: 4.9 }, zoom: 3 };
const TRAIN_AT = 0.56;
const TRAIN_FRAME: React.CSSProperties = { transform: "scale(1.9)", transformOrigin: "62% 64%" };

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

// pickMode, kept live: the painting query flips when the window narrows or
// the pointer changes, and data-mode follows so the CSS layout does too.
// fail() pins it to fallback once the scene has broken.
//
// A layout effect, so data-mode is on the page before the browser first
// styles it: on a client-side return to "/" the inline MODE_SCRIPT doesn't
// run, and a passive effect would let the fallback styles resolve first
// (fetching /piazza.webp in play mode, and flashing the fallback layout).
function useMode(): { mode: Mode | null; fail(): void } {
  const [mode, setMode] = useState<Mode | null>(null);
  const failed = useRef(false);
  const fail = useCallback(() => {
    failed.current = true;
    document.documentElement.dataset.mode = "fallback";
    setMode("fallback");
  }, []);
  useLayoutEffect(() => {
    const webgl = hasWebGL();
    const painting = window.matchMedia(PAINTING_QUERY);
    const coarse = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      const m = failed.current ? "fallback" : pickMode({ coarse: coarse.matches, width: window.innerWidth, webgl });
      document.documentElement.dataset.mode = m;
      setMode(m);
    };
    sync();
    painting.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    return () => {
      painting.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      // Leaving the piazza (client-side navigation): the html attributes it
      // owns must not follow the visitor to other routes. Checked a tick
      // later, so a Strict Mode remount (same page, #stage still there)
      // keeps them.
      setTimeout(() => {
        if (document.getElementById("stage")) return;
        const d = document.documentElement.dataset;
        delete d.mode;
        delete d.phase;
        delete d.entrance;
        delete d.capture;
        delete d.skipped;
      }, 0);
    };
  }, []);
  return { mode, fail };
}

export function Piazza() {
  // Built on the client only: the game is never part of the server HTML.
  const [memory] = useState(() => (typeof window === "undefined" ? null : loadMemory()));
  const [game] = useState<Game | null>(() => (memory ? new Game(new World({ towerTop: memory.towerTop })) : null));
  const { mode, fail } = useMode();
  const [capture] = useState(readCapture);
  const entrance = useEntrance(mode, capture !== null);
  const settled = entrance.phase === "settled";

  // The waypoint tutorial. Every step change is remembered at once.
  const [step, setStep] = useState<TutorialStep>(memory?.tutorial ?? "done");
  const stepRef = useRef(step);
  const tutorial = useCallback((e: TutorialEvent) => {
    const next = nextStep(stepRef.current, e);
    if (next === stepRef.current) return;
    stepRef.current = next;
    setStep(next);
    saveMemory({ tutorial: next });
  }, []);
  const dismiss = useCallback(() => tutorial({ type: "dismissed" }), [tutorial]);

  // The tower grows each time the visitor comes back to the tab (not on the
  // first look), and stays grown.
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!game) return;
    let seen = document.visibilityState === "visible";
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (seen) {
        game.growTower();
        setVersion((v) => v + 1);
        saveMemory({ towerTop: game.world.towerTop });
      }
      seen = true;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [game]);

  const [plaque, setPlaque] = useState<number | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [hoverLandmark, setHoverLandmark] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Mirrors "an overlay is open", written at the same moment as the state so
  // input arriving before React re-renders (a key, a canvas click, an
  // arrival in the same frame) already sees it.
  const overlay = useRef(false);
  const plaqueRef = useRef<number | null>(null);
  // No game input until the entrance has settled.
  const settledRef = entrance.settled;
  const canInput = useCallback(() => settledRef.current && !overlay.current, [settledRef]);

  const openPlaque = useCallback((i: number) => {
    if (overlay.current) return; // the Collection is up: arrive quietly
    overlay.current = true;
    plaqueRef.current = i;
    setHoverLandmark(null);
    setPlaque(i);
  }, []);
  const closePlaque = useCallback(() => {
    const i = plaqueRef.current;
    if (i === null) return;
    overlay.current = false;
    plaqueRef.current = null;
    setPlaque(null);
    const title = game?.world.landmarks[i]?.title;
    if (title) tutorial({ type: "plaqueClosed", title });
  }, [game, tutorial]);
  const openCollection = useCallback(() => {
    if (overlay.current) return;
    overlay.current = true;
    setHoverLandmark(null);
    setCollectionOpen(true);
  }, []);
  const closeCollection = useCallback(() => {
    overlay.current = false;
    setCollectionOpen(false);
  }, []);

  // The mode changed under an open overlay (a window narrowed, a tablet
  // turned, the scene failed): close it quietly. The scene remounts with
  // the new mode's props (keyed below).
  useEffect(() => {
    overlay.current = false;
    plaqueRef.current = null;
    setPlaque(null);
    setCollectionOpen(false);
    setHoverLandmark(null);
    setMessage(null);
  }, [mode]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const say = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), MESSAGE_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onEvents = useCallback(
    (events: GameEvent[]) => {
      if (!game) return;
      for (const e of events) {
        if (e.type === "arrived") {
          openPlaque(e.landmark);
        } else if (e.type === "unreachable") {
          const title = game.world.landmarks[e.landmark]?.title;
          if (title) say(`From here, the way to ${title} cannot be seen.`);
        } else if (e.type === "turned") {
          tutorial({ type: "turned" });
        }
      }
    },
    [game, openPlaque, say, tutorial],
  );

  const onTurn = useCallback(
    (dir: 1 | -1) => {
      if (game && canInput()) game.turn(dir);
    },
    [game, canInput],
  );
  const onLandmark = useCallback(
    (i: number) => {
      if (game && canInput()) game.goToLandmark(i);
    },
    [game, canInput],
  );

  const radiant = game ? game.world.landmarks.findIndex((l) => l.title === "Radiant") : -1;
  const goRadiant = useCallback(() => onLandmark(radiant), [onLandmark, radiant]);
  const waypoint = useMemo(
    () =>
      settled && !capture && step === "radiant" && radiant >= 0
        ? { landmark: radiant, onGo: goRadiant, onDismiss: dismiss }
        : null,
    [settled, capture, step, radiant, goRadiant, dismiss],
  );

  // A still hides the page's own UI (the identity, Next's dev badge).
  useEffect(() => {
    if (!capture) return;
    document.documentElement.dataset.capture = capture;
  }, [capture]);

  // Dev-only handle for driving the game from a headless browser.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !game) return;
    const w = window as unknown as { __piazza?: Game };
    w.__piazza = game;
    return () => {
      if (w.__piazza === game) delete w.__piazza;
    };
  }, [game]);

  if (!game || mode === null || mode === "fallback") return null;

  if (mode === "painting") {
    return (
      <>
        <Backdrop />
        <SceneBoundary key={mode} onFallback={fail}>
          <Scene game={game} interactive={false} version={version} />
        </SceneBoundary>
        <Atmosphere />
      </>
    );
  }

  if (capture === "train") {
    return (
      <>
        <Backdrop trainAt={TRAIN_AT} style={TRAIN_FRAME} />
        <Atmosphere />
      </>
    );
  }
  if (capture) {
    return (
      <>
        <Backdrop />
        <Scene
          game={game}
          interactive
          version={version}
          onReady={entrance.sceneReady}
          focus={capture === "relic" ? RELIC_FOCUS : null}
        />
        <Atmosphere />
      </>
    );
  }

  const title = plaque === null ? undefined : game.world.landmarks[plaque]?.title;
  const entry = title === undefined ? undefined : entryForLandmark(title);

  return (
    <>
      <Backdrop />
      <Controls
        onTurn={onTurn}
        onOpenCollection={openCollection}
        landmarks={game.world.landmarks}
        onLandmark={onLandmark}
        waypointOnTurn={settled && step === "turn"}
        onDismissWaypoint={dismiss}
      />
      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>
      {/* After the Controls, so Tab reaches them first; the controls sit
          above the canvas by z-index, not DOM order. */}
      <SceneBoundary key={mode} onFallback={fail}>
        <Scene
          game={game}
          interactive
          entranceOffset={entrance.offset}
          version={version}
          onReady={entrance.sceneReady}
          waypoint={waypoint}
          onEvents={onEvents}
          canInput={canInput}
          hoverLandmark={hoverLandmark}
          onHoverLandmark={setHoverLandmark}
          onLandmark={onLandmark}
          covered={plaque !== null || collectionOpen}
        />
      </SceneBoundary>
      <Atmosphere />

      <Overlay open={plaque !== null} onClose={closePlaque} label={title ?? "Plaque"}>
        {/* Closes only from its close button, Esc, or a click outside the
            sheet (the Overlay's backdrop) — never from inside, where the
            links live. */}
        {entry && <Plaque entry={entry} onClose={closePlaque} />}
      </Overlay>

      <Overlay open={collectionOpen} onClose={closeCollection} label="The Collection">
        {collectionOpen && (
          // Same rule as the plaque: close button, Esc, or a click outside.
          <>
            <div className={styles.closeBar}>
              <button type="button" className={styles.close} onClick={closeCollection}>
                close <span aria-hidden="true">×</span>
              </button>
            </div>
            <Collection id="collection-overlay" />
          </>
        )}
      </Overlay>
    </>
  );
}
