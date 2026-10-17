import { describe, expect, test } from "bun:test";
import { MEMORY_KEY, loadMemory, saveMemory, type Memory } from "./memory";

// A tiny in-memory Storage.
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial));
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

const throwing = (): Storage => {
  const boom = () => {
    throw new Error("denied");
  };
  return { ...fakeStorage(), getItem: boom, setItem: boom };
};

const DEFAULTS: Memory = { visited: false, tutorial: "radiant", towerTop: 6 };

describe("memory", () => {
  test("empty storage gives the defaults", () => {
    expect(loadMemory(fakeStorage())).toEqual(DEFAULTS);
  });

  test("a saved patch round-trips and merges", () => {
    const s = fakeStorage();
    saveMemory({ visited: true }, s);
    saveMemory({ tutorial: "turn", towerTop: 8 }, s);
    expect(loadMemory(s)).toEqual({ visited: true, tutorial: "turn", towerTop: 8 });
  });

  test("garbage JSON falls back to the defaults", () => {
    expect(loadMemory(fakeStorage({ [MEMORY_KEY]: "{nope" }))).toEqual(DEFAULTS);
    expect(loadMemory(fakeStorage({ [MEMORY_KEY]: "null" }))).toEqual(DEFAULTS);
    expect(loadMemory(fakeStorage({ [MEMORY_KEY]: "[1]" }))).toEqual(DEFAULTS);
  });

  test("fields are validated individually", () => {
    const s = fakeStorage({ [MEMORY_KEY]: JSON.stringify({ visited: true, tutorial: 7, towerTop: "x" }) });
    expect(loadMemory(s)).toEqual({ visited: true, tutorial: "radiant", towerTop: 6 });
    const t = fakeStorage({ [MEMORY_KEY]: JSON.stringify({ tutorial: "bogus", visited: "yes" }) });
    expect(loadMemory(t)).toEqual(DEFAULTS);
  });

  test("towerTop is clamped to [6, MaxZ - 2]", () => {
    const load = (n: number) => loadMemory(fakeStorage({ [MEMORY_KEY]: JSON.stringify({ towerTop: n }) })).towerTop;
    expect(load(99)).toBe(10);
    expect(load(-3)).toBe(6);
    expect(load(8.4)).toBe(8);
  });

  test("throwing storage yields the defaults and never throws", () => {
    expect(loadMemory(throwing())).toEqual(DEFAULTS);
    expect(() => saveMemory({ visited: true }, throwing())).not.toThrow();
  });

  test("null storage yields the defaults", () => {
    expect(loadMemory(null)).toEqual(DEFAULTS);
    expect(() => saveMemory({ visited: true }, null)).not.toThrow();
  });

  test("no localStorage global (SSR) is safe", () => {
    expect(loadMemory()).toEqual(DEFAULTS);
    expect(() => saveMemory({ visited: true })).not.toThrow();
  });
});
