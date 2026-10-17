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

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { Backdrop } from "@/components/Backdrop";
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
function useMode(): { mode: Mode | null; fail(): void } {
  const [mode, setMode] = useState<Mode | null>(null);
  const failed = useRef(false);
  const fail = useCallback(() => {
    failed.current = true;
    document.documentElement.dataset.mode = "fallback";
    setMode("fallback");
  }, []);
  useEffect(() => {
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
    };
  }, []);
  return { mode, fail };
}

// A click on the plaque's card itself (not a link, button or the video)
// steps back out of it, as its footer says.
const isControl = (t: EventTarget) => t instanceof Element && !!t.closest("a, button, video, input, label");
const selecting = () => (window.getSelection()?.toString() ?? "") !== "";

export function Piazza() {
  // Built on the client only: the game is never part of the server HTML.
  const [memory] = useState(() => (typeof window === "undefined" ? null : loadMemory()));
  const [game] = useState<Game | null>(() => (memory ? new Game(new World({ towerTop: memory.towerTop })) : null));
  const { mode, fail } = useMode();
  const entrance = useEntrance(mode);
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
    () => (settled && step === "radiant" && radiant >= 0 ? { landmark: radiant, onGo: goRadiant, onDismiss: dismiss } : null),
    [settled, step, radiant, goRadiant, dismiss],
  );

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
      </>
    );
  }

  const title = plaque === null ? undefined : game.world.landmarks[plaque]?.title;
  const entry = title === undefined ? undefined : entryForLandmark(title);

  const stepBack = (e: MouseEvent) => {
    if (!isControl(e.target) && !selecting()) closePlaque();
  };
  // A click in the gaps between works (not on a work) closes the Collection.
  const outsideWork = (e: MouseEvent) => {
    if (e.target instanceof Element && !e.target.closest("article, button, a") && !selecting()) closeCollection();
  };

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
        />
      </SceneBoundary>

      <Overlay open={plaque !== null} onClose={closePlaque} label={title ?? "Plaque"}>
        {entry && (
          // A pointer shortcut; Esc and the close button cover the keyboard.
          <div className={styles.stepBack} onClick={stepBack}>
            <Plaque entry={entry} onClose={closePlaque} />
          </div>
        )}
      </Overlay>

      <Overlay open={collectionOpen} onClose={closeCollection} label="The Collection">
        {collectionOpen && (
          // A pointer shortcut; Esc and the close button cover the keyboard.
          <div onClick={outsideWork}>
            <button type="button" className={styles.close} onClick={closeCollection}>
              close <span aria-hidden="true">×</span>
            </button>
            <Collection id="collection-overlay" />
          </div>
        )}
      </Overlay>
    </>
  );
}
