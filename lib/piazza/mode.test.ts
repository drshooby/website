import { describe, expect, test } from "bun:test";
import { MEMORY_KEY } from "./memory";
import { ENTRANCE_FAILSAFE_MS, MODE_SCRIPT, PAINTING_QUERY, REDUCED_MOTION_QUERY, pickEntrance, pickMode } from "./mode";

describe("pickMode", () => {
  test("phones get the painting", () => {
    expect(pickMode({ coarse: true, width: 390, webgl: true })).toBe("painting");
  });

  test("tablets play", () => {
    expect(pickMode({ coarse: true, width: 820, webgl: true })).toBe("play");
  });

  test("desktops play, unless the window is very narrow", () => {
    expect(pickMode({ coarse: false, width: 1440, webgl: true })).toBe("play");
    expect(pickMode({ coarse: false, width: 420, webgl: true })).toBe("painting");
  });

  test("no WebGL is the fallback regardless of the rest", () => {
    expect(pickMode({ coarse: true, width: 390, webgl: false })).toBe("fallback");
    expect(pickMode({ coarse: false, width: 1440, webgl: false })).toBe("fallback");
  });

  test("matches PAINTING_QUERY at its edges", () => {
    expect(PAINTING_QUERY).toBe("(pointer: coarse) and (max-width: 600px), (max-width: 480px)");
    const m = (coarse: boolean, width: number) => pickMode({ coarse, width, webgl: true });
    expect(m(true, 600)).toBe("painting");
    expect(m(true, 601)).toBe("play");
    expect(m(false, 480)).toBe("painting");
    expect(m(false, 481)).toBe("play");
  });
});

describe("pickEntrance", () => {
  test("only play mode, and never under reduced motion", () => {
    for (const visited of [true, false]) {
      expect(pickEntrance({ mode: "painting", reducedMotion: false, visited })).toBeNull();
      expect(pickEntrance({ mode: "fallback", reducedMotion: false, visited })).toBeNull();
      expect(pickEntrance({ mode: "play", reducedMotion: true, visited })).toBeNull();
    }
  });

  test("first visit is full, a return visit short", () => {
    expect(pickEntrance({ mode: "play", reducedMotion: false, visited: false })).toBe("full");
    expect(pickEntrance({ mode: "play", reducedMotion: false, visited: true })).toBe("short");
  });
});

describe("MODE_SCRIPT", () => {
  type Env = {
    coarse: boolean;
    width: number;
    webgl: boolean | "throws";
    reduced?: boolean;
    stored?: string | null | "throws";
  };
  // Runs the inline script against a fake document, matchMedia and
  // storage, and returns what it wrote plus the failsafe it scheduled.
  function exec(env: Env) {
    const dataset: Record<string, string> = {};
    const timers: { fn: () => void; ms: number }[] = [];
    const document = {
      documentElement: { dataset },
      createElement: () => ({
        getContext: () => {
          if (env.webgl === "throws") throw new Error("no gl");
          return env.webgl ? {} : null;
        },
      }),
    };
    const window = {
      matchMedia: (q: string) => {
        if (q === REDUCED_MOTION_QUERY) return { matches: !!env.reduced };
        expect(q).toBe(PAINTING_QUERY);
        return { matches: (env.coarse && env.width <= 600) || env.width <= 480 };
      },
      localStorage: {
        getItem: (k: string) => {
          expect(k).toBe(MEMORY_KEY);
          if (env.stored === "throws") throw new Error("denied");
          return env.stored ?? null;
        },
      },
      setTimeout: (fn: () => void, ms: number) => timers.push({ fn, ms }),
    };
    new Function("document", "window", MODE_SCRIPT)(document, window);
    return { dataset, timers };
  }
  const run = (env: Env) => exec(env).dataset.mode;

  test("agrees with pickMode", () => {
    for (const coarse of [true, false])
      for (const width of [390, 480, 481, 600, 601, 1440])
        for (const webgl of [true, false])
          expect(run({ coarse, width, webgl })).toBe(pickMode({ coarse, width, webgl }));
  });

  test("a throwing WebGL probe is the fallback", () => {
    expect(run({ coarse: false, width: 1440, webgl: "throws" })).toBe("fallback");
  });

  test("leaves data-mode absent if anything else throws", () => {
    const dataset: Record<string, string> = {};
    const document = {
      documentElement: { dataset },
      createElement: () => ({ getContext: () => ({}) }),
    };
    expect(() =>
      new Function("document", "window", MODE_SCRIPT)(document, {}),
    ).not.toThrow();
    expect(dataset.mode).toBeUndefined();
    expect(dataset.phase).toBeUndefined();
  });

  test("entrance agrees with pickEntrance", () => {
    const stores: [string | null, boolean][] = [
      [null, false],
      [JSON.stringify({ visited: true }), true],
      [JSON.stringify({ visited: false, tutorial: "done" }), false],
      [JSON.stringify({ visited: "yes" }), false],
      ["[true]", false],
      ["null", false],
      ["{not json", false],
    ];
    for (const width of [390, 1440])
      for (const webgl of [true, false])
        for (const reduced of [true, false])
          for (const [stored, visited] of stores) {
            const { dataset } = exec({ coarse: true, width, webgl, reduced, stored });
            const mode = pickMode({ coarse: true, width, webgl });
            const want = pickEntrance({ mode, reducedMotion: reduced, visited });
            expect<string | null>(dataset.entrance ?? null).toBe(want);
            expect<string | null>(dataset.phase ?? null).toBe(want ? "title" : null);
          }
  });

  test("unreadable storage is a first visit", () => {
    const { dataset } = exec({ coarse: false, width: 1440, webgl: true, stored: "throws" });
    expect(dataset.mode).toBe("play");
    expect(dataset.entrance).toBe("full");
    expect(dataset.phase).toBe("title");
  });

  test("a failing entrance probe still sets the mode, and starts settled", () => {
    const dataset: Record<string, string> = {};
    const document = { documentElement: { dataset }, createElement: () => ({ getContext: () => ({}) }) };
    const window = {
      matchMedia: (q: string) => {
        if (q === REDUCED_MOTION_QUERY) throw new Error("old browser");
        return { matches: false };
      },
    };
    new Function("document", "window", MODE_SCRIPT)(document, window);
    expect(dataset.mode).toBe("play");
    expect(dataset.phase).toBeUndefined();
  });

  test("the title card settles by itself if nothing takes over", () => {
    const { dataset, timers } = exec({ coarse: false, width: 1440, webgl: true });
    expect(timers.map((t) => t.ms)).toEqual([ENTRANCE_FAILSAFE_MS]);
    timers[0].fn();
    expect(dataset.phase).toBe("settled");
  });
});
