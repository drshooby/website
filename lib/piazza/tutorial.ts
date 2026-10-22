// First-visit waypoint state machine: walk to Radiant, then turn the world.
// "done" is terminal, and "dismissed" finishes from anywhere.

export type TutorialStep = "radiant" | "turn" | "done";

export type TutorialEvent =
  | { type: "plaqueClosed"; title: string } // an in-world plaque closed
  | { type: "turned" }
  | { type: "dismissed" };

export function nextStep(step: TutorialStep, e: TutorialEvent): TutorialStep {
  if (step === "done" || e.type === "dismissed") return "done";
  if (e.type === "turned") return "done";
  if (step === "radiant" && e.title === "Radiant") return "turn";
  return step;
}
