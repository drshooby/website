import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { Kind, MaxZ, N, World } from "./world";
import { ISO_DIR, fromThree, frameFor, groupRotationY, keyAtPoint, rotPoint, toThree, unrotVec } from "./space";
import { makeView, proj } from "./view";

// Small seeded generator so the random points are the same every run.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function threeCamera(r: number) {
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  cam.position.set(ISO_DIR[0] * 50, ISO_DIR[1] * 50, ISO_DIR[2] * 50);
  cam.up.set(0, 1, 0);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  const group = new THREE.Group();
  group.rotation.y = groupRotationY((r * Math.PI) / 2);
  group.updateMatrixWorld();
  return (x: number, y: number, z: number) => {
    const v = new THREE.Vector3(...toThree({ x, y, z }));
    group.localToWorld(v);
    return v.project(cam);
  };
}

describe("coordinate mapping", () => {
  test("toThree and fromThree are inverses", () => {
    const p = { x: 3.25, y: 7.5, z: 2 };
    expect(toThree(p)).toEqual([3.25 - N / 2, 2, 7.5 - N / 2]);
    expect(fromThree(toThree(p))).toEqual(p);
  });

  test("rotPoint is the continuous rotCell", () => {
    expect(rotPoint(2, 3, 0)).toEqual([2, 3]);
    expect(rotPoint(2, 3, 1)).toEqual([N - 3, 2]);
    expect(rotPoint(2, 3, 2)).toEqual([N - 2, N - 3]);
    expect(rotPoint(2, 3, 3)).toEqual([3, N - 2]);
  });
});

describe("keyAtPoint", () => {
  test("matches keyOf at every node's top center", () => {
    const w = new World();
    for (let r = 0; r < 4; r++) {
      for (const [key, node] of w.nodes(r)) {
        const p = { x: node.cell.x + 0.5, y: node.cell.y + 0.5, z: node.cell.z + 1 };
        expect(keyAtPoint(p, r)).toBe(key);
      }
    }
  });
});

describe("three camera", () => {
  test("reproduces the 2D projection", () => {
    const next = rng(7);
    for (let r = 0; r < 4; r++) {
      const theta = (r * Math.PI) / 2;
      const v = makeView(theta, 40, 0, 0, 0);
      const project = threeCamera(r);
      const c = proj(v, N / 2, N / 2, 0);
      let kx = 0;
      let ky = 0;
      for (let i = 0; i < 30; i++) {
        const [x, y, z] = [next() * N, next() * N, next() * MaxZ];
        const p = proj(v, x, y, z);
        const n = project(x, y, z);
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        if (i === 0) {
          kx = n.x / dx;
          ky = -n.y / dy;
          expect(kx).toBeGreaterThan(0);
          expect(ky).toBeGreaterThan(0);
        }
        expect(Math.abs(n.x - kx * dx)).toBeLessThan(1e-6);
        expect(Math.abs(-n.y - ky * dy)).toBeLessThan(1e-6);
      }
    }
  });

  test("(x,y,z) and (x+1,y+1,z+1) land on the same screen point", () => {
    for (let r = 0; r < 4; r++) {
      const project = threeCamera(r);
      const [x, y, z] = [2.3, 4.1, 1.7];
      const a = project(x, y, z);
      const [ux, uy] = unrotVec(1, 1, r);
      const b = project(x + ux, y + uy, z + 1);
      expect(a.x).toBeCloseTo(b.x, 9);
      expect(a.y).toBeCloseTo(b.y, 9);
    }
  });
});

describe("frameFor", () => {
  const sizes: [number, number][] = [
    [1920, 1080],
    [1280, 600],
    [2560, 1080],
    [1000, 1000],
    [820, 1180],
  ];
  for (const [w, h] of sizes) {
    test(`fits everything at ${w}x${h}`, () => {
      const world = new World({ towerTop: 10 });
      const f = frameFor(w, h, 10);
      expect(f.ox).toBe(w / 2);
      expect(f.oy).toBe(h / 2);
      // 0.7, not 0.85: fitting the tallest tower plus flag inside the margins caps s near 0.74 of the naive scale.
      expect(f.s).toBeGreaterThanOrEqual(0.7 * Math.min(w / 24, h / 19.5));
      for (let r = 0; r < 4; r++) {
        const v = { ...f, theta: (r * Math.PI) / 2 };
        for (let x = 0; x < N; x++)
          for (let y = 0; y < N; y++)
            for (let z = 0; z < MaxZ; z++) {
              if (world.at(x, y, z) === Kind.Air) continue;
              for (const dx of [0, 1])
                for (const dy of [0, 1])
                  for (const dz of [0, 1]) {
                    const p = proj(v, x + dx, y + dy, z + dz);
                    expect(p.x).toBeGreaterThanOrEqual(24);
                    expect(p.x).toBeLessThanOrEqual(w - 24);
                    expect(p.y).toBeGreaterThanOrEqual(24);
                    expect(p.y).toBeLessThanOrEqual(h - 24);
                  }
            }
      }
    });
  }
});
