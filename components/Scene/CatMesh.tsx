"use client";

// The cat: a small, slim black silhouette in de Chirico's darkest ink, built
// from primitives (capsule body, sphere head, cone ears, tube tail, four
// legs). Each frame it stands at catWorldPos, which lifts it onto the front
// layer while it crosses an impossible join, so it is never hidden behind
// the geometry it appears to walk over. It turns toward where it is going
// and swings its legs with cat.phase.
//
// Two wrong touches from the prototype: its shadow, a long thin teardrop
// lying on the top face under it, points toward the sun while every other
// shadow falls away from it; and its eyes follow the cursor.
//
// Dozing (the phone's painting): eyes closed, a slow breath, and now and
// then a sleepy blink of the eyes opening. Under reduced motion it just
// sleeps, perfectly still.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import { catWorldPos } from "@/lib/piazza/cat";
import type { Game } from "@/lib/piazza/game";
import { toThree, unrotVec } from "@/lib/piazza/space";
import { Kind, N, Sun, keyA, keyB, keyOf, type World } from "@/lib/piazza/world";
import { useReducedMotion } from "./useReducedMotion";

const CAT = "#18130f";
const EYES = "#c9d84a";
const SHADOW = "#35271f";

// Model space: +x is forward, y is up, feet at y = 0. One voxel is 1 unit.
const BODY_Y = 0.24;
const LEG_LEN = 0.2;
const LEGS: { x: number; z: number; phase: number }[] = [
  { x: 0.11, z: 0.045, phase: 0 },
  { x: 0.11, z: -0.045, phase: Math.PI },
  { x: -0.1, z: 0.045, phase: Math.PI },
  { x: -0.1, z: -0.045, phase: 0 },
];
// Head and eyes, model space.
const HEAD: [number, number, number] = [0.2, BODY_Y + 0.11, 0];
const EYE_X = 0.27;
const EYE_Y = BODY_Y + 0.125;
const EYE_Z = 0.034;
const SWING = 0.55; // radians either way at full stride
const TURN_RATE = 14; // how fast the yaw eases toward the heading, per second
// Modelled at a cat's proportions, then sized to read at a glance: nose to
// the tail's curl it is just under one tile long (0.557 × 1.75 ≈ 0.98).
const SCALE = 1.75;
const BREATH_PERIOD = 4; // seconds per breath while dozing
const BREATH_DEPTH = 0.02; // ±2% scale
const BLINK_EVERY: [number, number] = [6, 10]; // seconds between blinks, random in range
const BLINK_OPEN = 0.3; // seconds the eyes stay open
const MAX_STEP = 0.1; // a resumed painting's first frame doesn't leap ahead

// The wrong shadow (prototype cat.go): a teardrop 1.9 tiles long and 0.13
// wide at the cat, narrowing to 40% of that at the far tip, toward the sun.
const SHADOW_LEN = 1.9;
const SHADOW_WIDTH = 0.13;
const SHADOW_OPACITY = 0.6;
const SHADOW_LIFT = 0.006; // above the top face, under the cat's feet
// The shadow lies only on the top faces at the cat's level: where it runs
// past an edge it stops there, instead of hanging in the air. A per-cell
// mask of those faces (N × N, engine x along u, y along v) is checked in
// the shader, after undoing the cat's lift along the view axis.
type ShadowUniforms = {
  uMask: { value: THREE.DataTexture };
  uOffset: { value: THREE.Vector3 };
  uTop: { value: number };
  uLift: { value: THREE.Vector2 };
};

function shadowMaterial(): { material: THREE.MeshBasicMaterial; uniforms: ShadowUniforms; mask: Uint8Array } {
  const mask = new Uint8Array(N * N);
  const tex = new THREE.DataTexture(mask, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const uniforms: ShadowUniforms = {
    uMask: { value: tex },
    uOffset: { value: new THREE.Vector3() },
    uTop: { value: 1 },
    uLift: { value: new THREE.Vector2(1, 1) },
  };
  const material = new THREE.MeshBasicMaterial({
    color: SHADOW,
    transparent: true,
    opacity: SHADOW_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uOffset;\nvarying vec3 vGroupPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGroupPos = transformed + uOffset;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D uMask;\nuniform float uTop;\nuniform vec2 uLift;\nvarying vec3 vGroupPos;",
      )
      .replace(
        "void main() {",
        `void main() {
  vec2 cell = floor(vec2(vGroupPos.x, vGroupPos.z) + ${N / 2}.0 - uLift * (vGroupPos.y - uTop));
  if (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, vec2(${N}.0)))) discard;
  if (texture2D(uMask, (cell + 0.5) / ${N}.0).r < 0.5) discard;`,
      );
  };
  return { material, uniforms, mask };
}

// Fills the mask with the top faces at height top (solid below, air above).
function fillMask(mask: Uint8Array, world: World, top: number) {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      mask[y * N + x] = world.at(x, y, top - 1) !== Kind.Air && world.at(x, y, top) === Kind.Air ? 255 : 0;
    }
  }
}

