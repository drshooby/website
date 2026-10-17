"use client";

// The cat: a small, slim black silhouette in de Chirico's darkest ink, built
// from primitives (capsule body, sphere head, cone ears, tube tail, four
// legs). Each frame it stands at catWorldPos, which lifts it onto the front
// layer while it crosses an impossible join, so it is never hidden behind
// the geometry it appears to walk over. It turns toward where it is going
// and swings its legs with cat.phase. No shadow yet (Task 10 gives it its
// own, pointing the wrong way).
//
// Dozing (the phone's painting): eyes closed, a slow breath, and now and
// then a sleepy blink of the eyes opening. Under reduced motion it just
// sleeps, perfectly still.

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { catWorldPos } from "@/lib/piazza/cat";
import type { Game } from "@/lib/piazza/game";
import { REDUCED_MOTION_QUERY } from "@/lib/piazza/mode";
import { toThree, unrotVec } from "@/lib/piazza/space";
import { keyA, keyB, keyOf } from "@/lib/piazza/world";

const CAT = "#18130f";
const EYES = "#c9d84a";

// Model space: +x is forward, y is up, feet at y = 0. One voxel is 1 unit.
const BODY_Y = 0.24;
const LEG_LEN = 0.2;
const LEGS: { x: number; z: number; phase: number }[] = [
  { x: 0.12, z: 0.045, phase: 0 },
  { x: 0.12, z: -0.045, phase: Math.PI },
  { x: -0.11, z: 0.045, phase: Math.PI },
  { x: -0.11, z: -0.045, phase: 0 },
];
const SWING = 0.55; // radians either way at full stride
const TURN_RATE = 14; // how fast the yaw eases toward the heading, per second
const SCALE = 1.25; // modelled at a cat's proportions, then sized to read at a glance
const BREATH_PERIOD = 4; // seconds per breath while dozing
const BREATH_DEPTH = 0.02; // ±2% scale
const BLINK_EVERY: [number, number] = [6, 10]; // seconds between blinks, random in range
const BLINK_OPEN = 0.3; // seconds the eyes stay open

const nextBlink = (now: number) => now + BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function useCatGeometry() {
  const geo = useMemo(() => {
    const body = new THREE.CapsuleGeometry(0.075, 0.26, 4, 12);
    body.rotateZ(Math.PI / 2);
    const head = new THREE.SphereGeometry(0.085, 14, 10);
    const ear = new THREE.ConeGeometry(0.032, 0.085, 8);
    const leg = new THREE.CylinderGeometry(0.02, 0.016, LEG_LEN, 6);
    leg.translate(0, -LEG_LEN / 2, 0); // pivot at the hip
    // A long tail, low from the rump and curling up at the tip.
    const tail = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.19, BODY_Y + 0.02, 0),
        new THREE.Vector3(-0.29, BODY_Y + 0.04, 0),
        new THREE.Vector3(-0.35, BODY_Y + 0.15, 0),
        new THREE.Vector3(-0.33, BODY_Y + 0.3, 0),
        new THREE.Vector3(-0.27, BODY_Y + 0.36, 0),
      ]),
      20,
      0.018,
      6,
    );
    const eye = new THREE.SphereGeometry(0.014, 8, 6);
    return { body, head, ear, leg, tail, eye };
  }, []);
  const mat = useMemo(
    () => ({
      // Flat colors: a silhouette, not a lit toy.
      fur: new THREE.MeshBasicMaterial({ color: CAT }),
      eye: new THREE.MeshBasicMaterial({ color: EYES }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
    },
    [geo, mat],
  );
  return { geo, mat };
}

// Shortest signed difference between two angles.
const angleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

// The world-space heading (three's x, z) of the cat's current segment: the
// step between two neighboring screen keys, mapped back out of rotated space.
function heading(game: Game): [number, number] | null {
  const { path, seg } = game.cat;
  if (!path) return null;
  const r = game.rot & 3;
  const ka = keyOf(path[seg], r);
  const kb = keyOf(path[seg + 1], r);
  const da = keyA(kb) - keyA(ka);
  const db = keyB(kb) - keyB(ka);
  if (da === 0 && db === 0) return null;
  const [wx, wy] = unrotVec(da, db, r);
  return [wx, wy]; // engine x, y are three x, z
}

export function CatMesh({ game, dozing = false }: { game: Game; dozing?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Mesh | null)[]>([]);
  const eyes = useRef<(THREE.Mesh | null)[]>([]);
  const yaw = useRef<number | null>(null);
  const blinkAt = useRef<number | null>(null);
  const { geo, mat } = useCatGeometry();
  const still = useReducedMotion();

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;

    let breath = 1;
    let eyesOpen = true;
    if (dozing) {
      eyesOpen = false;
      if (!still) {
        const t = clock.elapsedTime;
        breath = 1 + BREATH_DEPTH * Math.sin((t * 2 * Math.PI) / BREATH_PERIOD);
        if (blinkAt.current === null) blinkAt.current = nextBlink(t);
        if (t >= blinkAt.current + BLINK_OPEN) blinkAt.current = nextBlink(t);
        eyesOpen = t >= blinkAt.current;
      }
    }
    // Feet are at y = 0, so the breath swells the cat without lifting it.
    g.scale.setScalar(SCALE * breath);
    eyes.current.forEach((e) => {
      if (e) e.visible = eyesOpen;
    });

    const cat = game.cat;
    g.position.set(...toThree(catWorldPos(cat, game.rot & 3)));

    // Model forward is +x; rotation.y = a turns it to (cos a, 0, -sin a).
    const h = heading(game);
    if (yaw.current === null) yaw.current = 0;
    if (h) {
      const want = Math.atan2(-h[1], h[0]);
      yaw.current += angleDelta(yaw.current, want) * Math.min(1, dt * TURN_RATE);
    }
    g.rotation.y = yaw.current;

    const walking = cat.walking;
    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const target = walking ? Math.sin(cat.phase + LEGS[i].phase) * SWING : 0;
      leg.rotation.z += (target - leg.rotation.z) * Math.min(1, dt * 20);
    });
  });

  return (
    <group ref={root} scale={SCALE}>
      <mesh geometry={geo.body} material={mat.fur} position={[0, BODY_Y, 0]} />
      {/* Head up and forward on a short neck line, ears pricked. */}
      <mesh geometry={geo.head} material={mat.fur} position={[0.22, BODY_Y + 0.11, 0]} scale={[1.05, 0.92, 0.95]} />
      <mesh geometry={geo.ear} material={mat.fur} position={[0.215, BODY_Y + 0.2, 0.042]} rotation={[0.3, 0, -0.08]} />
      <mesh geometry={geo.ear} material={mat.fur} position={[0.215, BODY_Y + 0.2, -0.042]} rotation={[-0.3, 0, -0.08]} />
      {[0.034, -0.034].map((z, i) => (
        <mesh
          key={z}
          ref={(m) => {
            eyes.current[i] = m;
          }}
          geometry={geo.eye}
          material={mat.eye}
          position={[0.29, BODY_Y + 0.125, z]}
          visible={!dozing}
        />
      ))}
      <mesh geometry={geo.tail} material={mat.fur} />
      {LEGS.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => {
            legs.current[i] = m;
          }}
          geometry={geo.leg}
          material={mat.fur}
          position={[l.x, BODY_Y, l.z]}
        />
      ))}
    </group>
  );
}
