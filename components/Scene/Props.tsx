"use client";

// The landmarks: simple primitives standing on the top center of their
// voxel, in the toon two-tone of the prototype's billboards. Each stands
// about as tall as its landmark's shadow `height`, so its cast shadow
// matches the world's.
//
// Each reacts once when clicked, so the click registers before the cat gets
// there: the column shudders, the veiled figure sways, the doorway blinks,
// the bananas hop, the easel's canvas swings. Off under reduced motion.

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { toThree } from "@/lib/piazza/space";
import { Prop, type Landmark, type World } from "@/lib/piazza/world";
import { HEX, toon } from "./light";
import { useReducedMotion } from "./useReducedMotion";

type PropsProps = {
  world: World;
  onLandmark?: (i: number) => void;
  onHover?: (i: number | null) => void;
};

// Shared across props and kept for the page's lifetime: a handful of
// materials, far cheaper than churning them.
const MAT = {
  marble: toon(HEX.marble),
  veil: toon(HEX.veil),
  wood: toon(HEX.wood),
  canvasBack: toon(HEX.canvasBack),
  plinth: toon(HEX.wallSide),
  frame: toon(HEX.wallTop),
  banana: toon(HEX.banana),
  shadow: new THREE.MeshBasicMaterial({ color: HEX.shadow, side: THREE.DoubleSide }),
};

const AVATAR = "/avatar.webp";

const shadowed = (o: THREE.Object3D) => {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) c.castShadow = c.receiveShadow = true;
  });
  return o;
};

function Mesh({ geometry, material, ...rest }: { geometry: THREE.BufferGeometry; material: THREE.Material } & Omit<
  React.ComponentProps<"mesh">,
  "geometry" | "material"
>) {
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh ref={(m) => void (m && shadowed(m))} geometry={geometry} material={material} {...rest} />;
}

// ---------------------------------------------------------------------------

// When a landmark was last clicked (performance.now(), ms). Not R3F's clock:
// that restarts whenever the frameloop changes.
type Poke = React.MutableRefObject<number>;
const REACT_MS = 650;

// How far through its reaction a prop is: 0..1, or null when at rest.
function progress(poke: Poke, ms = REACT_MS): number | null {
  const k = (performance.now() - poke.current) / ms;
  return k >= 0 && k < 1 ? k : null;
}

// A decaying wobble: `cycles` swings that die out by the end.
const wobble = (k: number, cycles: number, decay = 1.5) => Math.sin(k * Math.PI * 2 * cycles) * (1 - k) ** decay;

function Easel({ poke }: { poke: Poke }) {
  // Loaded without suspending: if the image fails, the board stays dark
  // rather than taking the scene down.
  const face = useMemo(() => new THREE.MeshBasicMaterial({ color: HEX.canvasBack }), []);
  // A still painting (reduced motion) draws on demand: ask for the frame.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let tex: THREE.Texture | null = null;
    let live = true;
    new THREE.TextureLoader().load(AVATAR, (t) => {
      if (!live) return t.dispose();
      t.colorSpace = THREE.SRGBColorSpace;
      tex = t;
      face.map = t;
      face.color.set("#ffffff");
      face.needsUpdate = true;
      invalidate();
    }, undefined, (e) => console.warn("avatar load failed", e));
    return () => {
      live = false;
      tex?.dispose();
      face.dispose();
    };
  }, [face, invalidate]);
  const leg = useMemo(() => new THREE.BoxGeometry(0.06, 1.95, 0.06), []);
  const board = useMemo(() => new THREE.BoxGeometry(1.0, 1.0, 0.05), []);
  const picture = useMemo(() => new THREE.PlaneGeometry(0.9, 0.9), []);
  useEffect(() => () => picture.dispose(), [picture]);
  const ledge = useMemo(() => new THREE.BoxGeometry(1.1, 0.06, 0.16), []);
  // Poked: the canvas swings on its ledge as if nudged, then settles.
  const canvas = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = progress(poke);
    if (canvas.current) canvas.current.rotation.x = k === null ? 0 : -0.14 * wobble(k, 1.5);
  });
  // Faces engine +y, toward the piazza (the first view sees it head-on-ish).
  return (
    <group rotation-x={-0.08}>
      <Mesh geometry={leg} material={MAT.wood} position={[-0.32, 0.95, 0.12]} rotation-z={-0.14} />
      <Mesh geometry={leg} material={MAT.wood} position={[0.32, 0.95, 0.12]} rotation-z={0.14} />
      <Mesh geometry={leg} material={MAT.wood} position={[0, 0.9, -0.35]} rotation-x={-0.35} />
      <Mesh geometry={ledge} material={MAT.wood} position={[0, 0.72, 0.16]} />
      {/* Pivots where it rests on the ledge; same resting place as before. */}
      <group ref={canvas} position={[0, 0.72, 0.1]}>
        <Mesh geometry={board} material={MAT.canvasBack} position={[0, 0.55, 0]} />
        <mesh geometry={picture} material={face} position={[0, 0.55, 0.026]} />
      </group>
    </group>
  );
}

