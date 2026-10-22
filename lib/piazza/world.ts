// The piazza's world: voxels, landmarks, shadows, and the walking rule.
// Ported from the Go prototype (piazza/world.go). Plain TS, no DOM, so it
// can back any renderer and run under `bun test`.

export const N = 12; // world is N x N columns
export const MaxZ = 12;

export enum Kind {
  Air,
  Wall,
  Brick,
  Path, // walkable top
  Arcade, // wall with an arch cut into its side faces
}

export enum Prop {
  Easel,
  Column,
  Statue,
  Doorway,
  Bananas,
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function norm(v: Vec3): Vec3 {
  const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

// Sun points toward the sun. Low elevation = long de Chirico shadows.
export const Sun = norm({ x: 0.75, y: -1, z: 0.62 });

export interface Cell {
  x: number;
  y: number;
  z: number;
}

export const sameCell = (a: Cell, b: Cell) =>
  a.x === b.x && a.y === b.y && a.z === b.z;

export interface Landmark {
  title: string;
  prop: Prop;
  on: Cell; // the voxel the prop stands on
  height: number; // voxels of shadow it casts
}

const idx = (x: number, y: number, z: number) => (x * N + y) * MaxZ + z;

export class World {
  private vox = new Uint8Array(N * N * MaxZ);
  private shadows = new Uint16Array(N * N * MaxZ); // 4x4 shadow bits per top face
  landmarks: Landmark[];
  start: Cell;
  private top = 6;

  constructor(opts: { towerTop?: number } = {}) {
    const t = opts.towerTop;
    this.top = typeof t === "number" && Number.isFinite(t) ? Math.min(MaxZ - 2, Math.max(6, Math.round(t))) : 6;
    // The piazza: where the cat wakes up.
    this.box(0, 6, 0, 5, 11, 0, Kind.Path);
    // An arcade along its back edge, with a walkway on top.
    this.box(0, 5, 0, 5, 5, 1, Kind.Arcade);
    this.box(0, 5, 2, 5, 5, 2, Kind.Path);
    // A floating gallery off to the right, higher up.
    this.box(7, 7, 3, 11, 9, 3, Kind.Path);
    this.box(7, 7, 0, 7, 7, 2, Kind.Brick);
    // A thin bridge in front, high above the piazza floor.
    this.box(6, 11, 4, 11, 11, 4, Kind.Path);
    // A back terrace reached only through the illusion.
    this.box(7, 0, 5, 11, 3, 5, Kind.Path);
    this.box(11, 0, 0, 11, 0, 4, Kind.Wall);
    // The tower.
    this.buildTower();

    this.start = { x: 1, y: 9, z: 0 };
    this.landmarks = [
      {
        title: "David Shubov",
        prop: Prop.Easel,
        on: { x: 1, y: 7, z: 0 },
        height: 2,
      },
      {
        title: "Relic",
        prop: Prop.Column,
        on: { x: 10, y: 8, z: 3 },
        height: 2,
      },
      {
        title: "Veil",
        prop: Prop.Statue,
        on: { x: 9, y: 1, z: 5 },
        height: 2,
      },
      {
        title: "Blink",
        prop: Prop.Doorway,
        on: { x: 2, y: 5, z: 2 },
        height: 2,
      },
      {
        title: "Radiant",
        prop: Prop.Bananas,
        on: { x: 10, y: 11, z: 4 },
        height: 1,
      },
    ];
    this.computeShadows();
  }

  get towerTop(): number {
    return this.top;
  }

  at(x: number, y: number, z: number): Kind {
    if (x < 0 || y < 0 || z < 0 || x >= N || y >= N || z >= MaxZ) {
      return Kind.Air;
    }
    return this.vox[idx(x, y, z)];
  }

  // shadow returns the 4x4 shadow bitmask of the top face of voxel (x, y, z).
  // Bit i*4+j is set when sample (i, j) of that face is in shadow.
  shadow(x: number, y: number, z: number): number {
    return this.shadows[idx(x, y, z)];
  }

  private box(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    k: Kind,
  ) {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          this.vox[idx(x, y, z)] = k;
        }
      }
    }
  }

  private buildTower() {
    this.box(1, 1, 0, 2, 2, this.top, Kind.Brick);
    this.box(1, 1, this.top + 1, 1, 1, this.top + 1, Kind.Wall);
  }

  // growTower is called when the visitor comes back to the tab.
  // The tower is taller than they remember.
  growTower() {
    if (this.top + 2 >= MaxZ) {
      return;
    }
    this.top++;
    this.buildTower();
    this.computeShadows();
  }

  landmarkAt(c: Cell): number {
    return this.landmarks.findIndex((l) => sameCell(l.on, c));
  }

  private occludes(x: number, y: number, z: number): boolean {
    if (this.at(x, y, z) !== Kind.Air) {
      return true;
    }
    return this.landmarks.some(
      (l) =>
        l.on.x === x && l.on.y === y && z > l.on.z && z <= l.on.z + l.height,
    );
  }

  private computeShadows() {
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < MaxZ; z++) {
          this.shadows[idx(x, y, z)] = 0;
          if (this.at(x, y, z) === Kind.Air || this.at(x, y, z + 1) !== Kind.Air) {
            continue;
          }
          let bits = 0;
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
              const p = {
                x: x + (i + 0.5) / 4,
                y: y + (j + 0.5) / 4,
                z: z + 1 + 0.01,
              };
              if (this.rayBlocked(p)) {
                bits |= 1 << (i * 4 + j);
              }
            }
          }
          this.shadows[idx(x, y, z)] = bits;
        }
      }
    }
  }

  private rayBlocked(p: Vec3): boolean {
    for (let t = 0.05; ; t += 0.05) {
      const q = { x: p.x + Sun.x * t, y: p.y + Sun.y * t, z: p.z + Sun.z * t };
      if (q.z >= MaxZ || q.x < -1 || q.y < -1 || q.x > N + 1 || q.y > N + 1) {
        return false;
      }
      if (this.occludes(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))) {
        return true;
      }
    }
  }

  // nodes returns the frontmost visible top face for every screen key.
  nodes(r: number): NodeMap {
    const nodes: NodeMap = new Map();
    const depth = new Map<number, number>();
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < MaxZ; z++) {
          const k = this.at(x, y, z);
          if (k === Kind.Air) {
            continue;
          }
          const c = { x, y, z };
          const key = keyOf(c, r);
          const [rx, ry] = rotCell(x, y, r);
          const d = rx + ry + z;
          const old = depth.get(key);
          if (old !== undefined && old >= d) {
            continue;
          }
          depth.set(key, d);
          if (this.at(x, y, z + 1) !== Kind.Air) {
            // Covered top: whatever shows here is a side face.
            nodes.set(key, { cell: c, walkable: false, landmark: -1 });
            continue;
          }
          const lm = this.landmarkAt(c);
          nodes.set(key, {
            cell: c,
            walkable: k === Kind.Path && lm < 0,
            landmark: lm,
          });
        }
      }
    }
    // A voxel's side faces also cover the keys just in front of its top
    // (k+(1,1) fully, k+(1,0) and k+(0,1) by half). A tile hidden behind a
    // wall that rises above it isn't somewhere the cat can visibly stand.
    for (const [key, n] of nodes) {
      if (!n.walkable && n.landmark < 0) {
        continue;
      }
      const a = keyA(key);
      const b = keyB(key);
      for (const [da, db] of [
        [1, 1],
        [1, 0],
        [0, 1],
      ]) {
        const o = nodes.get(packKey(a - da, b - db));
        if (o && o.cell.z >= n.cell.z + 1) {
          nodes.set(key, { ...n, walkable: false, landmark: -1 });
          break;
        }
      }
    }
    return nodes;
  }
}

