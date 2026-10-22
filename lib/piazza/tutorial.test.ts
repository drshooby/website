import { describe, expect, test } from "bun:test";
import { nextStep, type TutorialEvent, type TutorialStep } from "./tutorial";

describe("tutorial", () => {
  test("closing the Radiant plaque moves on to turning", () => {
    expect(nextStep("radiant", { type: "plaqueClosed", title: "Radiant" })).toBe("turn");
  });

  test("closing another plaque does not advance", () => {
    expect(nextStep("radiant", { type: "plaqueClosed", title: "Relic" })).toBe("radiant");
  });

  test("turning finishes the tutorial from radiant or turn", () => {
    expect(nextStep("radiant", { type: "turned" })).toBe("done");
    expect(nextStep("turn", { type: "turned" })).toBe("done");
  });

  test("dismissing finishes from any step", () => {
    for (const s of ["radiant", "turn", "done"] as TutorialStep[]) {
      expect(nextStep(s, { type: "dismissed" })).toBe("done");
    }
  });

  test("done is sticky", () => {
    const events: TutorialEvent[] = [
      { type: "plaqueClosed", title: "Radiant" },
      { type: "turned" },
      { type: "dismissed" },
    ];
    for (const e of events) expect(nextStep("done", e)).toBe("done");
  });
});
