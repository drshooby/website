// Persistence for return visits. The one engine module allowed to touch
// localStorage, and it does so defensively: private mode, SSR, quota errors
// and hand-edited values must all behave like a first visit and never throw.

import type { TutorialStep } from "./tutorial";
import { MaxZ } from "./world";

export interface Memory {
  visited: boolean;
  tutorial: TutorialStep;
  towerTop: number;
}

export const MEMORY_KEY = "piazza:v1";

const STEPS: readonly string[] = ["radiant", "turn", "done"];
const MIN_TOP = 6; // same range World clamps its tower to
const MAX_TOP = MaxZ - 2;

const defaults = (): Memory => ({ visited: false, tutorial: "radiant", towerTop: MIN_TOP });

// Resolve the storage to use; undefined means the browser's, null means none.
function resolve(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadMemory(storage?: Storage | null): Memory {
  const out = defaults();
  try {
    const raw = resolve(storage)?.getItem(MEMORY_KEY);
    if (!raw) return out;
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null || Array.isArray(v)) return out;
    const o = v as Record<string, unknown>;
    if (typeof o.visited === "boolean") out.visited = o.visited;
    if (typeof o.tutorial === "string" && STEPS.includes(o.tutorial)) out.tutorial = o.tutorial as TutorialStep;
    if (typeof o.towerTop === "number" && Number.isFinite(o.towerTop)) {
      out.towerTop = Math.min(MAX_TOP, Math.max(MIN_TOP, Math.round(o.towerTop)));
    }
  } catch {
    return defaults();
  }
  return out;
}

export function saveMemory(patch: Partial<Memory>, storage?: Storage | null): void {
  try {
    const s = resolve(storage);
    if (!s) return;
    s.setItem(MEMORY_KEY, JSON.stringify({ ...loadMemory(s), ...patch }));
  } catch {
    // Storage is a nicety; losing it just means a first-visit experience.
  }
}
