// What the cat says. Its lines live here, beside the rules that trigger
// them, so they're plain data the UI shows and tests can pin.

import { Prop, type Landmark } from "./world";

const NUDGE = "Try turning the world?";

// unreachableLine is the cat's line when a walk has no way there from the
// current angle: a tile (undefined) or a landmark. The easel is David's own
// portrait, so the cat calls him "him" rather than reading out his name.
export function unreachableLine(lm: Landmark | undefined): string {
  if (!lm) {
    return `Can't get there from here. ${NUDGE}`;
  }
  const who = lm.prop === Prop.Easel ? "him" : lm.title;
  return `Can't reach ${who} from here. ${NUDGE}`;
}
