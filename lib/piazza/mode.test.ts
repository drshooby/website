import { describe, expect, test } from "bun:test";
import { MODE_SCRIPT, PAINTING_QUERY, pickMode } from "./mode";

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

describe("MODE_SCRIPT", () => {
  // Runs the inline script against a fake document and matchMedia, and
  // checks it agrees with pickMode.
  function run(env: { coarse: boolean; width: number; webgl: boolean | "throws" }) {
    const dataset: Record<string, string> = {};
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
        expect(q).toBe(PAINTING_QUERY);
        return {
          matches: (env.coarse && env.width <= 600) || env.width <= 480,
        };
      },
    };
    new Function("document", "window", MODE_SCRIPT)(document, window);
    return dataset.mode;
  }

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
  });
});
