import { describe, expect, test } from "bun:test";
import { Game, type GameEvent } from "./game";
import { keyA, keyB, keyOf, MaxZ, packKey, World } from "./world";

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
    const other = [...g.nodes].find(
      ([k, n]) => n.walkable && k !== keyOf(g.cat.cell, 0) && k !== keyOf(path![path!.length - 1], 0),
    )![0];
    g.clickKey(other);
    expect(g.cat.path).toBe(path);
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
      }
      const events = g.tick(DT);
      if (!g.busy || events.some((e) => e.type === "turned")) {
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
