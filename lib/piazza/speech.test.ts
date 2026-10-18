import { describe, expect, test } from "bun:test";
import { unreachableLine } from "./speech";
import { Prop, World } from "./world";

describe("what the cat says", () => {
  const world = new World();
  const byProp = (p: Prop) => world.landmarks.find((l) => l.prop === p)!;

  test("a tile it can't reach", () => {
    expect(unreachableLine(undefined)).toBe("Can't get there from here. Try turning the world?");
  });

  test("a project it can't reach, by name", () => {
    expect(unreachableLine(byProp(Prop.Statue))).toBe("Can't reach Veil from here. Try turning the world?");
  });

  test("the easel is David's portrait: him, not his name", () => {
    expect(unreachableLine(byProp(Prop.Easel))).toBe("Can't reach him from here. Try turning the world?");
  });
});