// A fluted shaft snapped off at a slant, on a square plinth.
function Column({ poke }: { poke: Poke }) {
  // Poked: a short heavy shudder, old stone settling.
  const standing = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = progress(poke, 500);
    if (!standing.current) return;
    standing.current.rotation.z = k === null ? 0 : 0.035 * wobble(k, 3.5, 2);
    standing.current.position.x = k === null ? 0 : 0.02 * wobble(k, 4.5, 2);
  });
  const plinth = useMemo(() => new THREE.BoxGeometry(0.62, 0.16, 0.62), []);
  const shaft = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.2, 0.22, 1.6, 18, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < 0.79) continue;
      const x = p.getX(i);
      const z = p.getZ(i);
      const a = Math.atan2(z, x);
      p.setY(i, 0.8 + 0.1 * Math.sin(a * 3) + 0.05 * Math.sin(a * 7) - 0.45 * x);
    }
    return g;
  }, []);
  const drum = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, 0.22, 18), []);
  return (
    <group>
      {/* The plinth and shaft shudder; the fallen piece lies still. */}
      <group ref={standing}>
        <Mesh geometry={plinth} material={MAT.marble} position={[0, 0.08, 0]} />
        <Mesh geometry={shaft} material={MAT.marble} position={[0, 0.96, 0]} />
      </group>
      {/* The fallen piece, lying at the plinth's foot. */}
      <Mesh geometry={drum} material={MAT.marble} position={[0.08, 0.27, 0.32]} rotation={[Math.PI / 2, 0, 0.6]} />
    </group>
  );
}

// A figure on a plinth, its head and shoulders under a veil with a
// rippling hem.
function Statue({ poke }: { poke: Poke }) {
  // Poked: the veiled figure sways once, as if a breeze went through.
  const figure = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = progress(poke, 800);
    if (!figure.current) return;
    figure.current.rotation.z = k === null ? 0 : 0.07 * wobble(k, 1.25, 1.8);
    figure.current.rotation.x = k === null ? 0 : 0.035 * wobble(k, 1, 1.8);
  });
  const plinth = useMemo(() => new THREE.BoxGeometry(0.6, 0.35, 0.6), []);
  const body = useMemo(
    () =>
      new THREE.LatheGeometry(
        [0.27, 0.24, 0.2, 0.14, 0.12, 0.001].map((r, i) => new THREE.Vector2(r, [0, 0.4, 0.8, 1.1, 1.2, 1.24][i])),
        20,
      ),
    [],
  );
  const veil = useMemo(() => {
    // Bottom to top, so the lathe's faces and normals point outward.
    const prof: [number, number][] = [
      [0.3, 0.72],
      [0.25, 0.95],
      [0.2, 1.22],
      [0.18, 1.4],
      [0.12, 1.52],
      [0.001, 1.55],
    ];
    const g = new THREE.LatheGeometry(
      prof.map(([r, y]) => new THREE.Vector2(r, y)),
      24,
    );
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 0.73) continue;
      const a = Math.atan2(p.getZ(i), p.getX(i));
      p.setY(i, 0.72 + 0.06 * Math.sin(a * 5));
    }
    return g;
  }, []);
  return (
    <group>
      <Mesh geometry={plinth} material={MAT.marble} position={[0, 0.175, 0]} />
      {/* Sways from its feet, on top of the plinth. */}
      <group ref={figure} position={[0, 0.35, 0]}>
        <Mesh geometry={body} material={MAT.marble} />
        <Mesh geometry={veil} material={MAT.veil} />
      </group>
    </group>
  );
}

