"use client";

// The world's voxels: one mesh per Kind (its faces open to air), the arcade's
// arches and the tower's windows as dark planes on the outward faces, and
// the flag on the tower's cap. Rebuilt whenever `version` changes (the
// tower grows).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { toThree } from "@/lib/piazza/space";
import { Kind, MaxZ, N, Sun, type World } from "@/lib/piazza/world";
import { HEX, SIDE, TOP, lightAt, mixSRGB, toon } from "./light";

type Solid = Exclude<Kind, Kind.Air>;
const KINDS: Solid[] = [Kind.Wall, Kind.Brick, Kind.Path, Kind.Arcade];

// The six face directions in engine axes. Only faces open to air are
// emitted: drawing every box's six faces (an InstancedMesh of unit boxes)
// leaves the hidden faces between neighbors bleeding through along every
// shared edge as faint seams, which breaks the flat painted look.
const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

// Per-face tints baked into vertex colors. The light is fixed relative to
// the world (both turn together), so each face's lighting is known ahead:
// the tint is what turns "top color under this light" into the prototype's
// color for that face.
function faceTint(kind: Solid, [dx, dy, dz]: [number, number, number]): number[] {
  const top = new THREE.Color(TOP[kind]);
  let want: THREE.Color;
  if (dz > 0) {
    want = top.clone();
  } else if (dz < 0) {
    want = mixSRGB(SIDE[kind], HEX.shadow, 0.42);
  } else {
    const lit = Math.max(0, (dx * Sun.x + dy * Sun.y) / Math.hypot(Sun.x, Sun.y));
    want = mixSRGB(SIDE[kind], HEX.shadow, 0.42 * (1 - lit));
  }
  const l = lightAt(new THREE.Vector3(...toThreeDir([dx, dy, dz])));
  return [want.r / (top.r * l.r), want.g / (top.g * l.g), want.b / (top.b * l.b)];
}

const toThreeDir = ([x, y, z]: [number, number, number]): [number, number, number] => [x, z, y];

// The exposed faces of every voxel of one kind, as one mesh's geometry.
function kindGeometry(world: World, kind: Solid): THREE.BufferGeometry | null {
  const pos: number[] = [];
  const nrm: number[] = [];
  const col: number[] = [];
  const tints = DIRS.map((d) => faceTint(kind, d));
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let x = 0; x < N; x++)
    for (let y = 0; y < N; y++)
      for (let z = 0; z < MaxZ; z++) {
        if (world.at(x, y, z) !== kind) continue;
        DIRS.forEach((d, f) => {
          if (world.at(x + d[0], y + d[1], z + d[2]) !== Kind.Air) return;
          // The face's four corners: fix the axis along d at its far side,
          // sweep the other two.
          const axis = d.findIndex((v) => v !== 0);
          const u = (axis + 1) % 3;
          const v = (axis + 2) % 3;
          const corner = (su: number, sv: number) => {
            const p = [x, y, z];
            p[axis] += d[axis] > 0 ? 1 : 0;
            p[u] += su;
            p[v] += sv;
            return toThree({ x: p[0], y: p[1], z: p[2] });
          };
          let q = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
          // Wind counter-clockwise seen from outside (toThree mirrors axes).
          a.set(...q[0]);
          b.set(...q[1]).sub(a);
          c.set(...q[2]).sub(a);
          const n = toThreeDir(d);
          if (b.cross(c).dot(new THREE.Vector3(...n)) < 0) q = q.reverse();
          for (const i of [0, 1, 2, 0, 2, 3]) {
            pos.push(...q[i]);
            nrm.push(...n);
            col.push(...tints[f]);
          }
        });
      }
  if (pos.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

// The prototype's side faces: outward normal and corners (bottom-left,
// bottom-right, top-right, top-left) as offsets from the voxel's corner.
const SIDES: { n: [number, number]; c: [number, number, number][] }[] = [
  { n: [1, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0], c: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]] },
  { n: [0, 1], c: [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]] },
  { n: [0, -1], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
];