// The eyes' glance: up to this far toward the cursor, in world units.
const GLANCE = 0.018;

const nextBlink = (now: number) => now + BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);

// The teardrop in its own plane (x along the shadow, y across), from the
// prototype's 24-point polygon: along = (cos a + 1)/2 · L, across =
// sin a · W · (1 − 0.6·along/L).
function teardrop(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const steps = 32;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    const along = ((Math.cos(a) + 1) / 2) * SHADOW_LEN;
    const across = Math.sin(a) * SHADOW_WIDTH * (1 - (along / SHADOW_LEN) * 0.6);
    if (i === 0) shape.moveTo(along, across);
    else shape.lineTo(along, across);
  }
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape);
  // Lie flat (shape x → three x, shape y → three z), then point it toward
  // the sun's direction on the ground. The world group turns it with
  // everything else, so it stays opposite every other shadow.
  g.rotateX(Math.PI / 2);
  g.rotateY(-Math.atan2(Sun.y, Sun.x)); // engine (x, y) is three (x, z)
  return g;
}


function useCatGeometry() {
  const geo = useMemo(() => {
    const body = new THREE.CapsuleGeometry(0.075, 0.23, 4, 12);
    body.rotateZ(Math.PI / 2);
    const head = new THREE.SphereGeometry(0.085, 14, 10);
    const ear = new THREE.ConeGeometry(0.032, 0.085, 8);
    const leg = new THREE.CylinderGeometry(0.02, 0.016, LEG_LEN, 6);
    leg.translate(0, -LEG_LEN / 2, 0); // pivot at the hip
    // A long tail from the rump, sweeping up and curling over at the tip.
    const tail = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.17, BODY_Y + 0.02, 0),
        new THREE.Vector3(-0.235, BODY_Y + 0.05, 0),
        new THREE.Vector3(-0.25, BODY_Y + 0.17, 0),
        new THREE.Vector3(-0.235, BODY_Y + 0.31, 0),
        new THREE.Vector3(-0.18, BODY_Y + 0.37, 0),
      ]),
      20,
      0.018,
      6,
    );
    const eye = new THREE.SphereGeometry(0.014, 8, 6);
    const shadow = teardrop();
    return { body, head, ear, leg, tail, eye, shadow };
  }, []);
  const mat = useMemo(
    () => ({
      // Flat colors: a silhouette, not a lit toy.
      fur: new THREE.MeshBasicMaterial({ color: CAT }),
      eye: new THREE.MeshBasicMaterial({ color: EYES }),
    }),
    [],
  );
  const shade = useMemo(shadowMaterial, []);
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
      shade.material.dispose();
      shade.uniforms.uMask.value.dispose();
    },
    [geo, mat, shade],
  );
  return { geo, mat, shade };
}

// Shortest signed difference between two angles.
const angleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

// Scratch objects for the glance, reused every frame.
const _head = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _glance = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _origin = new THREE.Vector3();

