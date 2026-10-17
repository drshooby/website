"use client";

// The piazza in three.js. An orthographic camera looks down the true
// isometric diagonal (lib/piazza/space.ts proves it reproduces the 2D
// projection), so tiles that touch on screen are the tiles the walking
// rule connects. The world group turns by groupRotationY(game.theta); the
// sun lives inside it, so shadows turn with the world as in the prototype.
// Per-frame state is read from the game and refs in useFrame, never from
// React state.
//
// Not interactive is the phone's living painting: no input at all, a
// lighter canvas (lower dpr, smaller shadow map), the cat dozing, and no
// frames drawn while the painting is scrolled away or the tab is hidden.
//
// Over it all, PaintEffect gives the canvas the prototype's painted surface
// (shimmer, weave, warm tint). It's skipped for the phone painting on
// low-end devices; under reduced motion only the tint stays.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { ISO_DIR, frameFor, groupRotationY, toThree } from "@/lib/piazza/space";
import { MaxZ, N, type Vec3 } from "@/lib/piazza/world";
import type { Game, GameEvent } from "@/lib/piazza/game";
import { CatMesh } from "./CatMesh";
import { AMBIENT, SUN3, SUN_COLOR } from "./light";
import { PaintEffect } from "./PaintEffect";
import { Picker } from "./Picker";
import { useReducedMotion } from "./useReducedMotion";
import { Props } from "./Props";
import { Voxels } from "./Voxels";
import { Waypoint } from "./Waypoint";
import styles from "./Scene.module.css";

export type SceneProps = {
  game: Game;
  interactive: boolean;
  // World units added to the camera target's height (the entrance pan).
  entranceOffset?: React.MutableRefObject<number>;
  // Bump after game.growTower() to rebuild the voxels.
  version?: number;
  // Interactive scenes only. Events from game.tick, each frame there are any.
  onEvents?: (events: GameEvent[]) => void;
  // Read at input time: false while an overlay is open.
  canInput?: () => boolean;
  // The landmark whose label shows, and the hover/click reports for props.
  hoverLandmark?: number | null;
  onHoverLandmark?: (i: number | null) => void;
  onLandmark?: (i: number) => void;
  // The tutorial's in-world waypoint, when it's showing: over this landmark.
  waypoint?: { landmark: number; onGo(): void; onDismiss(): void } | null;
  // Called once the first frame has rendered (the entrance waits for it).
  onReady?: () => void;
  // Dev stills only: look at this engine point, zoomed in this many times.
  focus?: { at: Vec3; zoom: number } | null;
  // Interactive scenes only: an overlay (a plaque, the Collection) covers
  // the scene, so it draws only what is still moving.
  covered?: boolean;
};

const CAMERA_DISTANCE = 50;

// Frames the scene per space.ts: zoom from frameFor (sized for the tallest
// tower, so the camera never jumps as it grows), target at the world's
// center at height zc, camera along ISO_DIR.
function Rig({
  entranceOffset,
  focus,
  theta,
}: {
  entranceOffset?: React.MutableRefObject<number>;
  focus?: SceneProps["focus"];
  theta: number;
}) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const target = useRef(new THREE.Vector3());

  useLayoutEffect(() => {
    const view = frameFor(width, height, MaxZ - 2);
    if (focus) {
      // The point turns with the world group.
      target.current.set(...toThree(focus.at)).applyAxisAngle(new THREE.Vector3(0, 1, 0), groupRotationY(theta));
    } else {
      target.current.set(...toThree({ x: N / 2, y: N / 2, z: view.zc }));
    }
    camera.zoom = view.s * Math.sqrt(1.5) * (focus?.zoom ?? 1);
    camera.updateProjectionMatrix();
  }, [camera, width, height, focus, theta]);

  useFrame(() => {
    const t = target.current;
    const dy = entranceOffset?.current ?? 0;
    camera.up.set(0, 1, 0);
    camera.position.set(
      t.x + ISO_DIR[0] * CAMERA_DISTANCE,
      t.y + dy + ISO_DIR[1] * CAMERA_DISTANCE,
      t.z + ISO_DIR[2] * CAMERA_DISTANCE,
    );
    camera.lookAt(t.x, t.y + dy, t.z);
  }, -1);
  return null;
}

// The sun: a directional light toward Sun, aimed at the world's middle.
// Hard BasicShadowMap shadows; the shadow camera covers the whole world
// (radius ~10.4 around its center, plus the flag) at ~90 texels per voxel.
const CENTER = new THREE.Vector3(0, MaxZ / 2, 0);
const SUN_DISTANCE = 30;
const SUN_POS = CENTER.clone().addScaledVector(SUN3, SUN_DISTANCE);
const R = 11;

