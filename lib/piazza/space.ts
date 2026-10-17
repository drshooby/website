// Mapping between the engine's world and a three.js scene, plus framing.
// No three import here: the scene (orthographic camera along ISO_DIR, world
// group rotated about the vertical axis) is built elsewhere, and this file
// holds only the math that keeps it identical to view.ts's 2D projection.

import { makeView, proj, type View } from "./view";
import { Kind, MaxZ, N, World, packKey, type Key, type Vec3 } from "./world";

// Camera sits at target + ISO_DIR * 50, looks at the target, up is +y.
export const ISO_DIR: [number, number, number] = [1, 1, 1];

// Engine (x, y, z-up) to three (x, y-up, z), centered on the world.
export const toThree = (p: Vec3): [number, number, number] => [p.x - N / 2, p.z, p.y - N / 2];

export const fromThree = (v: [number, number, number]): Vec3 => ({
  x: v[0] + N / 2,
  y: v[2] + N / 2,
  z: v[1],
});

// The world group's rotation.y for a view angle theta (view.ts's rot()).
export const groupRotationY = (theta: number): number => -theta;

// Continuous version of rotCell: rotates a point by r quarter turns.
export function rotPoint(x: number, y: number, r: number): [number, number] {
  switch (r & 3) {
    case 1:
      return [N - y, x];
    case 2:
      return [N - x, N - y];
    case 3:
      return [y, N - x];
  }
  return [x, y];
}

// unrotVec maps a direction in rotated space back to world x, y, so a shift
// of d along the view axis is unrotVec(1, 1, r) * d in x, y plus d in z.
export function unrotVec(x: number, y: number, r: number): [number, number] {
  switch (r & 3) {
    case 1:
      return [y, -x];
    case 2:
      return [-x, -y];
    case 3:
      return [-y, x];
  }
  return [x, y];
}

// The screen key under any visible surface point: an isometric screen point
// fixes (rx - z, ry - z), whatever the point's height.
export function keyAtPoint(p: Vec3, r: number): Key {
  const [rx, ry] = rotPoint(p.x, p.y, r);
  return packKey(Math.floor(rx - p.z), Math.floor(ry - p.z));
}

const MARGIN = 24;
const FLAG_HEADROOM = 2;

// frameFor picks scale and vertical center so the whole scene (including the
// tower with room for its flag) fits at every rotation. ox/oy are the
// viewport center; the bounds are measured at unit scale and solved directly.
export function frameFor(width: number, height: number, towerTop: number): View {
  const world = new World({ towerTop });
  const top = world.towerTop;
  let maxX = 0;
  let minQ = Infinity;
  let maxQ = -Infinity;
  const take = (v: View, x: number, y: number, z: number) => {
    const p = proj(v, x, y, z);
    maxX = Math.max(maxX, Math.abs(p.x));
    minQ = Math.min(minQ, p.y);
    maxQ = Math.max(maxQ, p.y);
  };
  for (let r = 0; r < 4; r++) {
    // Unit scale, zero center: p.y = q, so zc = -(minQ + maxQ) / 2 recenters.
    const v = makeView((r * Math.PI) / 2, 1, 0, 0, 0);
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < MaxZ; z++) {
          if (world.at(x, y, z) === Kind.Air) continue;
          for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) {
            take(v, x + dx, y + dy, z + dz);
          }
        }
      }
    }
    // Flag headroom above the tower's cap.
    for (const dx of [1, 2]) for (const dy of [1, 2]) take(v, dx, dy, top + 2 + FLAG_HEADROOM);
  }
  const s = Math.min((width / 2 - MARGIN) / maxX, (height - 2 * MARGIN) / (maxQ - minQ));
  return makeView(0, s, width / 2, height / 2, -(minQ + maxQ) / 2);
}
