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
