// The game controller: rotation, click-to-walk, and the events a UI reacts to.
// Ported from the Go prototype's Update/settle/goTo (piazza/main.go), minus
// rendering and input devices. Plain TS, no DOM.

import { Cat } from "./cat";
import { makeView } from "./view";
import {
  dirs,
  findPath,
  keyA,
  keyB,
  keyOf,
  Kind,
  Prop,
  sameCell,
  settleCell,
  type Cell,
  type Key,
  type NodeMap,
  type World,
} from "./world";

export type GameEvent =
  | { type: "arrived"; landmark: number }
  | { type: "unreachable"; landmark: number } // -1: a tile, not a landmark
  | { type: "turned"; rot: number }; // rot & 3 after settling

export class Game {
  readonly world: World;
  readonly cat: Cat;
  rot = 0; // unbounded; use rot & 3 for lookups
  theta = 0; // eased angle, radians
  nodes: NodeMap;
  private events: GameEvent[] = [];

  constructor(world: World) {
    this.world = world;
    this.cat = new Cat(world.start);
    this.nodes = world.nodes(0);
  }

  get rotating(): boolean {
    return Math.abs(this.theta - (this.rot * Math.PI) / 2) > 1e-4;
  }

  get busy(): boolean {
    return this.rotating || this.cat.walking;
  }

  turn(dir: 1 | -1): boolean {
    if (this.busy) {
      return false;
    }
    this.rot += dir;
    return true;
  }

  clickKey(key: Key) {
    if (this.busy || !this.nodes.get(key)?.walkable) {
      return;
    }
    this.goTo(key, -1);
  }

  goToLandmark(i: number) {
    const lm = this.world.landmarks[i];
    if (this.busy || !lm) {
      return;
    }
    this.goTo(keyOf(lm.on, this.rot & 3), i);
  }

  tick(dt: number): GameEvent[] {
    if (this.rotating) {
      const target = (this.rot * Math.PI) / 2;
      this.theta += (target - this.theta) * Math.min(1, dt * 5);
      if (Math.abs(target - this.theta) < 2e-3) {
        this.theta = target;
        this.settle();
      }
    } else if (this.cat.update(dt, makeView(this.theta, 1))) {
      // growTower may have changed the ground mid-walk, so re-check on arrival.
      this.rehome();
      if (this.cat.target >= 0) {
        this.events.push({ type: "arrived", landmark: this.cat.target });
        this.cat.target = -1;
      }
    }
    const out = this.events;
    this.events = [];
    return out;
  }

  growTower() {
    this.world.growTower();
    this.nodes = this.world.nodes(this.rot & 3);
    if (!this.cat.walking && !this.rotating) {
      this.rehome();
    }
  }

  // settle runs when a rotation finishes. The cat is wherever it appears to
  // be: if another tile now sits in front of it on screen, that's where it
  // stands.
  private settle() {
    const r = this.rot & 3;
    this.nodes = this.world.nodes(r);
    this.cat.cell = settleCell(this.nodes, this.cat.cell, r);
    // Something swung in front of the cat (the tower, say): it walks out
    // from behind it rather than jumping. rehome is the last resort.
    const out = this.escape();
    if (out) {
      this.cat.walk(out, -1);
    } else {
      this.rehome();
    }
    this.events.push({ type: "turned", rot: r });
  }

  // escape finds the shortest walk from a hidden cat to the nearest tile it
  // can visibly stand on. Behind whatever covers it, the cat walks its own
  // floor: same-height Path tops next to it in the world (unoccupied, air
  // above). Same-height neighbors are also neighbors on screen, so the walk
  // is the usual slide, just starting out of sight. Null if it's already
  // visible or its floor never comes back into view.
  private escape(): Cell[] | null {
    const r = this.rot & 3;
    const visible = (c: Cell) => {
      const n = this.nodes.get(keyOf(c, r));
      return !!n?.walkable && sameCell(n.cell, c);
    };
    // A doorway can be walked through (the arcade walkway's only way back
    // into view at one angle); the other props are solid.
    const passable = (c: Cell) => {
      const lm = this.world.landmarkAt(c);
      return lm < 0 || this.world.landmarks[lm].prop === Prop.Doorway;
    };
    const floor = (c: Cell) =>
      this.world.at(c.x, c.y, c.z) === Kind.Path && this.world.at(c.x, c.y, c.z + 1) === Kind.Air && passable(c);
    const start = this.cat.cell;
    if (visible(start)) {
      return null;
    }
    const id = (c: Cell) => `${c.x},${c.y}`;
    const prev = new Map<string, Cell | null>([[id(start), null]]);
    const queue: Cell[] = [start];
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head];
      for (const [dx, dy] of dirs) {
        const next = { x: cur.x + dx, y: cur.y + dy, z: cur.z };
        if (prev.has(id(next)) || !floor(next)) {
          continue;
        }
        prev.set(id(next), cur);
        if (visible(next)) {
          const path: Cell[] = [];
          for (let c: Cell | null = next; c; c = prev.get(id(c))!) path.push(c);
          return path.reverse();
        }
        queue.push(next);
      }
    }
    return null;
  }

  // rehome covers what the prototype leaves loose: a rotation can hide the
  // cat's tile behind a wall, with nothing walkable in its place. The cat
  // slides to the closest tile on screen so it never stands inside a wall.
  private rehome() {
    const r = this.rot & 3;
    const here = keyOf(this.cat.cell, r);
    if (this.nodes.get(here)?.walkable) {
      return;
    }
    let best = Infinity;
    for (const [k, n] of this.nodes) {
      const d = Math.abs(keyA(k) - keyA(here)) + Math.abs(keyB(k) - keyB(here));
      if (n.walkable && d < best) {
        best = d;
        this.cat.cell = n.cell;
      }
    }
  }

  private goTo(goal: Key, landmark: number) {
    const r = this.rot & 3;
    const keys = findPath(this.nodes, keyOf(this.cat.cell, r), goal);
    if (!keys) {
      this.events.push({ type: "unreachable", landmark });
      return;
    }
    const cells = [this.cat.cell, ...keys.slice(1).map((k) => this.nodes.get(k)!.cell)];
    this.cat.walk(cells, landmark);
    if (!this.cat.walking && landmark >= 0) {
      this.events.push({ type: "arrived", landmark });
      this.cat.target = -1;
    }
  }
}
