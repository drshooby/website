// The cat's walk: which cell it's on, and its slide along a path.
// Drawing lives with the renderer; this is only the state machine.

import { unrotVec } from "./space";
import type { Cell, Vec3 } from "./world";
import { depth as viewDepth, lerpP, topCenter, type P, type View } from "./view";

export const catSpeed = 3.0; // tiles per second

export class Cat {
  cell: Cell;
  path: Cell[] | null = null; // world cells to walk through, in screen order
  seg = 0;
  t = 0;
  facing = 1;
  phase = 0;
  target = -1; // landmark to open on arrival, or -1

  constructor(cell: Cell) {
    this.cell = cell;
  }

  get walking(): boolean {
    return this.path !== null;
  }

  walk(path: Cell[], target: number) {
    this.path = path.length < 2 ? null : path;
    this.seg = 0;
    this.t = 0;
    this.target = target;
  }

  // pos is the cat's screen anchor. Neighboring keys are neighboring rhombi on
  // screen, so walking is a plain 2D slide even when the cells are worlds apart.
  pos(v: View): P {
    if (!this.path) {
      return topCenter(v, this.cell);
    }
    return lerpP(topCenter(v, this.path[this.seg]), topCenter(v, this.path[this.seg + 1]), this.t);
  }

  depth(v: View): number {
    const d = (k: Cell) => viewDepth(v, k.x + 0.5, k.y + 0.5, k.z) + 1.5;
    if (!this.path) {
      return d(this.cell);
    }
    return Math.max(d(this.path[this.seg]), d(this.path[this.seg + 1]));
  }

  // update advances the walk. It returns true on the frame the cat arrives.
  update(dt: number, v: View): boolean {
    if (!this.path) {
      return false;
    }
    this.phase += dt * 12;
    const from = topCenter(v, this.path[this.seg]);
    const to = topCenter(v, this.path[this.seg + 1]);
    const dx = to.x - from.x;
    if (Math.abs(dx) > 0.01) {
      this.facing = Math.sign(dx);
    }
    this.t += dt * catSpeed;
    while (this.t >= 1) {
      this.t--;
      this.seg++;
      this.cell = this.path[this.seg];
      if (this.seg === this.path.length - 1) {
        this.path = null;
        this.phase = 0;
        return true;
      }
    }
    return false;
  }
}

// catWorldPos is the cat's 3D anchor. A cell shifted by d along the view axis
// (d in rotated x, y and z) projects to the same screen point, so both ends of
// a segment are lifted onto the front layer h = max(A.z, B.z). The cat then
// slides in plain 3D and stays drawn in front of whatever it crosses.
export function catWorldPos(cat: Cat, r: number): Vec3 {
  const top = (c: Cell) => ({ x: c.x + 0.5, y: c.y + 0.5, z: c.z + 1 });
  if (!cat.path) {
    return top(cat.cell);
  }
  const a = cat.path[cat.seg];
  const b = cat.path[cat.seg + 1];
  const h = Math.max(a.z, b.z);
  // World-space step for one unit along the rotated (1, 1) direction.
  const [ux, uy] = unrotVec(1, 1, r);
  const lift = (c: Cell): Vec3 => {
    const d = h - c.z;
    const p = top(c);
    return { x: p.x + ux * d, y: p.y + uy * d, z: p.z + d };
  };
  const pa = lift(a);
  const pb = lift(b);
  return {
    x: pa.x + (pb.x - pa.x) * cat.t,
    y: pa.y + (pb.y - pa.y) * cat.t,
    z: pa.z + (pb.z - pa.z) * cat.t,
  };
}