// ---------------------------------------------------------------------------
// Walking. The rule that makes it Escher: two tiles are connected if they
// LOOK connected on screen. In an isometric view, (x, y, z) and
// (x+1, y+1, z+1) land on the same spot, so each top face gets a screen key
// (rx - h, ry - h) and adjacency is decided purely by keys.
// ---------------------------------------------------------------------------

// A screen key (a, b), packed into one number so it works as a Map key.
// Both parts stay within [-MaxZ, N], well inside the offset.
export type Key = number;

const KEY_OFFSET = 64;
const KEY_STRIDE = 256;

export const packKey = (a: number, b: number): Key =>
  (a + KEY_OFFSET) * KEY_STRIDE + (b + KEY_OFFSET);
export const keyA = (k: Key) => Math.floor(k / KEY_STRIDE) - KEY_OFFSET;
export const keyB = (k: Key) => (k % KEY_STRIDE) - KEY_OFFSET;

export interface Node {
  cell: Cell;
  walkable: boolean;
  landmark: number; // -1 if none
}

export type NodeMap = Map<Key, Node>;

// rotCell rotates a column index by r quarter turns about the world center.
// `r & 3` (not `%`) so negative rotations wrap the same way Go's do.
export function rotCell(x: number, y: number, r: number): [number, number] {
  switch (r & 3) {
    case 1:
      return [N - 1 - y, x];
    case 2:
      return [N - 1 - x, N - 1 - y];
    case 3:
      return [y, N - 1 - x];
  }
  return [x, y];
}

export function keyOf(c: Cell, r: number): Key {
  const [rx, ry] = rotCell(c.x, c.y, r);
  const h = c.z + 1;
  return packKey(rx - h, ry - h);
}

// Neighbor order matters: it decides which of several shortest paths BFS
// picks, and must match the Go prototype for parity.
export const dirs: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// findPath returns keys from start to goal, or null if there's no way.
// If goal is a landmark, the path ends on a neighbor of it.
export function findPath(nodes: NodeMap, start: Key, goal: Key): Key[] | null {
  const goalIsLandmark = (nodes.get(goal)?.landmark ?? -1) >= 0;
  const prev = new Map<Key, Key>([[start, start]]);
  const queue: Key[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const a = keyA(cur);
    const b = keyB(cur);
    for (const [da, db] of dirs) {
      const nk = packKey(a + da, b + db);
      if (nk === goal && goalIsLandmark) {
        return walkBack(prev, cur, start);
      }
      if (prev.has(nk) || !nodes.get(nk)?.walkable) {
        continue;
      }
      prev.set(nk, cur);
      if (nk === goal) {
        return walkBack(prev, nk, start);
      }
      queue.push(nk);
    }
  }
  return null;
}

function walkBack(prev: Map<Key, Key>, end: Key, start: Key): Key[] {
  const path: Key[] = [];
  for (let k = end; ; k = prev.get(k)!) {
    path.push(k);
    if (k === start) {
      return path.reverse();
    }
  }
}

// settleCell runs when a rotation finishes. The cat is wherever it appears
// to be: if another tile now sits in front of it on screen, that's where it
// stands.
export function settleCell(nodes: NodeMap, cell: Cell, r: number): Cell {
  const n = nodes.get(keyOf(cell, r));
  return n?.walkable ? n.cell : cell;
}
