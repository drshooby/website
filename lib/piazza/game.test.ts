import { describe, expect, test } from "bun:test";
import { Game, type GameEvent } from "./game";
import { findPath, keyA, keyB, keyOf, MaxZ, packKey, settleCell, World } from "./world";

const DT = 1 / 60;

// tickUntil steps the game until it reports something, with a frame cap so a
// bug fails instead of hanging.
function tickUntil(g: Game, pred: (e: GameEvent[]) => boolean = (e) => e.length > 0) {
  for (let i = 0; i < 2000; i++) {
    const ev = g.tick(DT);
    if (pred(ev)) {
      return ev;
    }
  }
  throw new Error("no event");
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Game", () => {
  test("walks to Radiant and arrives", () => {
    const g = new Game(new World());
    g.goToLandmark(4);
    expect(tickUntil(g)).toEqual([{ type: "arrived", landmark: 4 }]);
    const lm = keyOf(g.world.landmarks[4].on, 0);
    const k = keyOf(g.cat.cell, 0);
    expect(g.nodes.get(k)?.walkable).toBe(true);
    expect(Math.abs(keyA(k) - keyA(lm)) + Math.abs(keyB(k) - keyB(lm))).toBe(1);
  });

  test("Veil is unreachable at r0 and reachable after one turn", () => {
    const g = new Game(new World());
    g.goToLandmark(2);
    expect(g.tick(DT)).toEqual([{ type: "unreachable", landmark: 2 }]);
    expect(g.turn(1)).toBe(true);
    expect(tickUntil(g)).toEqual([{ type: "turned", rot: 1 }]);
    g.goToLandmark(2);
    expect(tickUntil(g)).toEqual([{ type: "arrived", landmark: 2 }]);
  });

  test("turn is ignored while walking and while rotating", () => {
    const g = new Game(new World());
    g.goToLandmark(4);
    g.tick(DT);
    expect(g.cat.walking).toBe(true);
    expect(g.turn(1)).toBe(false);
    expect(g.rot).toBe(0);
    tickUntil(g);
    expect(g.turn(1)).toBe(true);
    expect(g.turn(1)).toBe(false);
    expect(g.rot).toBe(1);
  });

  test("clicks are ignored while busy", () => {
    const g = new Game(new World());
    g.goToLandmark(4);
    g.tick(DT);
    const path = g.cat.path;
    const end = keyOf(path![path!.length - 1], 0);
    const other = [...g.nodes].find(([k, n]) => n.walkable && k !== end && k !== keyOf(g.cat.cell, 0) && findPath(g.nodes, end, k))![0];
    g.clickKey(other);
    expect(g.cat.path).toBe(path);
    tickUntil(g);
    // the same click does something once the cat is idle
    g.clickKey(other);
    expect(g.cat.path).not.toBeNull();
  });

  test("a walk whose goal stops being walkable mid-way ends on a walkable node", () => {
    const g = new Game(new World());
    g.clickKey(keyOf(g.world.landmarks[1].on, 0)); // unwalkable landmark: no-op
    const goal = [...g.nodes].find(
      ([k, n]) => n.walkable && k !== keyOf(g.cat.cell, 0) && (findPath(g.nodes, keyOf(g.cat.cell, 0), k)?.length ?? 0) > 3,
    )![0];
    g.clickKey(goal);
    g.tick(DT);
    // what growTower can do to a tile under a walking cat
    g.nodes.set(goal, { ...g.nodes.get(goal)!, walkable: false });
    for (let i = 0; i < 600 && g.cat.walking; i++) {
      g.tick(DT);
    }
    expect(g.cat.walking).toBe(false);
    expect(g.nodes.get(keyOf(g.cat.cell, 0))?.walkable).toBe(true);
  });

  test("clicking a tile the cat can't reach says so", () => {
    const g = new Game(new World());
    const from = keyOf(g.cat.cell, 0);
    const far = [...g.nodes].find(([k, n]) => n.walkable && k !== from && !findPath(g.nodes, from, k))![0];
    g.clickKey(far);
    expect(g.tick(DT)).toEqual([{ type: "unreachable", landmark: -1 }]);
    expect(g.cat.walking).toBe(false);
  });

  test("a turn that hides the cat walks it out instead of jumping", () => {
    // Every (walkable cell, rotation, turn) where the turn leaves the cat's
    // tile hidden (e.g. the tower swinging in front of it): the cat must
    // step out along neighboring keys, never teleport.
    const world = new World();
    let hidden = 0;
    for (let r = 0; r < 4; r++) {
      for (const n of world.nodes(r).values()) {
        if (!n.walkable) continue;
        for (const dir of [1, -1] as const) {
          const g = new Game(world);
          g.rot = r;
          g.theta = (r * Math.PI) / 2;
          g.nodes = world.nodes(r);
          g.cat.cell = n.cell;
          // Where the turn leaves the cat, judged from the world alone.
          const r2 = (r + dir) & 3;
          const after = world.nodes(r2);
          const landed = settleCell(after, n.cell, r2);
          if (after.get(keyOf(landed, r2))?.walkable) continue;
          hidden++;
          g.turn(dir);
          tickUntil(g, (e) => e.some((x) => x.type === "turned"));
          expect(g.cat.walking).toBe(true);
          expect(g.cat.path![0]).toEqual(landed);
          const keys = g.cat.path!.map((c) => keyOf(c, r2));
          for (let i = 1; i < keys.length; i++) {
            const d = Math.abs(keyA(keys[i]) - keyA(keys[i - 1])) + Math.abs(keyB(keys[i]) - keyB(keys[i - 1]));
            expect(d).toBe(1);
          }
          for (let i = 0; i < 600 && g.busy; i++) g.tick(DT);
          expect(g.nodes.get(keyOf(g.cat.cell, r2))?.walkable).toBe(true);
        }
      }
    }
    expect(hidden).toBeGreaterThan(0);
  });

  test("the cat is always on a walkable node", () => {
    const rnd = mulberry32(1);
    const g = new Game(new World());
    for (let i = 0; i < 2000; i++) {
      const r = rnd();
      if (r < 0.1) {
        g.turn(rnd() < 0.5 ? 1 : -1);
      } else if (r < 0.2) {
        g.clickKey(packKey(Math.floor(rnd() * 25) - 12, Math.floor(rnd() * 25) - 12));
      } else if (r < 0.3) {
        g.goToLandmark(Math.floor(rnd() * 5));
      } else if (r < 0.31) {
        g.growTower();
      }
      g.tick(DT);
      // Whenever it's idle. (Right after a turn it may be mid-way out from
      // behind something that swung in front of it.)
      if (!g.busy) {
        expect(g.nodes.get(keyOf(g.cat.cell, g.rot & 3))?.walkable).toBe(true);
      }
    }
  });
});

describe("World", () => {
  test("clamps towerTop", () => {
    expect(new World({ towerTop: 99 }).towerTop).toBe(MaxZ - 2);
    expect(new World({ towerTop: NaN }).towerTop).toBe(6);
    expect(new World({ towerTop: 3 }).towerTop).toBe(6);
  });

  test("growTower stops at the cap", () => {
    const w = new World();
    for (let i = 0; i < 10; i++) {
      w.growTower();
    }
    expect(w.towerTop).toBe(10);
  });
});
