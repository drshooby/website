// The cat's walk: which cell it's on, and its slide along a path.
// Drawing lives with the renderer; this is only the state machine.

import type { Cell } from "./world";
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
