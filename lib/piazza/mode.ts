// Picks how the page is presented. PAINTING_QUERY is reused verbatim in CSS
// and an inline script, so pickMode's painting rule must stay exactly
// equivalent to it: (coarse and width <= 600) or width <= 480.

import { MEMORY_KEY } from "./memory";

export type Mode = "play" | "painting" | "fallback";

export const PAINTING_QUERY = "(pointer: coarse) and (max-width: 600px), (max-width: 480px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function pickMode(env: { coarse: boolean; width: number; webgl: boolean }): Mode {
  if (!env.webgl) return "fallback";
  if ((env.coarse && env.width <= 600) || env.width <= 480) return "painting";
  return "play";
}

// The entrance: only the playable piazza has one, never under reduced
// motion; a returning visitor gets the short form. null = start settled.
export type Entrance = "full" | "short";

export function pickEntrance(env: { mode: Mode; reducedMotion: boolean; visited: boolean }): Entrance | null {
  if (env.mode !== "play" || env.reducedMotion) return null;
  return env.visited ? "short" : "full";
}

// If the page's script never takes over the entrance (it failed to load),
// the title card settles by itself after this long: just above the
// entrance's own worst case (5.5s, components/Piazza/useEntrance.ts).
export const ENTRANCE_FAILSAFE_MS = 6000;

// Inline <script> rendered at the top of the home page (app/page.tsx) only,
// so it runs before the piazza's first paint and never on other routes: sets
// html[data-mode] by pickMode's rule so CSS lays the page out for the right
// mode before hydration, and, by pickEntrance's rule, html[data-phase]
// ="title" plus html[data-entrance] so a first paint already shows the title
// card (no flash of the settled corner). `visited` is read the way
// loadMemory reads it. Built from the constants above so the rules live here
// only. Any failure leaves data-mode absent, which CSS treats as fallback;
// a failure in the entrance part only leaves the page settled. The failsafe
// only advances a phase that is still there: once the piazza unmounts (a
// client-side navigation away) it clears the phase, and it stays cleared.
export const MODE_SCRIPT = `(function(){try{var g=false;try{var c=document.createElement("canvas");g=!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){}var d=document.documentElement.dataset;var m=!g?"fallback":window.matchMedia(${JSON.stringify(PAINTING_QUERY)}).matches?"painting":"play";d.mode=m;try{if(m==="play"&&!window.matchMedia(${JSON.stringify(REDUCED_MOTION_QUERY)}).matches){var v=false;try{var o=JSON.parse(window.localStorage.getItem(${JSON.stringify(MEMORY_KEY)}));v=!!o&&typeof o==="object"&&o.visited===true}catch(e){}d.entrance=v?"short":"full";d.phase="title";window.setTimeout(function(){if(d.phase&&d.phase!=="settled")d.phase="settled"},${ENTRANCE_FAILSAFE_MS})}}catch(e){}}catch(e){}})();`;