function Sunlight({ mapSize }: { mapSize: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && aim.current) light.current.target = aim.current;
  }, []);
  return (
    <>
      <object3D ref={aim} position={CENTER} />
      <directionalLight
        ref={light}
        position={SUN_POS}
        color={SUN_COLOR}
        intensity={1}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-R}
        shadow-camera-right={R}
        shadow-camera-top={R}
        shadow-camera-bottom={-R}
        shadow-camera-near={SUN_DISTANCE - R - 2}
        shadow-camera-far={SUN_DISTANCE + R + 2}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

// Drives the game: one tick per frame, before anything reads its state
// (the rig runs at -1, everything else at 0). Events go to React.
function Ticker({ game, onEvents }: { game: Game; onEvents?: (events: GameEvent[]) => void }) {
  const cb = useRef(onEvents);
  useEffect(() => {
    cb.current = onEvents;
  });
  useFrame((_, dt) => {
    // A long gap (a background tab) shouldn't jump the walk or the turn.
    const events = game.tick(Math.min(dt, 0.1));
    if (events.length) cb.current?.(events);
  }, -2);
  return null;
}

// A landmark's name on hover: small caps on a scrap of plaque card, floating
// above the prop. It turns with the world because it lives inside the group.
function LandmarkLabel({ game, i }: { game: Game; i: number }) {
  const lm = game.world.landmarks[i];
  if (!lm) return null;
  const at = toThree({ x: lm.on.x + 0.5, y: lm.on.y + 0.5, z: lm.on.z + 1 + LABEL_HEIGHT });
  return (
    <Html position={at} center zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
      <span className={styles.label}>{lm.title}</span>
    </Html>
  );
}
const LABEL_HEIGHT = 2.7;

// Reports the first rendered frame, once.
function Ready({ onReady }: { onReady?: () => void }) {
  const done = useRef(false);
  const cb = useRef(onReady);
  useEffect(() => {
    cb.current = onReady;
  });
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    // After this frame is drawn, not before.
    requestAnimationFrame(() => cb.current?.());
  });
  return null;
}

type InteractiveProps = Pick<SceneProps, "canInput" | "hoverLandmark" | "onHoverLandmark" | "onLandmark" | "waypoint">;

function Piazza3D({
  game,
  version,
  interactive,
  canInput,
  hoverLandmark = null,
  onHoverLandmark,
  onLandmark,
  waypoint,
  live,
}: { game: Game; version: number; interactive: boolean; live: boolean } & InteractiveProps) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = groupRotationY(game.theta);
  });

  // The pointer cursor: over a walkable tile or a landmark, while input is on.
  const over = useRef({ node: false, landmark: false });
  const allowed = useCallback(() => (canInput ? canInput() : true), [canInput]);
  const syncCursor = useCallback(() => {
    const on = allowed() && (over.current.node || over.current.landmark);
    document.body.style.cursor = on ? "pointer" : "";
  }, [allowed]);
  const onHoverNode = useCallback(
    (on: boolean) => {
      over.current.node = on;
      syncCursor();
    },
    [syncCursor],
  );
  useEffect(() => {
    over.current.landmark = hoverLandmark !== null;
    syncCursor();
  }, [hoverLandmark, syncCursor]);
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  const voxels = <Voxels world={game.world} version={version} />;
  return (
    <group ref={group} rotation-y={groupRotationY(game.theta)}>
      <Sunlight mapSize={interactive ? 2048 : 1024} />
      {interactive ? (
        <Picker game={game} canInput={allowed} onHoverNode={onHoverNode}>
          {voxels}
        </Picker>
      ) : (
        voxels
      )}
      <Props
        world={game.world}
        onLandmark={
          interactive
            ? (i) => {
                if (allowed()) onLandmark?.(i);
              }
            : undefined
        }
        onHover={interactive ? (i) => onHoverLandmark?.(i !== null && allowed() ? i : null) : undefined}
      />
      <CatMesh game={game} dozing={!interactive} />
      {/* The waypoint already names its landmark. */}
      {interactive && hoverLandmark !== null && hoverLandmark !== waypoint?.landmark && (
        <LandmarkLabel game={game} i={hoverLandmark} />
      )}
      {/* Not before the first frame: drei's <Html> mounted in the canvas's
          first commit re-targets once R3F connects its events, and the
          root it drops unmounts late, emptying the new one. */}
      {interactive && live && waypoint && game.world.landmarks[waypoint.landmark] && (
        <Waypoint
          landmark={game.world.landmarks[waypoint.landmark]}
          onGo={waypoint.onGo}
          onDismiss={waypoint.onDismiss}
        />
      )}
    </group>
  );
}

// An interactive scene on frameloop "demand" (reduced motion, or covered by
// an overlay) still has to move whenever something in it moves. This asks
// for frames: every frame while the game is busy (a walk, a turn) or the
// entrance offset is changing, and for a short tail after that (the legs
// settle, the yaw eases) and after any input (the hover highlight, the
// cat's glance, a click or key that starts a walk or a turn, a label React
// is about to mount). On "always" it asks for nothing new.
const TAIL_MS = 500;
const INPUTS = ["pointermove", "pointerdown", "pointerup", "click", "keydown", "wheel"] as const;

