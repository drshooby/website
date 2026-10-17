import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Cat, catWorldPos } from "./cat";
import { makeView, proj } from "./view";
import {
  type Cell,
  dirs,
  findPath,
  keyA,
  keyB,
  keyOf,
  type Key,
  MaxZ,
  N,
  packKey,
  World,
} from "./world";

// Golden files were written by the Go prototype (piazza/), so these tests
// prove the port lands on exactly the same world.
const golden = (name: string) => readFileSync(join(import.meta.dir, "golden", name), "utf8");

const cellId = (c: Cell) => `${c.x},${c.y},${c.z}`;

// reachable returns how many rotations each landmark needs at minimum,
// starting from start and allowing any number of turns.
function reachable(w: World, start: Cell): Map<number, number> {
  const best = new Map<string, number>([[cellId(start), 0]]);
  const lmBest = new Map<number, number>();
  const queue: Cell[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head];
    for (let r = 0; r < 4; r++) {
      const turns = best.get(cellId(c))! + (r !== 0 ? 1 : 0);
      const nodes = w.nodes(r);
      const from = keyOf(c, r);
      const seen = new Set<Key>([from]);
      const q: Key[] = [from];
      for (let qh = 0; qh < q.length; qh++) {
        const k = q[qh];
        const n = nodes.get(k);
        if (n?.walkable) {
          const old = best.get(cellId(n.cell));
          if (old === undefined || turns < old) {
            best.set(cellId(n.cell), turns);
            queue.push(n.cell);
          }
        }
        for (const [da, db] of dirs) {
          const nk = packKey(keyA(k) + da, keyB(k) + db);
          const nn = nodes.get(nk);
          if (nn && nn.landmark >= 0) {
            const old = lmBest.get(nn.landmark);
            if (old === undefined || turns < old) {
              lmBest.set(nn.landmark, turns);
            }
          }
          if (seen.has(nk) || !nn?.walkable) {
            continue;
          }
          seen.add(nk);
          q.push(nk);
        }
      }
    }
  }
  return lmBest;
}

// dump draws the screen-key grid: digits are walkable heights, letters are
// landmarks, # is a visible surface you can't stand on, @ is the start.
export function dump(w: World, r: number): string {
  const nodes = w.nodes(r);
  const start = keyOf(w.start, r);
  let out = "";
  for (let b = -MaxZ; b <= N; b++) {
    let row = "";
    for (let a = -MaxZ; a <= N; a++) {
      const k = packKey(a, b);
      const n = nodes.get(k);
      if (k === start) row += "@";
      else if (!n) row += " ";
      else if (n.landmark >= 0) row += w.landmarks[n.landmark].title[0];
      else if (n.walkable) row += String((n.cell.z + 1) % 10);
      else row += "#";
    }
    row = row.trimEnd();
    if (row !== "") out += row + "\n";
  }
  return out;
}

describe("world", () => {
  test.each([0, 1, 2, 3])("rotation %d matches the Go dump", (r) => {
    expect(dump(new World(), r)).toBe(golden(`rot${r}.txt`));
  });

  test("growing the tower matches the Go dump", () => {
    const w = new World();
    w.growTower();
    expect(dump(w, 0)).toBe(golden("rot0-grown.txt"));
  });

  test("shadow bitmasks match the Go ray-march", () => {
    const w = new World();
    let got = "";
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N; y++)
        for (let z = 0; z < MaxZ; z++) {
          const b = w.shadow(x, y, z);
          if (b !== 0) got += `${x},${y},${z}:${b}\n`;
        }
    expect(got).toBe(golden("shadows.txt"));
  });

  test("every landmark is reachable, and turning the world matters", () => {
    const w = new World();
    const lm = reachable(w, w.start);
    const turns = Object.fromEntries(w.landmarks.map((l, i) => [l.title, lm.get(i)]));
    expect(turns).toEqual({
      "David Shubov": 0,
      Relic: 0,
      Veil: 1,
      Blink: 1,
      Radiant: 0,
    });
  });
});

describe("walking", () => {
  // Walking to every landmark (from whichever rotation reaches it first) must
  // actually arrive, so the plaque opens. Rotation, path length and frame
  // counts are the Go prototype's.
  test("the cat arrives at every landmark", () => {
    const w = new World();
    const got: Record<string, [number, number, number]> = {};
    w.landmarks.forEach((l, i) => {
      for (let r = 0; r < 4; r++) {
        const nodes = w.nodes(r);
        const keys = findPath(nodes, keyOf(w.start, r), keyOf(l.on, r));
        if (!keys) continue;
        const cells = [w.start, ...keys.slice(1).map((k) => nodes.get(k)!.cell)];
        const cat = new Cat(w.start);
        cat.walk(cells, i);
        const v = makeView((r * Math.PI) / 2, 40);
        let frames = 0;
        while (cat.walking && frames < 10000) {
          if (cat.update(1 / 60, v)) break;
          frames++;
        }
        expect(cat.walking).toBe(false);
        expect(cat.target).toBe(i);
        got[l.title] = [r, keys.length, frames];
        break;
      }
    });
    expect(got).toEqual({
      "David Shubov": [0, 2, 19],
      Relic: [0, 12, 219],
      Veil: [1, 6, 99],
      Blink: [1, 3, 39],
      Radiant: [0, 11, 199],
    });
  });

  test("no path through the void", () => {
    const w = new World();
    // Relic's column is on the floating gallery; from rotation 2 there's no
    // way across to it.
    expect(findPath(w.nodes(2), keyOf(w.start, 2), keyOf(w.landmarks[1].on, 2))).toBeNull();
  });

  test("negative rotations wrap like Go's r & 3", () => {
    const w = new World();
    expect(keyOf(w.start, -1)).toBe(keyOf(w.start, 3));
  });
});

describe("catWorldPos", () => {
  test("projects to cat.pos on every segment of every landmark walk", () => {
    const w = new World();
    let checked = 0;
    w.landmarks.forEach((l, i) => {
      for (let r = 0; r < 4; r++) {
        const nodes = w.nodes(r);
        const keys = findPath(nodes, keyOf(w.start, r), keyOf(l.on, r));
        if (!keys) continue;
        const cells = [w.start, ...keys.slice(1).map((k) => nodes.get(k)!.cell)];
        const v = makeView((r * Math.PI) / 2, 40, 100, 80);
        for (let seg = 0; seg < cells.length - 1; seg++) {
          for (const t of [0, 0.3, 0.7]) {
            const cat = new Cat(w.start);
            cat.walk(cells, i);
            cat.seg = seg;
            cat.t = t;
            const wp = catWorldPos(cat, r);
            const a = proj(v, wp.x, wp.y, wp.z);
            const b = cat.pos(v);
            expect(Math.abs(a.x - b.x)).toBeLessThan(1e-9);
            expect(Math.abs(a.y - b.y)).toBeLessThan(1e-9);
            checked++;
          }
        }
        break;
      }
    });
    expect(checked).toBeGreaterThan(20);
  });

  test("at rest it is the cell's top center", () => {
    const cat = new Cat({ x: 3, y: 4, z: 2 });
    expect(catWorldPos(cat, 1)).toEqual({ x: 3.5, y: 4.5, z: 3 });
  });
});