// archShape traces a round-topped arch in a face's (u, t) coordinates,
// exactly as the prototype does: straight jambs up to tSpring, then a
// half circle stretched 1.3× vertically.
function archShape(u0: number, u1: number, t0: number, tSpring: number): [number, number][] {
  const pts: [number, number][] = [[u0, t0], [u1, t0], [u1, tSpring]];
  const r = (u1 - u0) / 2;
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    pts.push([u0 + r + Math.cos(a) * r, tSpring + Math.sin(a) * r * 1.3]);
  }
  pts.push([u0, tSpring]);
  return pts;
}

const ARCADE_ARCH = archShape(0.2, 0.8, -1, 0.55);
const TOWER_WINDOW = archShape(0.38, 0.62, 0.15, 0.6);
const LIFT = 0.004; // off the face, so the arch never z-fights it

function archGeometry(world: World): THREE.BufferGeometry {
  const pos: number[] = [];
  for (let x = 0; x < N; x++)
    for (let y = 0; y < N; y++)
      for (let z = 0; z < MaxZ; z++) {
        const k = world.at(x, y, z);
        let shape: [number, number][] | null = null;
        if (k === Kind.Arcade && world.at(x, y, z + 1) !== Kind.Arcade && world.at(x, y, z - 1) === Kind.Arcade) {
          shape = ARCADE_ARCH;
        } else if (k === Kind.Brick && z === world.towerTop - 1) {
          shape = TOWER_WINDOW;
        }
        if (!shape) continue;
        for (const f of SIDES) {
          if (world.at(x + f.n[0], y + f.n[1], z) !== Kind.Air) continue;
          const [q0, q1, , q3] = f.c.map(([dx, dy, dz]) => new THREE.Vector3(x + dx, y + dy, z + dz));
          const du = q1.clone().sub(q0);
          const dt = q3.clone().sub(q0);
          const at = ([u, t]: [number, number]) => {
            const p = q0.clone().addScaledVector(du, u).addScaledVector(dt, t);
            p.x += f.n[0] * LIFT;
            p.y += f.n[1] * LIFT;
            return toThree(p);
          };
          const ring = shape.map(at);
          for (let i = 1; i + 1 < ring.length; i++) pos.push(...ring[0], ...ring[i], ...ring[i + 1]);
        }
      }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// The flag: a thin black pole on the cap's top center and a red pennant.
function flag(world: World, disposables: { dispose(): void }[]): THREE.Group {
  const g = new THREE.Group();
  const [bx, by, bz] = toThree({ x: 1.5, y: 1.5, z: world.towerTop + 2 });
  g.position.set(bx, by, bz);
  const H = 1.3;
  const poleGeom = new THREE.CylinderGeometry(0.03, 0.03, H, 6);
  const poleMat = toon(HEX.ink);
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.y = H / 2;
  pole.castShadow = true;
  const cloth = new THREE.BufferGeometry();
  // In the pole's local frame: from the top, 0.75 out, sagging 0.18, back
  // to the pole 0.4 below the top. "Out" is world +x, which reads at every
  // quarter turn (never edge-on in the isometric view).
  cloth.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, H, 0, 0.75, H - 0.18, 0, 0, H - 0.4, 0], 3),
  );
  const clothMat = new THREE.MeshBasicMaterial({ color: HEX.flag, side: THREE.DoubleSide });
  const pennant = new THREE.Mesh(cloth, clothMat);
  pennant.castShadow = true;
  g.add(pole, pennant);
  disposables.push(poleGeom, poleMat, cloth, clothMat);
  return g;
}

function build(world: World) {
  const root = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  for (const kind of KINDS) {
    const geom = kindGeometry(world, kind);
    if (!geom) continue;
    const mat = new THREE.MeshLambertMaterial({ color: TOP[kind], vertexColors: true });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    disposables.push(geom, mat);
  }
  const archGeom = archGeometry(world);
  const archMat = new THREE.MeshBasicMaterial({
    color: HEX.shadow,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  root.add(new THREE.Mesh(archGeom, archMat));
  disposables.push(archGeom, archMat);
  root.add(flag(world, disposables));
  return { root, dispose: () => disposables.forEach((d) => d.dispose()) };
}

export function Voxels({ world, version }: { world: World; version: number }) {
  // version is the rebuild signal: the World mutates in place when the
  // tower grows, so its identity alone wouldn't change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => build(world), [world, version]);
  useEffect(() => built.dispose, [built]);
  return <primitive object={built.root} />;
}