// An arched door frame, standing alone, its dark interior now and then
// lit gold for a moment (0.6s, every 9–14s), as if something passed.
function Doorway({ poke }: { poke: Poke }) {
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const next = useRef(-1);
  const still = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (still.current = mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useFrame(({ clock }) => {
    const m = glow.current;
    if (!m) return;
    const t = clock.elapsedTime;
    if (next.current < 0) next.current = t + 9 + Math.random() * 5;
    const k = (t - next.current) / 0.6;
    if (k > 1) next.current = t + 9 + Math.random() * 5;
    const idle = still.current || k < 0 || k > 1 ? 0 : 0.85 * Math.sin(Math.PI * k);
    // Poked: it blinks, one quick bright flash.
    const p = progress(poke, 450);
    m.opacity = Math.max(idle, p === null ? 0 : 0.95 * Math.sin(Math.PI * p));
  });

  const { frame, opening } = useMemo(() => {
    const arch = (w: number, h: number) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0);
      s.lineTo(w / 2, 0);
      s.lineTo(w / 2, h);
      s.absarc(0, h, w / 2, 0, Math.PI, false);
      s.lineTo(-w / 2, 0);
      return s;
    };
    const outer = arch(0.9, 1.45);
    const inner = arch(0.58, 1.32);
    outer.holes.push(inner);
    const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.22, bevelEnabled: false, curveSegments: 16 });
    frame.translate(0, 0, -0.11);
    const opening = new THREE.ShapeGeometry(inner, 16);
    return { frame, opening };
  }, []);
  useEffect(() => () => opening.dispose(), [opening]);
  return (
    <group>
      <Mesh geometry={frame} material={MAT.frame} />
      <mesh geometry={opening} material={MAT.shadow} />
      <mesh geometry={opening} position-z={0.004}>
        <meshBasicMaterial ref={glow} color={HEX.gold} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Two bananas on a tall plinth: curved capsules, a torus arc with round
// ends. The bunch tops out at about 1.0, the landmark's shadow height.
const BANANA_PLINTH = 0.74;
function Bananas({ poke }: { poke: Poke }) {
  const plinth = useMemo(() => new THREE.BoxGeometry(0.56, BANANA_PLINTH, 0.42), []);
  // Poked: a little hop, squash and stretch: crouch, spring up (stretched),
  // land (squashed), wobble to rest. Volume-preserving: xz scale by 1/√y.
  const bunch = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = bunch.current;
    if (!g) return;
    const k = progress(poke, 700);
    let y = 0;
    let sy = 1;
    let rz = 0;
    if (k !== null) {
      if (k < 0.12) {
        sy = 1 - 0.22 * Math.sin(((k / 0.12) * Math.PI) / 2);
      } else if (k < 0.6) {
        const u = (k - 0.12) / 0.48;
        y = 0.32 * Math.sin(Math.PI * u);
        sy = 1 + 0.14 * (1 - u);
      } else if (k < 0.72) {
        sy = 1 - 0.18 * Math.sin((Math.PI * (k - 0.6)) / 0.12);
      } else {
        rz = 0.14 * wobble((k - 0.72) / 0.28, 1.5);
      }
    }
    g.position.y = BANANA_PLINTH + y;
    g.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    g.rotation.z = rz;
  });
  const { arc, tip } = useMemo(() => {
    const R = 0.24;
    const r = 0.058;
    const sweep = 2.0;
    const arc = new THREE.TorusGeometry(R, r, 8, 18, sweep);
    // Turn the arc's middle to the bottom, so it lies like a smile.
    arc.rotateZ(-Math.PI / 2 - sweep / 2);
    arc.translate(0, R, 0);
    const tip = new THREE.SphereGeometry(r, 8, 6);
    return { arc, tip };
  }, []);
  const R = 0.24;
  const end = (side: 1 | -1): [number, number, number] => [side * R * Math.sin(1), R - R * Math.cos(1), 0];
  const banana = (key: string, pos: [number, number, number], rotY: number, tilt: number) => (
    <group key={key} position={pos} rotation={[tilt, rotY, 0]}>
      <Mesh geometry={arc} material={MAT.banana} />
      <Mesh geometry={tip} material={MAT.wood} position={end(1)} />
      <Mesh geometry={tip} material={MAT.banana} position={end(-1)} />
    </group>
  );
  return (
    <group>
      <Mesh geometry={plinth} material={MAT.plinth} position={[0, BANANA_PLINTH / 2, 0]} />
      {/* The bunch hops off the plinth's top, its pivot. */}
      <group ref={bunch} position-y={BANANA_PLINTH}>
        {banana("a", [0, 0.06, -0.07], 0.25, 0)}
        {banana("b", [0.02, 0.1, 0.08], -0.35, 0.35)}
      </group>
    </group>
  );
}

const SHAPES: Record<Prop, (p: { poke: Poke }) => React.ReactElement> = {
  [Prop.Easel]: Easel,
  [Prop.Column]: Column,
  [Prop.Statue]: Statue,
  [Prop.Doorway]: Doorway,
  [Prop.Bananas]: Bananas,
};

function Landmark3D({ lm, i, onLandmark, onHover }: { lm: Landmark; i: number } & Omit<PropsProps, "world">) {
  const Shape = SHAPES[lm.prop];
  const at = toThree({ x: lm.on.x + 0.5, y: lm.on.y + 0.5, z: lm.on.z + 1 });
  const stop = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation();
  const poke = useRef(-Infinity);
  const still = useReducedMotion();
  return (
    <group
      position={at}
      onClick={
        onLandmark
          ? (e) => {
              stop(e);
              if (!still) poke.current = performance.now();
              onLandmark(i);
            }
          : undefined
      }
      onPointerOver={onHover ? (e) => (stop(e), onHover(i)) : undefined}
      onPointerOut={onHover ? () => onHover(null) : undefined}
    >
      <Shape poke={poke} />
    </group>
  );
}

export function Props({ world, onLandmark, onHover }: PropsProps) {
  return (
    <>
      {world.landmarks.map((lm, i) => (
        <Landmark3D key={lm.title} lm={lm} i={i} onLandmark={onLandmark} onHover={onHover} />
      ))}
    </>
  );
}
