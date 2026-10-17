"use client";

// The piazza's client shell. It owns the Game, the page mode (kept live in
// html[data-mode] as the window or pointer changes) and the coarse UI state:
// which plaque is open, whether the Collection is open, the hovered landmark
// and the passing message. Everything per frame (walking, turning) lives in
// the Game and is read by the Scene; React only hears about events.

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { Backdrop } from "@/components/Backdrop";
import { Collection } from "@/components/Collection";
import { Controls } from "@/components/Controls";
import { Overlay } from "@/components/Overlay";
import { Plaque } from "@/components/Plaque";
import { Game, type GameEvent } from "@/lib/piazza/game";
import { loadMemory } from "@/lib/piazza/memory";
import { PAINTING_QUERY, pickMode, type Mode } from "@/lib/piazza/mode";
import { World } from "@/lib/piazza/world";
import { entryForLandmark } from "@/text/collection";
import styles from "./Piazza.module.css";

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
function useMode(): Mode | null {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    const webgl = hasWebGL();
    const painting = window.matchMedia(PAINTING_QUERY);
    const coarse = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      const m = pickMode({ coarse: coarse.matches, width: window.innerWidth, webgl });
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
  return mode;
}

// A click on the plaque's card itself (not a link, button or the video)
// steps back out of it, as its footer says.
const isControl = (t: EventTarget) => t instanceof Element && !!t.closest("a, button, video, input, label");
const selecting = () => (window.getSelection()?.toString() ?? "") !== "";

export function Piazza() {
  // Built on the client only: the game is never part of the server HTML.
  const [game] = useState<Game | null>(() =>
    typeof window === "undefined" ? null : new Game(new World({ towerTop: loadMemory().towerTop })),
  );
  const mode = useMode();

  const [plaque, setPlaque] = useState<number | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [hoverLandmark, setHoverLandmark] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Mirrors "an overlay is open", written at the same moment as the state so
  // input arriving before React re-renders (a key, a canvas click, an
  // arrival in the same frame) already sees it.
  const overlay = useRef(false);
  const canInput = useCallback(() => !overlay.current, []);

  const openPlaque = useCallback((i: number) => {
    if (overlay.current) return; // the Collection is up: arrive quietly
    overlay.current = true;
    setHoverLandmark(null);
    setPlaque(i);
  }, []);
  const closePlaque = useCallback(() => {
    overlay.current = false;
    setPlaque(null);
    // Task 8: feed the tutorial { type: "plaqueClosed", title }.
  }, []);
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
        }
        // "turned" feeds the tutorial in Task 8.
      }
    },
    [game, openPlaque, say],
  );

  const onTurn = useCallback(
    (dir: 1 | -1) => {
      if (game && !overlay.current) game.turn(dir);
    },
    [game],
  );
  const onLandmark = useCallback(
    (i: number) => {
      if (game && !overlay.current) game.goToLandmark(i);
    },
    [game],
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

  // Other modes keep #stage as the static painting (the phone's live
  // painting is Task 9).
  if (mode !== "play" || !game) return null;

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
      <Scene
        game={game}
        interactive
        onEvents={onEvents}
        canInput={canInput}
        hoverLandmark={hoverLandmark}
        onHoverLandmark={setHoverLandmark}
        onLandmark={onLandmark}
      />
      <Controls
        onTurn={onTurn}
        onOpenCollection={openCollection}
        landmarks={game.world.landmarks}
        onLandmark={onLandmark}
        waypointOnTurn={false}
      />
      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>

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
