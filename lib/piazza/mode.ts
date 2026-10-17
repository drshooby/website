// Picks how the page is presented. PAINTING_QUERY is reused verbatim in CSS
// and an inline script, so pickMode's painting rule must stay exactly
// equivalent to it: (coarse and width <= 600) or width <= 480.

export type Mode = "play" | "painting" | "fallback";

export const PAINTING_QUERY = "(pointer: coarse) and (max-width: 600px), (max-width: 480px)";

export function pickMode(env: { coarse: boolean; width: number; webgl: boolean }): Mode {
  if (!env.webgl) return "fallback";
  if ((env.coarse && env.width <= 600) || env.width <= 480) return "painting";
  return "play";
}

// Inline <script> run at the top of <body>, before first paint: sets
// html[data-mode] by pickMode's rule so CSS lays the page out for the right
// mode before hydration. Built from PAINTING_QUERY so the rule lives here
// only. Any failure leaves data-mode absent, which CSS treats as fallback.
export const MODE_SCRIPT = `(function(){try{var g=false;try{var c=document.createElement("canvas");g=!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){}document.documentElement.dataset.mode=!g?"fallback":window.matchMedia(${JSON.stringify(PAINTING_QUERY)}).matches?"painting":"play"}catch(e){}})();`;
