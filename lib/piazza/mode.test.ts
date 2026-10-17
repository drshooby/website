import { describe, expect, test } from "bun:test";
import { PAINTING_QUERY, pickMode } from "./mode";

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