// The eyes' offset in the cat's model space: GLANCE world units toward the
// pointer as seen on screen (the prototype's eye shift, in 3D: along the
// camera's right and up axes). Zero with the pointer right on the head.
function glance(root: THREE.Object3D, state: RootState, out: THREE.Vector3) {
  const { camera, pointer, size } = state;
  root.localToWorld(_head.set(HEAD[0], HEAD[1], HEAD[2]));
  _ndc.copy(_head).project(camera);
  // To CSS pixels, so the direction is true on a non-square screen.
  const dx = ((pointer.x - _ndc.x) * size.width) / 2;
  const dy = ((pointer.y - _ndc.y) * size.height) / 2;
  const len = Math.max(1, Math.hypot(dx, dy));
  _right.setFromMatrixColumn(camera.matrixWorld, 0);
  _up.setFromMatrixColumn(camera.matrixWorld, 1);
  _glance
    .copy(_right)
    .multiplyScalar((dx / len) * GLANCE)
    .addScaledVector(_up, (dy / len) * GLANCE);
  // World direction into model space (undoes the world turn, yaw and scale).
  _inv.copy(root.matrixWorld).invert();
  _origin.set(0, 0, 0).applyMatrix4(_inv);
  out.copy(_glance).applyMatrix4(_inv).sub(_origin);
  return out;
}

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
  const shadow = useRef<THREE.Mesh>(null);
  const look = useRef(new THREE.Vector3());
  const legs = useRef<(THREE.Mesh | null)[]>([]);
  const eyes = useRef<(THREE.Mesh | null)[]>([]);
  const yaw = useRef<number | null>(null);
  const blinkAt = useRef<number | null>(null);
  // The doze's own clock, summed from frame deltas. R3F's clock restarts at
  // 0 whenever the frameloop changes (the painting pausing offscreen), which
  // would strand blinkAt far in the future.
  const dozeTime = useRef(0);
  const { geo, mat, shade } = useCatGeometry();
  // What the mask was last built for: the cat's level and the tower's
  // height (the only part of the world that changes).
  const maskKey = useRef("");
  const camera = useThree((st) => st.camera);

  // Dev-only handle for headless checks.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __cat?: object };
    const handle = { root: root.current, eyes: eyes.current, shadow: shadow.current, camera };
    w.__cat = handle;
    return () => {
      if (w.__cat === handle) delete w.__cat;
    };
  }, [camera]);
  const still = useReducedMotion();

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;

    let breath = 1;
    let eyesOpen = true;
    if (dozing) {
      eyesOpen = false;
      if (!still) {
        const t = (dozeTime.current += Math.min(dt, MAX_STEP));
        breath = 1 + BREATH_DEPTH * Math.sin((t * 2 * Math.PI) / BREATH_PERIOD);
        if (blinkAt.current === null) blinkAt.current = nextBlink(t);
        if (t >= blinkAt.current + BLINK_OPEN) blinkAt.current = nextBlink(t);
        eyesOpen = t >= blinkAt.current;
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as { __doze?: object }).__doze = { t, blinkAt: blinkAt.current, eyesOpen };
        }
      }
    }
    // Feet are at y = 0, so the breath swells the cat without lifting it.
    g.scale.setScalar(SCALE * breath);
    eyes.current.forEach((e) => {
      if (e) e.visible = eyesOpen;
    });

    const cat = game.cat;
    g.position.set(...toThree(catWorldPos(cat, game.rot & 3)));
    shadow.current?.position.set(g.position.x, g.position.y + SHADOW_LIFT, g.position.z);
    // The faces it may lie on: the level of the cell the cat is on.
    const top = cat.cell.z + 1;
    const u = shade.uniforms;
    const key = `${top}:${game.world.towerTop}`;
    if (maskKey.current !== key) {
      maskKey.current = key;
      fillMask(shade.mask, game.world, top);
      u.uMask.value.needsUpdate = true;
    }
    u.uTop.value = top + SHADOW_LIFT;
    u.uOffset.value.copy(shadow.current?.position ?? g.position);
    u.uLift.value.set(...unrotVec(1, 1, game.rot & 3));

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

    // The glance follows the pointer while awake; the painting's dozing
    // cat has no pointer to follow.
    if (!dozing) {
      g.updateMatrixWorld();
      const o = glance(g, state, look.current);
      eyes.current.forEach((e, i) => e?.position.set(EYE_X + o.x, EYE_Y + o.y, (i === 0 ? EYE_Z : -EYE_Z) + o.z));
    }
  });

  return (
    <>
    {/* Not scaled with the cat: its length is in tiles, as in the prototype. */}
    <mesh ref={shadow} geometry={geo.shadow} material={shade.material} renderOrder={1} />
    <group ref={root} scale={SCALE}>
      <mesh geometry={geo.body} material={mat.fur} position={[0, BODY_Y, 0]} />
      {/* Head up and forward on a short neck line, ears pricked. */}
      <mesh geometry={geo.head} material={mat.fur} position={HEAD} scale={[1.05, 0.92, 0.95]} />
      <mesh geometry={geo.ear} material={mat.fur} position={[HEAD[0] - 0.005, BODY_Y + 0.2, 0.042]} rotation={[0.3, 0, -0.08]} />
      <mesh geometry={geo.ear} material={mat.fur} position={[HEAD[0] - 0.005, BODY_Y + 0.2, -0.042]} rotation={[-0.3, 0, -0.08]} />
      {[EYE_Z, -EYE_Z].map((z, i) => (
        <mesh
          key={z}
          ref={(m) => {
            eyes.current[i] = m;
          }}
          geometry={geo.eye}
          material={mat.eye}
          position={[EYE_X, EYE_Y, z]}
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
    </>
  );
}
