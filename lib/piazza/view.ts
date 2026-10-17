// Projection: true isometric, with the world rotated about its center.
// One voxel step along (1,1,1) lands on the same screen point, which is the
// whole trick behind the impossible connections.

import { N, type Cell } from "./world";

export interface P {
  x: number;
  y: number;
}

export interface View {
  theta: number;
  s: number;
  ox: number;
  oy: number;
  zc: number;
}

export function makeView(theta: number, s: number, ox = 0, oy = 0, zc = 3.5): View {
  return { theta, s, ox, oy, zc };
}

function rot(v: View, x: number, y: number): [number, number] {
  x -= N / 2;
  y -= N / 2;
  const c = Math.cos(v.theta);
  const s = Math.sin(v.theta);
  return [x * c - y * s, x * s + y * c];
}

export function proj(v: View, x: number, y: number, z: number): P {
  const [rx, ry] = rot(v, x, y);
  return {
    x: v.ox + (rx - ry) * v.s * 0.8660254,
    y: v.oy + (rx + ry) * v.s * 0.5 - (z - v.zc) * v.s,
  };
}

export function depth(v: View, x: number, y: number, z: number): number {
  const [rx, ry] = rot(v, x, y);
  return rx + ry + z;
}

// topCenter is where something standing on voxel c is anchored.
export function topCenter(v: View, c: Cell): P {
  return proj(v, c.x + 0.5, c.y + 0.5, c.z + 1);
}

export function topQuad(v: View, c: Cell): P[] {
  const { x, y } = c;
  const z = c.z + 1;
  return [proj(v, x, y, z), proj(v, x + 1, y, z), proj(v, x + 1, y + 1, z), proj(v, x, y + 1, z)];
}

// screenDir projects a horizontal world direction to a unit screen vector.
export function screenDir(v: View, dx: number, dy: number): P {
  const a = proj(v, N / 2, N / 2, v.zc);
  const b = proj(v, N / 2 + dx, N / 2 + dy, v.zc);
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
}

export const lerpP = (a: P, b: P, t: number): P => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