function KeepDrawing({
  game,
  entranceOffset,
  hoverLandmark,
  waypoint,
  live,
  version,
}: {
  game: Game;
  entranceOffset?: React.MutableRefObject<number>;
  hoverLandmark?: number | null;
  waypoint?: SceneProps["waypoint"];
  live: boolean;
  version: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const until = useRef(0);
  const lastOffset = useRef<number | null>(null);
  const extend = useCallback(() => {
    until.current = Math.max(until.current, performance.now() + TAIL_MS);
    invalidate();
  }, [invalidate]);
  useEffect(() => {
    for (const t of INPUTS) window.addEventListener(t, extend, { capture: true, passive: true });
    return () => {
      for (const t of INPUTS) window.removeEventListener(t, extend, { capture: true });
    };
  }, [extend]);
  // Changes that arrive through React, not input.
  useEffect(() => {
    extend();
  }, [extend, hoverLandmark, waypoint, live, version]);
  useFrame(() => {
    const offset = entranceOffset?.current ?? 0;
    if (game.busy || offset !== lastOffset.current) {
      lastOffset.current = offset;
      until.current = Math.max(until.current, performance.now() + TAIL_MS);
    }
    if (performance.now() < until.current) invalidate();
  });
  return null;
}

// The painted surface. One composer pass; its own MSAA replaces the
// canvas's (the canvas is created without antialias when this is on).
function Paint({ moving }: { moving: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const effect = useMemo(() => new PaintEffect(), []);
  useEffect(() => {
    effect.moving = moving;
    effect.dpr = dpr;
    invalidate();
  }, [effect, moving, dpr, invalidate]);
  useEffect(() => () => effect.dispose(), [effect]);
  return (
    <EffectComposer multisampling={4}>
      <primitive object={effect} dispose={null} />
    </EffectComposer>
  );
}

// The phone painting on a low-end device skips the paint pass.
const lowEnd = () => typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;

// Whether a painting should be drawing: on screen and the tab visible.
function useDrawing(el: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [onScreen, setOnScreen] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    let io: IntersectionObserver | undefined;
    if (el.current && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => setOnScreen(entries[entries.length - 1].isIntersecting));
      io.observe(el.current);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, [el, enabled]);
  return !enabled || (onScreen && visible);
}

// The canvas is decoration; its content is the Controls and the Collection.
const markDecorative = ({ gl }: { gl: THREE.WebGLRenderer }) => gl.domElement.setAttribute("aria-hidden", "true");

export function Scene({
  game,
  interactive,
  entranceOffset,
  version = 0,
  onEvents,
  onReady,
  focus,
  covered = false,
  ...rest
}: SceneProps) {
  const [live, setLive] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const drawing = useDrawing(wrap, !interactive);
  // Under reduced motion, or behind an overlay, nothing moves by itself:
  // draw on demand. A painting then has nothing to draw at all; the
  // playable scene keeps drawing through walks, turns, the entrance and
  // input (KeepDrawing).
  const still = useReducedMotion();
  const frameloop = !drawing ? "never" : still || (interactive && covered) ? "demand" : "always";
  // Decided once per canvas: it fixes the canvas's antialias setting.
  const [paint] = useState(() => interactive || !lowEnd());
  const ready = useCallback(() => {
    setLive(true);
    onReady?.();
  }, [onReady]);
  return (
    <div
      ref={wrap}
      className={styles.scene}
      data-interactive={interactive || undefined}
      // The painting has nothing to reach in it. The playable scene keeps
      // its DOM (the waypoint) readable; only its canvas is hidden.
      aria-hidden={interactive ? undefined : true}
    >
      <Canvas
        orthographic
        shadows="basic"
        flat
        dpr={interactive ? [1, 2] : [1, 1.5]}
        frameloop={frameloop}
        // R3F sets pointer-events: auto on its own wrapper; the painting
        // takes no touch at all.
        style={interactive ? undefined : { pointerEvents: "none" }}
        onCreated={markDecorative}
        gl={{ alpha: true, antialias: !paint }}
        camera={{ position: [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE], near: 0.1, far: 400, zoom: 1 }}
      >
        <ambientLight color={AMBIENT} intensity={1} />
        <Ticker game={game} onEvents={onEvents} />
        <Ready onReady={ready} />
        <Rig entranceOffset={entranceOffset} focus={focus} theta={game.theta} />
        <Piazza3D game={game} version={version} interactive={interactive} live={live} {...rest} />
        {interactive && (
          <KeepDrawing
            game={game}
            entranceOffset={entranceOffset}
            hoverLandmark={rest.hoverLandmark}
            waypoint={rest.waypoint}
            live={live}
            version={version}
          />
        )}
        {paint && <Paint moving={!still} />}
      </Canvas>
    </div>
  );
}
